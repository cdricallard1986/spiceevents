import { describe, expect, it, vi } from "vitest";
import { MESSAGES_CONNEXION, traiterConnexion, type DependancesConnexion, type MagasinTentatives, type ResultatMotDePasse } from "./connexion";
import { DUREE_MINIMALE_MS, LIMITE_CONNEXION, empreinteTentative, type TypeTentative } from "./limite";

const SECRET = "secret-de-test";
const BON = { email: "cedric@spiceevents.fr", motDePasse: "Bon-mot-de-passe-1" };

/** Faux compteurs en mémoire (mêmes règles que la table `tentatives_connexion`). */
function memoire(initial: Partial<Record<TypeTentative, number>> = {}) {
  const lignes: { type: TypeTentative; empreinte: string }[] = [];
  const magasin: MagasinTentatives = {
    compter: vi.fn(async (type: TypeTentative, empreinte: string) => (initial[type] ?? 0) + lignes.filter((l) => l.type === type && l.empreinte === empreinte).length),
    enregistrer: vi.fn(async (type: TypeTentative, empreinte: string) => {
      lignes.push({ type, empreinte });
    }),
  };
  return { magasin, lignes };
}

function dependances(surcharges: Partial<DependancesConnexion> = {}, motDePasse: ResultatMotDePasse = "ok", admin: boolean | Error = true) {
  let horloge = 1_000_000;
  const attentes: number[] = [];
  const d: DependancesConnexion = {
    production: true,
    ip: "203.0.113.7",
    secret: SECRET,
    tentatives: memoire().magasin,
    auth: {
      verifierMotDePasse: vi.fn(async () => {
        horloge += 200;
        return motDePasse;
      }),
      estAdmin: vi.fn(async () => {
        if (admin instanceof Error) throw admin;
        return admin;
      }),
      deconnecterLocalement: vi.fn(async () => {}),
    },
    maintenant: () => horloge,
    attendre: vi.fn(async (ms: number) => {
      attentes.push(ms);
      horloge += ms;
    }),
    journal: { info: vi.fn(), avertir: vi.fn(), erreur: vi.fn() },
    ...surcharges,
  };
  return { d, attentes };
}

describe("traiterConnexion — cas nominal", () => {
  it("connecte un administrateur et compte la tentative par IP", async () => {
    const { magasin, lignes } = memoire();
    const { d } = dependances({ tentatives: magasin });
    expect(await traiterConnexion(BON, d)).toEqual({ statut: "connecte" });
    expect(d.auth.verifierMotDePasse).toHaveBeenCalledWith(BON.email, BON.motDePasse);
    expect(lignes).toEqual([{ type: "ip", empreinte: empreinteTentative("ip", "203.0.113.7", SECRET) }]);
  });

  it("vérifie le mot de passe avec l'email normalisé", async () => {
    const { d } = dependances();
    await traiterConnexion({ email: " Cedric@SpiceEvents.FR ", motDePasse: BON.motDePasse }, d);
    expect(d.auth.verifierMotDePasse).toHaveBeenCalledWith("cedric@spiceevents.fr", BON.motDePasse);
  });
});

describe("traiterConnexion — durée minimale", () => {
  it.each([
    ["succès", "ok" as const],
    ["mauvais mot de passe", "refuse" as const],
  ])("ne répond jamais en moins de 1,5 s (%s)", async (_cas, resultat) => {
    const { d, attentes } = dependances({}, resultat);
    await traiterConnexion(BON, d);
    // 200 ms simulées pour Supabase : il reste 1,3 s à attendre.
    expect(attentes).toEqual([DUREE_MINIMALE_MS - 200]);
  });

  it("attend aussi sur une erreur de saisie et sur un blocage", async () => {
    const saisie = dependances();
    await traiterConnexion({ email: "", motDePasse: "" }, saisie.d);
    expect(saisie.attentes).toEqual([DUREE_MINIMALE_MS]);

    const bloque = dependances({ tentatives: memoire({ ip: LIMITE_CONNEXION.parIp }).magasin });
    await traiterConnexion(BON, bloque.d);
    expect(bloque.attentes).toEqual([DUREE_MINIMALE_MS]);
  });

  it("n'attend pas de plus quand Supabase a déjà été lent", async () => {
    const { d, attentes } = dependances();
    let horloge = 0;
    d.maintenant = () => horloge;
    d.auth.verifierMotDePasse = async () => {
      horloge += 2000;
      return "refuse";
    };
    await traiterConnexion(BON, d);
    expect(attentes).toEqual([]);
  });
});

