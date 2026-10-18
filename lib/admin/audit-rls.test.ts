import { describe, expect, it, vi } from "vitest";
import { LIGNES_FICTIVES, VERIFICATIONS, juger, lancerAudit, type ClientAudit, type ReponseApi, type Verification } from "./audit-rls";

const REFUS: ReponseApi = { erreur: { code: "42501", message: "permission denied for table x" } };
const VIDE: ReponseApi = { erreur: null, lignes: 0 };

/** Client simulé : la réponse dépend de l'opération et de la cible. */
function client(reponses: Record<string, ReponseApi>, parDefaut: ReponseApi = REFUS): ClientAudit & { inserts: string[] } {
  const inserts: string[] = [];
  return {
    inserts,
    select: async (table) => reponses[`select:${table}`] ?? parDefaut,
    insert: async (table) => {
      inserts.push(table);
      return reponses[`insert:${table}`] ?? parDefaut;
    },
    rpc: async (fonction) => reponses[`rpc:${fonction}`] ?? parDefaut,
  };
}

/** Une base saine, telle que les migrations 0001 et 0002 la décrivent. */
function baseSaine() {
  return {
    visiteur: client({ "rpc:audit_trigger": { erreur: { code: "PGRST202", message: "Could not find the function" } } }),
    admin: client({
      "rpc:est_admin": { erreur: null, valeur: true },
      "select:audit_log": { erreur: null, lignes: 3 },
      "select:demandes_contact": VIDE,
    }),
  };
}

const v = (attendu: Verification["attendu"], operation: Verification["operation"] = "select", valeur?: unknown): Verification => ({
  libelle: "test",
  role: "visiteur",
  cible: "t",
  operation,
  attendu,
  valeur,
});

describe("juger", () => {
  it("« vide » : un refus de droits ou zéro ligne sont tous deux « bloqué », en disant lequel", () => {
    expect(juger(v("vide"), REFUS)).toEqual({ ok: true, faille: false, constat: "Bloqué : droits refusés (42501)" });
    expect(juger(v("vide"), VIDE)).toEqual({ ok: true, faille: false, constat: "Bloqué : aucune ligne visible (RLS)" });
  });

  it("« vide » : des lignes visibles sont une faille", () => {
    const r = juger(v("vide"), { erreur: null, lignes: 2 });
    expect(r.ok).toBe(false);
    expect(r.faille).toBe(true);
    expect(r.constat).toContain("2 lignes visibles");
  });

  it("« refusé » : seul un refus de l'API passe ; un succès est une faille", () => {
    expect(juger(v("refusé", "rpc"), { erreur: { code: "PGRST202", message: "x" } }).ok).toBe(true);
    const faille = juger(v("refusé", "rpc"), { erreur: null, valeur: false });
    expect(faille).toMatchObject({ ok: false, faille: true });
    expect(faille.constat).toContain("renvoie false");
    expect(juger(v("refusé", "insert"), { erreur: null, id: "1" }).constat).toContain("ligne créée");
  });

  it("une panne ou une erreur inconnue n'est jamais verte (l'audit ne conclut pas sur une panne)", () => {
    for (const attendu of ["refusé", "vide", "autorisé"] as const) {
      const r = juger(v(attendu), { erreur: { message: "TypeError: fetch failed" } });
      expect(r.ok).toBe(false);
      expect(r.constat).toBe("Réponse inattendue — TypeError: fetch failed");
    }
    // Fonction de trigger appelée alors que le droit EXECUTE existe encore.
    expect(juger(v("refusé", "rpc"), { erreur: { code: "0A000", message: "trigger functions can only be called as triggers" } }).ok).toBe(false);
  });

  it("« autorisé » : sans erreur, et avec la valeur attendue si elle est précisée", () => {
    expect(juger(v("autorisé"), VIDE)).toEqual({ ok: true, faille: false, constat: "Autorisé : 0 ligne visible" });
    expect(juger(v("autorisé", "rpc", true), { erreur: null, valeur: true }).ok).toBe(true);
    expect(juger(v("autorisé", "rpc", true), { erreur: null, valeur: false })).toMatchObject({ ok: false, faille: false });
    expect(juger(v("autorisé"), REFUS)).toMatchObject({ ok: false, constat: "Refusé alors qu'il devrait être permis : droits refusés (42501)" });
  });
});

