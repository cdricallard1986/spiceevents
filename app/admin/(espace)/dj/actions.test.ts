import { beforeEach, describe, expect, it, vi } from "vitest";
import { EQUIPE_INITIALE } from "@/contenu/equipe";
import { formulaireDepuisMembre } from "@/lib/equipe/schema";

/**
 * Server Actions de la section DJ, avec une garde et un client Supabase
 * simulés : garde d'abord, Zod ensuite, écriture par le client de session,
 * puis revalidation de l'étiquette « equipe ».
 */

type Appel = { table: string; operations: [string, unknown[]][] };
type Reponse = { data: unknown; error: { code?: string; message: string } | null };

const etat = vi.hoisted(() => ({
  appels: [] as Appel[],
  repondre: (() => ({ data: null, error: null })) as (appel: Appel) => Reponse,
  admin: true,
  envois: [] as string[],
}));

function fauxClient() {
  return {
    from(table: string) {
      const appel: Appel = { table, operations: [] };
      etat.appels.push(appel);
      const chaine: Record<string, unknown> = new Proxy(
        {},
        {
          get(_c, nom: string) {
            if (nom === "then") {
              return (ok: (r: Reponse) => unknown, ko: (e: unknown) => unknown) => Promise.resolve(etat.repondre(appel)).then(ok, ko);
            }
            return (...args: unknown[]) => {
              appel.operations.push([nom, args]);
              return chaine;
            };
          },
        },
      );
      return chaine;
    },
    storage: {
      from: (bucket: string) => ({
        createSignedUploadUrl: async (chemin: string) => {
          etat.envois.push(`${bucket}:${chemin}`);
          return { data: { path: chemin, token: "jeton" }, error: null };
        },
      }),
    },
  };
}

vi.mock("@/lib/admin/garde", () => ({
  exigerAdmin: vi.fn(async () => {
    if (!etat.admin) throw new Error("NEXT_REDIRECT");
    return { supabase: fauxClient(), utilisateur: { id: "u1" } };
  }),
}));
const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }));

const actions = await import("./actions");
const { changerPublicationMembre, creerMembre, creerUrlEnvoiMembre, echangerOrdreMembres, enregistrerMembre, supprimerMembre } = actions;
const { exigerAdmin } = await import("@/lib/admin/garde");

const LIGNE = EQUIPE_INITIALE[1];
const ID = LIGNE.id;
const AUTRE = EQUIPE_INITIALE[2].id;
const FICHE = formulaireDepuisMembre(LIGNE);

const operations = (appel: Appel) => appel.operations.map(([nom]) => nom);

beforeEach(() => {
  etat.appels = [];
  etat.envois = [];
  etat.admin = true;
  etat.repondre = () => ({ data: LIGNE, error: null });
  revalidateTag.mockClear();
  vi.mocked(exigerAdmin).mockClear();
});