describe("traiterConnexion — erreurs", () => {
  it("message générique pour un mauvais mot de passe, et échec compté pour le compte", async () => {
    const { magasin, lignes } = memoire();
    const { d } = dependances({ tentatives: magasin }, "refuse");
    expect(await traiterConnexion(BON, d)).toEqual({ statut: "erreur", message: "Email ou mot de passe incorrect.", erreurs: {}, email: BON.email });
    expect(lignes.map((l) => l.type)).toEqual(["ip", "compte"]);
    expect(lignes[1].empreinte).toBe(empreinteTentative("compte", BON.email, SECRET));
  });

  it("valide la saisie avant tout appel à Supabase", async () => {
    const { d } = dependances();
    const etat = await traiterConnexion({ email: "pas-un-email", motDePasse: "" }, d);
    expect(etat).toMatchObject({ statut: "erreur", message: MESSAGES_CONNEXION.validation, email: "pas-un-email" });
    expect(etat.statut === "erreur" && Object.keys(etat.erreurs)).toEqual(["email", "motDePasse"]);
    expect(d.auth.verifierMotDePasse).not.toHaveBeenCalled();
  });

  it("déconnecte aussitôt (cet appareil) un compte sans droit d'accès", async () => {
    const { d } = dependances({}, "ok", false);
    expect(await traiterConnexion(BON, d)).toMatchObject({ statut: "erreur", message: "Ce compte n'a pas accès au back office." });
    expect(d.auth.deconnecterLocalement).toHaveBeenCalledOnce();
  });

  it("refuse et déconnecte si est_admin() ne répond pas", async () => {
    const { d } = dependances({}, "ok", new Error("réseau"));
    expect(await traiterConnexion(BON, d)).toMatchObject({ statut: "erreur", message: MESSAGES_CONNEXION.indisponible });
    expect(d.auth.deconnecterLocalement).toHaveBeenCalledOnce();
  });

  it("signale une panne de Supabase Auth sans la compter comme un échec", async () => {
    const { magasin, lignes } = memoire();
    const { d } = dependances({ tentatives: magasin }, "indisponible");
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.indisponible });
    expect(lignes.map((l) => l.type)).toEqual(["ip"]);
  });
});

describe("traiterConnexion — limite des tentatives", () => {
  it("bloque une IP au-delà du seuil, avant même de vérifier le mot de passe", async () => {
    const { d } = dependances({ tentatives: memoire({ ip: LIMITE_CONNEXION.parIp }).magasin });
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." });
    expect(d.auth.verifierMotDePasse).not.toHaveBeenCalled();
  });

  it("bloque un compte après trop d'échecs (même avec le bon mot de passe)", async () => {
    const { d } = dependances({ tentatives: memoire({ compte: LIMITE_CONNEXION.parCompte }).magasin });
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.limite });
    expect(d.auth.verifierMotDePasse).not.toHaveBeenCalled();
  });

  it(`bloque la ${LIMITE_CONNEXION.parCompte + 1}e tentative après ${LIMITE_CONNEXION.parCompte} mauvais mots de passe`, async () => {
    const { magasin } = memoire();
    const { d } = dependances({ tentatives: magasin }, "refuse");
    for (let i = 0; i < LIMITE_CONNEXION.parCompte; i++) {
      expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.identifiants });
    }
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.limite });
    expect(d.auth.verifierMotDePasse).toHaveBeenCalledTimes(LIMITE_CONNEXION.parCompte);
  });

  it("ne compte pas les connexions réussies pour le compte (on ne peut pas bloquer Cédric avec son seul email)", async () => {
    const { magasin, lignes } = memoire();
    const { d } = dependances({ tentatives: magasin, ip: null });
    await traiterConnexion(BON, d);
    expect(lignes).toEqual([]);
  });

  it("échoue fermé si la base ne répond pas", async () => {
    const enPanne: MagasinTentatives = {
      compter: async () => {
        throw new Error("base indisponible");
      },
      enregistrer: async () => {},
    };
    const { d } = dependances({ tentatives: enPanne });
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.indisponible });
    expect(d.auth.verifierMotDePasse).not.toHaveBeenCalled();
    expect(d.journal.erreur).toHaveBeenCalled();
  });

  it("échoue fermé si la tentative ne peut pas être enregistrée", async () => {
    const { magasin } = memoire();
    magasin.enregistrer = async () => {
      throw new Error("insertion refusée");
    };
    const { d } = dependances({ tentatives: magasin });
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.indisponible });
    expect(d.auth.verifierMotDePasse).not.toHaveBeenCalled();
  });

  it("refuse par prudence si le secret d'empreinte manque", async () => {
    const { d } = dependances({ secret: null });
    expect(await traiterConnexion(BON, d)).toMatchObject({ message: MESSAGES_CONNEXION.indisponible });
    expect(d.auth.verifierMotDePasse).not.toHaveBeenCalled();
  });

  it("laisse passer sans clé service_role (développement local)", async () => {
    const { d } = dependances({ tentatives: null, production: false });
    expect(await traiterConnexion(BON, d)).toEqual({ statut: "connecte" });
  });
});
