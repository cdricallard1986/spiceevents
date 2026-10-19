import { describe, expect, it, vi } from "vitest";
import {
  FICHIER_FICTIF,
  ID_INEXISTANT,
  LIGNES_FICTIVES,
  MODIFICATIONS_FICTIVES,
  VERIFICATIONS,
  juger,
  lancerAudit,
  type ClientAudit,
  type ReponseApi,
  type Verification,
} from "./audit-rls";

const REFUS: ReponseApi = { erreur: { code: "42501", message: "permission denied for table x" } };
const VIDE: ReponseApi = { erreur: null, lignes: 0 };

/** Clé d'un select : la table, puis le filtre éventuel (`select:avis?publie=false`). */
function cleSelect(table: string, filtre?: Record<string, string | boolean>) {
  const f = Object.entries(filtre ?? {}).map(([c, v]) => `${c}=${String(v)}`);
  return `select:${table}${f.length ? `?${f.join("&")}` : ""}`;
}

/** Client simulé : la réponse dépend de l'opération et de la cible. */
function client(
  reponses: Record<string, ReponseApi>,
  parDefaut: ReponseApi = REFUS,
): ClientAudit & {
  inserts: string[];
  ecritures: { operation: string; table: string; id: string; valeurs?: unknown }[];
  envois: { bucket: string; chemin: string; type: string; taille: number }[];
} {
  const inserts: string[] = [];
  const ecritures: { operation: string; table: string; id: string; valeurs?: unknown }[] = [];
  const envois: { bucket: string; chemin: string; type: string; taille: number }[] = [];
  return {
    inserts,
    ecritures,
    envois,
    select: async (table, filtre) => reponses[cleSelect(table, filtre)] ?? parDefaut,
    insert: async (table) => {
      inserts.push(table);
      return reponses[`insert:${table}`] ?? parDefaut;
    },
    // `update:table(colonnes)` pour une réponse propre à certaines colonnes, sinon `update:table`.
    update: async (table, valeurs, id) => {
      ecritures.push({ operation: "update", table, id, valeurs });
      return reponses[`update:${table}(${Object.keys(valeurs).sort().join(",")})`] ?? reponses[`update:${table}`] ?? parDefaut;
    },
    delete: async (table, id) => {
      ecritures.push({ operation: "delete", table, id });
      return reponses[`delete:${table}`] ?? parDefaut;
    },
    rpc: async (fonction) => reponses[`rpc:${fonction}`] ?? parDefaut,
    upload: async (bucket, chemin, contenu, type) => {
      envois.push({ bucket, chemin, type, taille: contenu.byteLength });
      return reponses[`upload:${bucket}`] ?? parDefaut;
    },
    list: async (bucket) => reponses[`list:${bucket}`] ?? parDefaut,
  };
}

const REFUS_STOCKAGE: ReponseApi = { erreur: { code: "STORAGE-403", message: "new row violates row-level security policy" } };