describe("garde et validation", () => {
  it("n'exporte que les actions prévues (chaque export est une porte publique)", () => {
    expect(Object.keys(actions).sort()).toEqual(
      ["changerPublicationMembre", "creerMembre", "creerUrlEnvoiMembre", "echangerOrdreMembres", "enregistrerMembre", "supprimerMembre"].sort(),
    );
  });

  it("chaque action refuse un appel sans session admin, avant toute requête", async () => {
    etat.admin = false;
    const appels = [
      () => enregistrerMembre(ID, FICHE),
      () => creerMembre(FICHE),
      () => changerPublicationMembre({ id: ID, publie: true }),
      () => supprimerMembre(ID),
      () => echangerOrdreMembres({ id: ID, avecId: AUTRE, sens: "monter" }),
      () => creerUrlEnvoiMembre({ nomFichier: "a.jpg", type: "image/jpeg", taille: 10 }),
    ];
    for (const appel of appels) await expect(appel()).rejects.toThrow("NEXT_REDIRECT");
    expect(exigerAdmin).toHaveBeenCalledTimes(appels.length);
    expect(etat.appels).toEqual([]);
    expect(etat.envois).toEqual([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("une entrée invalide n'écrit rien et renvoie les erreurs par champ", async () => {
    const r = await enregistrerMembre(ID, { ...FICHE, nom: "", lien_url: "javascript:alert(1)" });
    expect(r).toMatchObject({ ok: false, erreurs: { nom: expect.any(String), lien_url: expect.any(String) } });
    expect(await enregistrerMembre(ID, { ...FICHE, photo_chemin: "https://ailleurs.fr/x.jpg" })).toMatchObject({ ok: false, erreurs: { photo_chemin: expect.any(String) } });
    expect(await enregistrerMembre("pas-un-uuid", FICHE)).toMatchObject({ ok: false });
    expect(await changerPublicationMembre({ id: ID, publie: "oui" })).toMatchObject({ ok: false });
    expect(await supprimerMembre({ id: ID })).toMatchObject({ ok: false });
    expect(await echangerOrdreMembres({ id: ID, avecId: ID, sens: "monter" })).toMatchObject({ ok: false });
    expect(await creerUrlEnvoiMembre({ nomFichier: "a.svg", type: "image/svg+xml", taille: 10 })).toMatchObject({ ok: false, message: expect.stringContaining("Format refusé") });
    expect(etat.appels).toEqual([]);
    expect(etat.envois).toEqual([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("enregistrement et création", () => {
  it("met à jour la fiche avec les valeurs validées, sans toucher à la publication ni à l'ordre", async () => {
    const r = await enregistrerMembre(ID, { ...FICHE, nom: "  Kevin R.  ", styles_fr: "Électro, Funk,, Électro" });
    expect(r).toEqual({ ok: true, membre: LIGNE });
    const [maj] = etat.appels;
    expect(maj.table).toBe("equipe");
    expect(operations(maj)).toEqual(["update", "eq", "select", "maybeSingle"]);
    expect(maj.operations[0][1][0]).toMatchObject({ nom: "Kevin R.", styles_fr: ["Électro", "Funk"] });
    expect(maj.operations[0][1][0]).not.toHaveProperty("publie");
    expect(maj.operations[0][1][0]).not.toHaveProperty("ordre");
    expect(revalidateTag).toHaveBeenCalledWith("equipe");
  });

  it("fiche introuvable ou refus de la base : message clair, pas de revalidation", async () => {
    etat.repondre = () => ({ data: null, error: null });
    expect(await enregistrerMembre(ID, FICHE)).toMatchObject({ ok: false, message: expect.stringContaining("introuvable") });
    etat.repondre = () => ({ data: null, error: { code: "42501", message: "permission denied" } });
    expect(await enregistrerMembre(ID, FICHE)).toMatchObject({ ok: false, message: expect.stringContaining("Droits refusés") });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("crée la fiche NON publiée, à la fin de la liste", async () => {
    etat.repondre = (appel) => (operations(appel).includes("limit") ? { data: [{ ordre: 60 }], error: null } : { data: LIGNE, error: null });
    const r = await creerMembre({ ...FICHE, publie: true, ordre: 1 });
    expect(r).toMatchObject({ ok: true, membre: LIGNE });
    const insertion = etat.appels[1];
    expect(operations(insertion)).toEqual(["insert", "select", "single"]);
    expect(insertion.operations[0][1][0]).toMatchObject({ nom: "Kevin R.", publie: false, ordre: 70 });
    expect(revalidateTag).toHaveBeenCalledWith("equipe");
  });
});

describe("publication, suppression, ordre, envoi", () => {
  it("publie ou retire du site", async () => {
    expect(await changerPublicationMembre({ id: ID, publie: false })).toMatchObject({ ok: true });
    expect(etat.appels[0].operations[0]).toEqual(["update", [{ publie: false }]]);
    expect(revalidateTag).toHaveBeenCalledWith("equipe");
  });

  it("supprime définitivement ; rien de supprimé = introuvable", async () => {
    etat.repondre = () => ({ data: [{ id: ID }], error: null });
    expect(await supprimerMembre(ID)).toEqual({ ok: true, id: ID });
    expect(operations(etat.appels[0])).toEqual(["delete", "eq", "select"]);
    etat.repondre = () => ({ data: [], error: null });
    expect(await supprimerMembre(ID)).toMatchObject({ ok: false });
  });

  it("échange le rang de deux membres", async () => {
    etat.repondre = (appel) =>
      operations(appel)[0] === "select" ? { data: [{ id: ID, ordre: 30 }, { id: AUTRE, ordre: 20 }], error: null } : { data: null, error: null };
    const r = await echangerOrdreMembres({ id: ID, avecId: AUTRE, sens: "monter" });
    expect(r).toEqual({ ok: true, rangs: [{ id: ID, ordre: 20 }, { id: AUTRE, ordre: 30 }] });
    expect(revalidateTag).toHaveBeenCalledWith("equipe");
  });

  it("URL signée : chemin sûr sous equipe/<aaaa>/<mm>/, extension du type MIME (jamais du nom du fichier)", async () => {
    const r = await creerUrlEnvoiMembre({ nomFichier: "../../x.php.jpg", type: "image/webp", taille: 1000 });
    expect(r).toMatchObject({ ok: true, jeton: "jeton", chemin: expect.stringMatching(/^equipe\/\d{4}\/\d{2}\/\d+-[a-f0-9]{12}\.webp$/) });
    expect(etat.envois).toEqual([expect.stringMatching(/^medias:equipe\//)]);
  });
});