describe("lancerAudit", () => {
  it("base saine → tout est vert", async () => {
    const audit = await lancerAudit({ clients: baseSaine(), nettoyer: null }, VERIFICATIONS, new Date("2026-10-18T10:00:00Z"));
    expect(audit.echoues).toBe(0);
    expect(audit.reussis).toBe(VERIFICATIONS.length);
    expect(audit.date).toBe("2026-10-18T10:00:00.000Z");
  });

  it("chaque vérification part sous le bon rôle", async () => {
    const clients = baseSaine();
    const select = vi.spyOn(clients.admin, "select");
    await lancerAudit({ clients, nettoyer: null });
    expect(select.mock.calls.map((c) => c[0])).toEqual(["audit_log", "demandes_contact"]);
    expect(clients.visiteur.inserts).toEqual(["demandes_contact"]);
    expect(clients.admin.inserts).toEqual([]);
  });

  it("un insert qui réussit (faille) est signalé en rouge et sa ligne effacée aussitôt", async () => {
    const clients = baseSaine();
    clients.visiteur = client({ "insert:demandes_contact": { erreur: null, id: "abc" } });
    const nettoyer = vi.fn(async () => undefined);
    const audit = await lancerAudit({ clients, nettoyer });
    const r = audit.resultats.find((x) => x.verification.operation === "insert")!;
    expect(r).toMatchObject({ ok: false, faille: true });
    expect(r.constat).toContain("ligne supprimée aussitôt");
    expect(nettoyer).toHaveBeenCalledWith("demandes_contact", "abc");
  });

  it("sans clé service_role ou si l'effacement échoue : demande de supprimer la ligne à la main", async () => {
    const clients = baseSaine();
    clients.visiteur = client({ "insert:demandes_contact": { erreur: null, id: "abc" } });
    const sansCle = await lancerAudit({ clients, nettoyer: null });
    expect(sansCle.resultats.find((x) => x.faille)!.constat).toContain("supprimez à la main la ligne abc");

    const echec = await lancerAudit({ clients, nettoyer: async () => Promise.reject(new Error("réseau")) });
    expect(echec.resultats.find((x) => x.faille)!.constat).toContain("suppression impossible (réseau)");
  });

  it("une exception du client devient une réponse inattendue, et l'audit continue", async () => {
    const clients = baseSaine();
    clients.visiteur.select = async () => {
      throw new Error("délai dépassé");
    };
    const audit = await lancerAudit({ clients, nettoyer: null });
    expect(audit.resultats).toHaveLength(VERIFICATIONS.length);
    expect(audit.resultats[0]).toMatchObject({ ok: false, constat: "Réponse inattendue — délai dépassé" });
  });

  it("un insert sans ligne fictive définie échoue clairement au lieu d'écrire n'importe quoi", async () => {
    const audit = await lancerAudit({ clients: baseSaine(), nettoyer: null }, [
      { libelle: "x", role: "visiteur", cible: "inconnue", operation: "insert", attendu: "refusé" },
    ]);
    expect(audit.resultats[0].ok).toBe(false);
    expect(audit.resultats[0].constat).toContain("LIGNES_FICTIVES");
  });
});

describe("liste des vérifications", () => {
  it("couvre les tables privées et les fonctions exposées, pour le visiteur", () => {
    const visiteur = VERIFICATIONS.filter((x) => x.role === "visiteur").map((x) => `${x.operation}:${x.cible}:${x.attendu}`);
    expect(visiteur).toEqual(
      expect.arrayContaining([
        "select:demandes_contact:vide",
        "select:administrateurs:vide",
        "select:tentatives_connexion:vide",
        "select:audit_log:vide",
        "insert:demandes_contact:refusé",
        "rpc:est_admin:refusé",
        "rpc:audit_trigger:refusé",
      ]),
    );
  });

  it("vérifie les droits de la session admin", () => {
    const admin = VERIFICATIONS.filter((x) => x.role === "admin").map((x) => `${x.operation}:${x.cible}:${x.attendu}`);
    expect(admin).toEqual(["rpc:est_admin:autorisé", "select:audit_log:autorisé", "select:demandes_contact:vide"]);
    expect(VERIFICATIONS.find((x) => x.role === "admin" && x.cible === "est_admin")!.valeur).toBe(true);
  });

  it("chaque insert a une ligne fictive, manifestement fausse", () => {
    for (const x of VERIFICATIONS.filter((x) => x.operation === "insert")) {
      const ligne = LIGNES_FICTIVES[x.cible];
      expect(ligne, x.cible).toBeDefined();
      expect(JSON.stringify(ligne)).toMatch(/AUDIT RLS|fictive/i);
    }
    expect(LIGNES_FICTIVES.demandes_contact.email).toMatch(/@example\.invalid$/);
  });

  it("aucune vérification en double", () => {
    const cles = VERIFICATIONS.map((x) => `${x.role}:${x.operation}:${x.cible}`);
    expect(new Set(cles).size).toBe(cles.length);
  });
});