/** Une base saine, telle que les migrations 0001 à 0009 la décrivent. */
function baseSaine() {
  return {
    visiteur: client({
      "rpc:audit_trigger": { erreur: { code: "PGRST202", message: "Could not find the function" } },
      // RLS : l'anonyme voit les 43 avis publiés, aucun avis non publié.
      "select:avis?publie=true": { erreur: null, lignes: 43 },
      "select:avis?publie=false": VIDE,
      // Photos et galeries : publiques. Storage : envoi refusé, rien de listable.
      "select:photos": { erreur: null, lignes: 57 },
      "select:galeries_photos": { erreur: null, lignes: 60 },
      // Journal : les 37 articles publiés, aucun brouillon.
      "select:articles?statut=publie": { erreur: null, lignes: 37 },
      "select:articles?statut=brouillon": VIDE,
      "upload:medias": REFUS_STOCKAGE,
      "list:medias": VIDE,
    }),
    admin: client({
      "rpc:est_admin": { erreur: null, valeur: true },
      "select:audit_log": { erreur: null, lignes: 3 },
      "select:demandes_contact": { erreur: null, lignes: 12 },
      "select:avis": { erreur: null, lignes: 45 },
      "select:articles": { erreur: null, lignes: 38 },
      "select:photos": { erreur: null, lignes: 57 },
      "select:galeries_photos": { erreur: null, lignes: 60 },
      "list:medias": { erreur: null, lignes: 1 },
      // Droit `update` sur statut et note_interne seulement (la ligne visée n'existe pas : 0 ligne modifiée).
      "update:demandes_contact(note_interne,statut)": { erreur: null },
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
    expect(select.mock.calls.map((c) => c[0])).toEqual(["audit_log", "avis", "articles", "photos", "galeries_photos", "demandes_contact"]);
    expect(clients.visiteur.inserts).toEqual(["demandes_contact", "avis", "photos", "galeries_photos", "articles"]);
    expect(clients.admin.inserts).toEqual(["demandes_contact"]);
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

describe("lancerAudit — avis", () => {
  it("un avis non publié visible par le visiteur est une faille", async () => {
    const clients = baseSaine();
    clients.visiteur = client({ ...{ "select:avis?publie=true": { erreur: null, lignes: 43 } }, "select:avis?publie=false": { erreur: null, lignes: 2 } });
    const audit = await lancerAudit({ clients, nettoyer: null });
    const r = audit.resultats.find((x) => x.verification.cible === "avis" && x.verification.filtre?.publie === false)!;
    expect(r).toMatchObject({ ok: false, faille: true });
    expect(r.constat).toContain("2 lignes visibles");
  });

  it("le visiteur qui ne lit aucun avis publié est en échec (le site n'aurait plus d'avis), sans être une faille", async () => {
    const clients = baseSaine();
    clients.visiteur = client({ "select:avis?publie=false": VIDE });
    const audit = await lancerAudit({ clients, nettoyer: null });
    const r = audit.resultats.find((x) => x.verification.cible === "avis" && x.verification.filtre?.publie === true)!;
    expect(r).toMatchObject({ ok: false, faille: false });
    expect(r.constat).toContain("Refusé alors qu'il devrait être permis");
  });

  it("modifier et supprimer visent une ligne inexistante : un droit accordé par erreur ne touche aucune vraie donnée", async () => {
    const clients = baseSaine();
    await lancerAudit({ clients, nettoyer: null });
    expect(clients.visiteur.ecritures).toEqual([
      { operation: "update", table: "demandes_contact", id: ID_INEXISTANT, valeurs: MODIFICATIONS_FICTIVES.demandes_contact },
      { operation: "delete", table: "demandes_contact", id: ID_INEXISTANT },
      { operation: "update", table: "avis", id: ID_INEXISTANT, valeurs: MODIFICATIONS_FICTIVES.avis },
      { operation: "delete", table: "avis", id: ID_INEXISTANT },
      { operation: "update", table: "photos", id: ID_INEXISTANT, valeurs: MODIFICATIONS_FICTIVES.photos },
      { operation: "delete", table: "photos", id: ID_INEXISTANT },
      { operation: "update", table: "galeries_photos", id: ID_INEXISTANT, valeurs: MODIFICATIONS_FICTIVES.galeries_photos },
      { operation: "delete", table: "galeries_photos", id: ID_INEXISTANT },
      { operation: "update", table: "articles", id: ID_INEXISTANT, valeurs: MODIFICATIONS_FICTIVES.articles },
      { operation: "delete", table: "articles", id: ID_INEXISTANT },
    ]);
    expect(clients.admin.ecritures).toEqual([
      { operation: "update", table: "demandes_contact", id: ID_INEXISTANT, valeurs: MODIFICATIONS_FICTIVES.demandes_contact },
      { operation: "update", table: "demandes_contact", id: ID_INEXISTANT, valeurs: { email: "audit-rls@example.invalid" } },
      { operation: "delete", table: "demandes_contact", id: ID_INEXISTANT },
    ]);
  });

  it("une modification ou une suppression permise au visiteur est une faille", async () => {
    const clients = baseSaine();
    const sain = baseSaine().visiteur;
    clients.visiteur = { ...sain, update: async () => ({ erreur: null }), delete: async () => ({ erreur: null }) };
    const audit = await lancerAudit({ clients, nettoyer: null });
    const update = audit.resultats.find((x) => x.verification.operation === "update")!;
    const suppression = audit.resultats.find((x) => x.verification.operation === "delete")!;
    expect(update).toMatchObject({ ok: false, faille: true, constat: "FAILLE — accès permis : modification permise" });
    expect(suppression).toMatchObject({ ok: false, faille: true, constat: "FAILLE — accès permis : suppression permise" });
  });

  it("un insert d'avis réussi par le visiteur est effacé aussitôt", async () => {
    const clients = baseSaine();
    const sain = baseSaine().visiteur;
    clients.visiteur = { ...sain, insert: async (table) => (table === "avis" ? { erreur: null, id: "av1" } : REFUS) };
    const nettoyer = vi.fn(async () => undefined);
    const audit = await lancerAudit({ clients, nettoyer });
    expect(nettoyer).toHaveBeenCalledWith("avis", "av1");
    expect(audit.resultats.find((x) => x.faille)!.constat).toContain("ligne supprimée aussitôt");
  });

  it("une modification sans valeurs fictives définies échoue clairement", async () => {
    const audit = await lancerAudit({ clients: baseSaine(), nettoyer: null }, [
      { libelle: "x", role: "visiteur", cible: "inconnue", operation: "update", attendu: "refusé" },
    ]);
    expect(audit.resultats[0]).toMatchObject({ ok: false, faille: false });
    expect(audit.resultats[0].constat).toContain("MODIFICATIONS_FICTIVES");
  });
});

describe("lancerAudit — photos et stockage", () => {
  const trouver = (audit: Awaited<ReturnType<typeof lancerAudit>>, role: string, cible: string, operation: string) =>
    audit.resultats.find((x) => x.verification.role === role && x.verification.cible === cible && x.verification.operation === operation)!;

  it("base saine : photos lisibles par tous, envoi au stockage refusé, bucket non listable", async () => {
    const audit = await lancerAudit({ clients: baseSaine(), nettoyer: null, nettoyerFichier: null });
    expect(trouver(audit, "visiteur", "photos", "select")).toMatchObject({ ok: true, constat: "Autorisé : 57 lignes visibles" });
    expect(trouver(audit, "visiteur", "medias", "upload")).toMatchObject({ ok: true, constat: "Bloqué : refusé par le stockage (STORAGE-403)" });
    expect(trouver(audit, "visiteur", "medias", "list")).toMatchObject({ ok: true, constat: "Bloqué : aucun fichier visible (RLS)" });
    expect(trouver(audit, "admin", "medias", "list")).toMatchObject({ ok: true, constat: "Autorisé : 1 élément visible" });
  });

  it("l'envoi visé est une vraie image PNG, au nom manifestement fictif, dans le bucket medias", async () => {
    const clients = baseSaine();
    await lancerAudit({ clients, nettoyer: null });
    expect(clients.visiteur.envois).toEqual([{ bucket: "medias", chemin: FICHIER_FICTIF.chemin, type: "image/png", taille: 68 }]);
    expect(FICHIER_FICTIF.chemin).toMatch(/^galeries\/audit-rls\/.*fictif.*a-supprimer\.png$/);
    expect(clients.admin.envois).toEqual([]);
  });

  it("un envoi accepté pour le visiteur est une FAILLE, et le fichier est effacé aussitôt", async () => {
    const clients = baseSaine();
    clients.visiteur = { ...clients.visiteur, upload: async (_b, chemin) => ({ erreur: null, id: chemin }) };
    const nettoyerFichier = vi.fn(async () => undefined);
    const audit = await lancerAudit({ clients, nettoyer: null, nettoyerFichier });
    const r = trouver(audit, "visiteur", "medias", "upload");
    expect(r).toMatchObject({ ok: false, faille: true });
    expect(r.constat).toBe("FAILLE — accès permis : fichier envoyé — fichier supprimé aussitôt.");
    expect(nettoyerFichier).toHaveBeenCalledWith("medias", FICHIER_FICTIF.chemin);
  });

  it("sans clé service_role ou si l'effacement échoue : demande de supprimer le fichier à la main", async () => {
    const clients = baseSaine();
    clients.visiteur = { ...clients.visiteur, upload: async (_b, chemin) => ({ erreur: null, id: chemin }) };
    const sansCle = await lancerAudit({ clients, nettoyer: null });
    expect(trouver(sansCle, "visiteur", "medias", "upload").constat).toContain(`supprimez à la main le fichier medias/${FICHIER_FICTIF.chemin}`);
    const echec = await lancerAudit({ clients, nettoyer: null, nettoyerFichier: async () => Promise.reject(new Error("réseau")) });
    expect(trouver(echec, "visiteur", "medias", "upload").constat).toContain("suppression impossible (réseau)");
  });

  it("des fichiers listables par le visiteur sont une faille ; un fichier déjà présent (409) n'est jamais vert", async () => {
    const clients = baseSaine();
    clients.visiteur = { ...clients.visiteur, list: async () => ({ erreur: null, lignes: 3 }), upload: async () => ({ erreur: { code: "409", message: "The resource already exists" } }) };
    const audit = await lancerAudit({ clients, nettoyer: null });
    expect(trouver(audit, "visiteur", "medias", "list")).toMatchObject({ ok: false, faille: true, constat: "FAILLE — 3 éléments visibles" });
    expect(trouver(audit, "visiteur", "medias", "upload")).toMatchObject({ ok: false, faille: false, constat: "Réponse inattendue — 409 : The resource already exists" });
  });

  it("le visiteur ne lit plus les photos : échec (les galeries seraient vides), pas une faille ; une écriture permise est une faille", async () => {
    const clients = baseSaine();
    clients.visiteur = { ...clients.visiteur, select: async () => REFUS, update: async () => ({ erreur: null }) };
    const audit = await lancerAudit({ clients, nettoyer: null });
    expect(trouver(audit, "visiteur", "photos", "select")).toMatchObject({ ok: false, faille: false });
    expect(trouver(audit, "visiteur", "galeries_photos", "update")).toMatchObject({ ok: false, faille: true });
  });

  it("le visiteur est refusé partout en écriture sur les photos et les galeries", () => {
    const ecritures = VERIFICATIONS.filter((x) => x.role === "visiteur" && ["photos", "galeries_photos", "medias"].includes(x.cible));
    expect(ecritures.map((x) => `${x.operation}:${x.cible}:${x.attendu}`)).toEqual([
      "select:photos:autorisé",
      "select:galeries_photos:autorisé",
      "insert:photos:refusé",
      "update:photos:refusé",
      "delete:photos:refusé",
      "insert:galeries_photos:refusé",
      "update:galeries_photos:refusé",
      "delete:galeries_photos:refusé",
      "upload:medias:refusé",
      "list:medias:vide",
    ]);
  });
});

describe("lancerAudit — demandes de contact", () => {
  const trouver = (audit: Awaited<ReturnType<typeof lancerAudit>>, role: string, operation: string, refuse?: boolean) =>
    audit.resultats.find(
      (x) => x.verification.role === role && x.verification.cible === "demandes_contact" && x.verification.operation === operation && (refuse === undefined || (x.verification.attendu === "refusé") === refuse),
    )!;

  it("l'admin lit les demandes ; s'il ne les voit plus, c'est un échec (la page Demandes serait vide), pas une faille", async () => {
    const clients = baseSaine();
    clients.admin = client({ ...{ "rpc:est_admin": { erreur: null, valeur: true } }, "select:demandes_contact": REFUS });
    const audit = await lancerAudit({ clients, nettoyer: null });
    expect(trouver(audit, "admin", "select")).toMatchObject({ ok: false, faille: false, constat: "Refusé alors qu'il devrait être permis : droits refusés (42501)" });
  });

  it("l'admin modifie statut et note, mais pas l'email : un droit par colonne trop large est une faille", async () => {
    const saine = await lancerAudit({ clients: baseSaine(), nettoyer: null });
    expect(trouver(saine, "admin", "update", false)).toMatchObject({ ok: true, constat: "Autorisé : modification permise" });
    expect(trouver(saine, "admin", "update", true)).toMatchObject({ ok: true, constat: "Bloqué : droits refusés (42501)" });

    const clients = baseSaine();
    clients.admin = { ...clients.admin, update: async () => ({ erreur: null }) };
    const audit = await lancerAudit({ clients, nettoyer: null });
    expect(trouver(audit, "admin", "update", true)).toMatchObject({ ok: false, faille: true, constat: "FAILLE — accès permis : modification permise" });
  });

  it("une demande créée par la session admin (faille) est effacée aussitôt ; une suppression permise est une faille", async () => {
    const clients = baseSaine();
    clients.admin = { ...clients.admin, insert: async () => ({ erreur: null, id: "dc1" }), delete: async () => ({ erreur: null }) };
    const nettoyer = vi.fn(async () => undefined);
    const audit = await lancerAudit({ clients, nettoyer });
    expect(trouver(audit, "admin", "insert")).toMatchObject({ ok: false, faille: true });
    expect(trouver(audit, "admin", "insert").constat).toContain("ligne supprimée aussitôt");
    expect(nettoyer).toHaveBeenCalledWith("demandes_contact", "dc1");
    expect(trouver(audit, "admin", "delete")).toMatchObject({ ok: false, faille: true, constat: "FAILLE — accès permis : suppression permise" });
  });

  it("le visiteur reste refusé partout sur les demandes", () => {
    const visiteur = VERIFICATIONS.filter((x) => x.role === "visiteur" && x.cible === "demandes_contact");
    expect(visiteur.map((x) => `${x.operation}:${x.attendu}`)).toEqual(["select:vide", "insert:refusé", "update:refusé", "delete:refusé"]);
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
        "update:demandes_contact:refusé",
        "delete:demandes_contact:refusé",
        "rpc:est_admin:refusé",
        "rpc:audit_trigger:refusé",
        "insert:avis:refusé",
        "update:avis:refusé",
        "delete:avis:refusé",
      ]),
    );
  });

  it("avis : le visiteur lit les avis publiés, et aucun avis non publié", () => {
    const lectures = VERIFICATIONS.filter((x) => x.role === "visiteur" && x.cible === "avis" && x.operation === "select");
    expect(lectures.map((x) => [x.filtre, x.attendu])).toEqual([
      [{ publie: true }, "autorisé"],
      [{ publie: false }, "vide"],
    ]);
  });

  it("vérifie les droits de la session admin", () => {
    const admin = VERIFICATIONS.filter((x) => x.role === "admin").map((x) => `${x.operation}:${x.cible}:${x.attendu}`);
    expect(admin).toEqual([
      "rpc:est_admin:autorisé",
      "select:audit_log:autorisé",
      "select:avis:autorisé",
      "select:articles:autorisé",
      "select:photos:autorisé",
      "select:galeries_photos:autorisé",
      "list:medias:autorisé",
      "select:demandes_contact:autorisé",
      "update:demandes_contact:autorisé",
      "update:demandes_contact:refusé",
      "insert:demandes_contact:refusé",
      "delete:demandes_contact:refusé",
    ]);
    expect(VERIFICATIONS.find((x) => x.role === "admin" && x.cible === "avis")!.filtre).toBeUndefined();
    expect(VERIFICATIONS.find((x) => x.role === "admin" && x.cible === "est_admin")!.valeur).toBe(true);
  });

  it("articles : le visiteur lit les publiés, aucun brouillon, et n'écrit rien ; l'admin lit tout", () => {
    const visiteur = VERIFICATIONS.filter((x) => x.role === "visiteur" && (x.cible === "articles" || x.cible === "articles_slug_fige"));
    expect(visiteur.map((x) => `${x.operation}:${x.cible}:${JSON.stringify(x.filtre ?? {})}:${x.attendu}`)).toEqual([
      'select:articles:{"statut":"publie"}:autorisé',
      'select:articles:{"statut":"brouillon"}:vide',
      "insert:articles:{}:refusé",
      "update:articles:{}:refusé",
      "delete:articles:{}:refusé",
      "rpc:articles_slug_fige:{}:refusé",
    ]);
    expect(VERIFICATIONS.find((x) => x.role === "admin" && x.cible === "articles")).toMatchObject({ operation: "select", attendu: "autorisé" });
    expect(VERIFICATIONS.find((x) => x.role === "admin" && x.cible === "articles")!.filtre).toBeUndefined();
    // Ligne fictive : un brouillon, valide pour la table (slug au bon format), pour qu'une faille se voie.
    expect(LIGNES_FICTIVES.articles).toMatchObject({ statut: "brouillon" });
    expect(String(LIGNES_FICTIVES.articles.slug)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
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
    const cles = VERIFICATIONS.map((x) => `${x.role}:${x.operation}:${x.cible}:${JSON.stringify(x.filtre ?? {})}:${JSON.stringify(x.valeurs ?? {})}`);
    expect(new Set(cles).size).toBe(cles.length);
  });
});

describe("lancerAudit — articles du journal", () => {
  const trouver = (audit: Awaited<ReturnType<typeof lancerAudit>>, role: string, operation: string, filtre?: Record<string, string>) =>
    audit.resultats.find(
      (x) => x.verification.role === role && x.verification.cible === "articles" && x.verification.operation === operation && JSON.stringify(x.verification.filtre) === JSON.stringify(filtre),
    )!;

  it("base saine : publiés visibles, brouillons invisibles, écritures refusées, l'admin voit tout", async () => {
    const audit = await lancerAudit({ clients: baseSaine(), nettoyer: null });
    expect(trouver(audit, "visiteur", "select", { statut: "publie" })).toMatchObject({ ok: true, constat: "Autorisé : 37 lignes visibles" });
    expect(trouver(audit, "visiteur", "select", { statut: "brouillon" })).toMatchObject({ ok: true, constat: "Bloqué : aucune ligne visible (RLS)" });
    for (const op of ["insert", "update", "delete"]) expect(trouver(audit, "visiteur", op), op).toMatchObject({ ok: true, faille: false });
    expect(trouver(audit, "admin", "select")).toMatchObject({ ok: true, constat: "Autorisé : 38 lignes visibles" });
  });

  it("un brouillon visible par le visiteur est une faille ; un article créé par erreur est effacé aussitôt", async () => {
    const clients = baseSaine();
    const sain = clients.visiteur;
    clients.visiteur = {
      ...sain,
      select: async (table, filtre) => (table === "articles" && filtre?.statut === "brouillon" ? { erreur: null, lignes: 1 } : sain.select(table, filtre)),
      insert: async (table) => (table === "articles" ? { erreur: null, id: "ar1" } : REFUS),
    };
    const nettoyer = vi.fn(async () => undefined);
    const audit = await lancerAudit({ clients, nettoyer });
    expect(trouver(audit, "visiteur", "select", { statut: "brouillon" })).toMatchObject({ ok: false, faille: true, constat: "FAILLE — 1 ligne visible" });
    expect(trouver(audit, "visiteur", "insert")).toMatchObject({ ok: false, faille: true });
    expect(nettoyer).toHaveBeenCalledWith("articles", "ar1");
  });

  it("le visiteur qui ne lit plus les articles publiés est en échec (le journal serait vide), sans être une faille", async () => {
    const clients = baseSaine();
    const sain = clients.visiteur;
    clients.visiteur = { ...sain, select: async (table, filtre) => (table === "articles" ? REFUS : sain.select(table, filtre)) };
    const audit = await lancerAudit({ clients, nettoyer: null });
    expect(trouver(audit, "visiteur", "select", { statut: "publie" })).toMatchObject({ ok: false, faille: false });
  });
});
