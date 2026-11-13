import { describe, expect, it, vi } from "vitest";
import { LIENS_PAR_COMPTE, MESSAGES_REINITIALISATION, lienReinitialisation, origineDesLiens, traiterReinitialisation, type DependancesReinitialisation } from "./reinitialisation";

function deps(maj: Partial<DependancesReinitialisation> = {}) {
  let t = 0;
  const comptes = new Map<string, number>();
  const d: DependancesReinitialisation = {
    ip: "1.2.3.4",
    secret: "secret-de-test",
    tentatives: {
      compter: vi.fn(async (type: string) => comptes.get(type) ?? 0),
      enregistrer: vi.fn(async (type: string) => void comptes.set(type, (comptes.get(type) ?? 0) + 1)),
    },
    genererLien: vi.fn(async (email: string) => (email === "cedric@spiceevents.fr" ? { userId: "u1", jeton: "jeton-hash" } : null)),
    estAdministrateur: vi.fn(async (id: string) => id === "u1"),
    envoyer: vi.fn(async () => undefined),
    maintenant: () => t,
    attendre: vi.fn(async (ms: number) => void (t += ms)),
    journal: { info: vi.fn(), avertir: vi.fn(), erreur: vi.fn() },
    ...maj,
  };
  return { d, comptes };
}

describe("mot de passe oublié", () => {
  it("envoie le lien au compte administrateur, et le compte", async () => {
    const { d, comptes } = deps();
    const r = await traiterReinitialisation({ email: "  Cedric@SpiceEvents.fr " }, d);
    expect(r).toEqual({ statut: "envoye", message: MESSAGES_REINITIALISATION.envoye });
    expect(d.envoyer).toHaveBeenCalledWith("cedric@spiceevents.fr", "jeton-hash");
    expect(comptes.get("reinitialisation")).toBe(1);
    expect(comptes.get("ip")).toBe(1);
  });

  it("même réponse, rien d’envoyé, pour une adresse inconnue ou un compte sans accès", async () => {
    const { d } = deps({ estAdministrateur: vi.fn(async () => false) });
    const attendu = { statut: "envoye", message: MESSAGES_REINITIALISATION.envoye };
    expect(await traiterReinitialisation({ email: "inconnu@example.com" }, d)).toEqual(attendu);
    expect(await traiterReinitialisation({ email: "cedric@spiceevents.fr" }, d)).toEqual(attendu);
    expect(d.envoyer).not.toHaveBeenCalled();
  });

  it("répond en au moins 1,5 s, quelle que soit l’issue", async () => {
    for (const email of ["cedric@spiceevents.fr", "inconnu@example.com", "pas-une-adresse"]) {
      const { d } = deps();
      await traiterReinitialisation({ email }, d);
      expect(vi.mocked(d.attendre).mock.calls.reduce((s, [ms]) => s + ms, 0), email).toBeGreaterThanOrEqual(1500);
    }
  });

  it("au-delà de 3 liens envoyés en 15 minutes : même réponse, en silence, plus rien ne part", async () => {
    const { d, comptes } = deps();
    comptes.set("reinitialisation", LIENS_PAR_COMPTE);
    expect(await traiterReinitialisation({ email: "cedric@spiceevents.fr" }, d)).toMatchObject({ statut: "envoye" });
    expect(d.genererLien).not.toHaveBeenCalled();
  });

  it("limite par IP : message explicite", async () => {
    const { d, comptes } = deps();
    comptes.set("ip", 10);
    expect(await traiterReinitialisation({ email: "cedric@spiceevents.fr" }, d)).toMatchObject({ statut: "erreur", message: MESSAGES_REINITIALISATION.limite });
    expect(d.genererLien).not.toHaveBeenCalled();
  });

  it("base indisponible : échoue fermé ; erreur d’envoi : même réponse qu’un succès (rien ne révèle le compte)", async () => {
    const { d } = deps();
    vi.mocked(d.tentatives!.compter).mockRejectedValueOnce(new Error("panne"));
    expect(await traiterReinitialisation({ email: "cedric@spiceevents.fr" }, d)).toMatchObject({ statut: "erreur", message: MESSAGES_REINITIALISATION.indisponible });
    const autre = deps({ envoyer: vi.fn(async () => Promise.reject(new Error("Resend"))) });
    expect(await traiterReinitialisation({ email: "cedric@spiceevents.fr" }, autre.d)).toMatchObject({ statut: "envoye" });
  });

  it("sans clé service_role : rien ne part, même réponse", async () => {
    const { d } = deps({ tentatives: null });
    expect(await traiterReinitialisation({ email: "cedric@spiceevents.fr" }, d)).toMatchObject({ statut: "envoye" });
    expect(d.envoyer).not.toHaveBeenCalled();
  });

  it("adresse invalide : message sous le champ, sans rien interroger", async () => {
    const { d } = deps();
    expect(await traiterReinitialisation({ email: "pas-une-adresse" }, d)).toMatchObject({ statut: "erreur", message: MESSAGES_REINITIALISATION.validation });
    expect(d.tentatives!.compter).not.toHaveBeenCalled();
  });
});

describe("adresse du lien", () => {
  it("jamais déduite de la requête : variables système de Vercel seulement", () => {
    expect(origineDesLiens({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "spiceevents.vercel.app" })).toBe("https://spiceevents.vercel.app");
    expect(origineDesLiens({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "spiceevents-git-dev-x.vercel.app", VERCEL_URL: "autre.vercel.app" })).toBe("https://spiceevents-git-dev-x.vercel.app");
    expect(origineDesLiens({})).toBe("http://localhost:3000");
  });

  it("lien vers la page de confirmation du back office, jeton encodé", () => {
    expect(lienReinitialisation("https://a.fr", "ab&c")).toBe("https://a.fr/admin/auth/confirmer?token_hash=ab%26c&type=recovery");
  });
});
