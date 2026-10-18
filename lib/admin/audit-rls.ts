/**
 * Audit des droits en base (page `/admin/tests`), logique pure et testée.
 *
 * Chaque vérification interroge la VRAIE base, par l'API publique, sous un rôle :
 * - `visiteur` : clé publishable sans session (ce que peut faire n'importe qui) ;
 * - `admin` : la session de Cédric.
 * Les unitaires ne voient pas un GRANT oublié ou une policy trop large : cet
 * audit, si.
 *
 * Pour compléter (articles, photos…) : ajouter une ligne à `VERIFICATIONS`,
 * pour un `insert`, une ligne fictive dans `LIGNES_FICTIVES`, et pour un
 * `update`, des valeurs dans `MODIFICATIONS_FICTIVES`. `update` et `delete`
 * visent une ligne qui n'existe pas (`ID_INEXISTANT`) : même en cas de faille,
 * aucune vraie donnée n'est touchée — seul le droit est mis à l'épreuve.
 */

export type Role = "visiteur" | "admin";
export type Operation = "select" | "insert" | "update" | "delete" | "rpc";

/**
 * - `refusé` : l'API doit répondre par un refus de droits ;
 * - `vide` : refus OU aucune ligne visible (RLS sans policy : PostgREST renvoie
 *   l'un ou l'autre selon que les GRANT ont été retirés ou non) ;
 * - `autorisé` : réponse sans erreur (et la valeur attendue, si précisée).
 */
export type Attendu = "refusé" | "vide" | "autorisé";

export type Verification = {
  libelle: string;
  role: Role;
  /** Table (select, insert, update, delete) ou fonction (rpc). */
  cible: string;
  operation: Operation;
  /** select : ne compter que les lignes où chaque colonne vaut la valeur donnée (ex. `{ publie: false }`). */
  filtre?: Record<string, string | boolean>;
  attendu: Attendu;
  /** Pour `autorisé` : valeur que doit renvoyer la fonction (rpc). */
  valeur?: unknown;
  /** Explication affichée sous la ligne. */
  note?: string;
};

export const VERIFICATIONS: readonly Verification[] = [
  // --- Visiteur (clé publishable, sans session) ---
  { libelle: "Lire les demandes de contact", role: "visiteur", cible: "demandes_contact", operation: "select", attendu: "vide" },
  { libelle: "Lire les administrateurs", role: "visiteur", cible: "administrateurs", operation: "select", attendu: "vide" },
  { libelle: "Lire les tentatives de connexion", role: "visiteur", cible: "tentatives_connexion", operation: "select", attendu: "vide" },
  { libelle: "Lire le journal d'audit", role: "visiteur", cible: "audit_log", operation: "select", attendu: "vide" },
  {
    libelle: "Créer une demande de contact par l'API",
    role: "visiteur",
    cible: "demandes_contact",
    operation: "insert",
    attendu: "refusé",
    note: "Seul le serveur du site (clé service_role) écrit les demandes.",
  },
  {
    libelle: "Lire les avis publiés",
    role: "visiteur",
    cible: "avis",
    operation: "select",
    filtre: { publie: true },
    attendu: "autorisé",
    note: "Les avis publiés sont publics : ce sont ceux des pages du site.",
  },
  {
    libelle: "Lire les avis non publiés",
    role: "visiteur",
    cible: "avis",
    operation: "select",
    filtre: { publie: false },
    attendu: "vide",
    note: "Un avis non publié (brouillon, retiré du site) ne doit être visible que dans le back office.",
  },
  { libelle: "Créer un avis par l'API", role: "visiteur", cible: "avis", operation: "insert", attendu: "refusé" },
  { libelle: "Modifier un avis par l'API", role: "visiteur", cible: "avis", operation: "update", attendu: "refusé" },
  { libelle: "Supprimer un avis par l'API", role: "visiteur", cible: "avis", operation: "delete", attendu: "refusé" },
  { libelle: "Appeler est_admin()", role: "visiteur", cible: "est_admin", operation: "rpc", attendu: "refusé" },
  { libelle: "Appeler audit_trigger()", role: "visiteur", cible: "audit_trigger", operation: "rpc", attendu: "refusé" },
  { libelle: "Appeler touch_updated_at()", role: "visiteur", cible: "touch_updated_at", operation: "rpc", attendu: "refusé" },

  // --- Administrateur (session de Cédric) ---
  { libelle: "Appeler est_admin()", role: "admin", cible: "est_admin", operation: "rpc", attendu: "autorisé", valeur: true },
  { libelle: "Lire le journal d'audit", role: "admin", cible: "audit_log", operation: "select", attendu: "autorisé" },
  {
    libelle: "Lire tous les avis, publiés ou non",
    role: "admin",
    cible: "avis",
    operation: "select",
    attendu: "autorisé",
    note: "Le back office voit aussi les avis non publiés.",
  },
  {
    libelle: "Lire les demandes de contact",
    role: "admin",
    cible: "demandes_contact",
    operation: "select",
    attendu: "vide",
    note: "Réservé à la clé service_role pour l'instant ; l'étape 3 (Demandes) ouvrira la lecture admin et changera ce test.",
  },
];

/** Lignes manifestement fictives pour les tests d'`insert` (valides, pour qu'une faille se voie). */
export const LIGNES_FICTIVES: Record<string, Record<string, unknown>> = {
  demandes_contact: {
    langue: "fr",
    prenoms: "AUDIT RLS",
    nom: "LIGNE FICTIVE",
    email: "audit-rls@example.invalid",
    telephone: "+33600000000",
    type_evenement: "autre",
    message: "Ligne fictive de l'audit RLS du back office : elle n'aurait jamais dû pouvoir être créée. À supprimer.",
  },
  avis: {
    auteurs: "AUDIT RLS — LIGNE FICTIVE",
    categorie: "mariage",
    texte_fr: "Ligne fictive de l'audit RLS du back office : elle n'aurait jamais dû pouvoir être créée. À supprimer.",
    publie: false,
  },
};

/** Valeurs des tests d'`update` (valides, pour qu'une faille se voie). */
export const MODIFICATIONS_FICTIVES: Record<string, Record<string, unknown>> = {
  avis: { auteurs: "AUDIT RLS — MODIFICATION FICTIVE" },
};

/** Identifiant visé par les tests d'`update` et de `delete` : aucune ligne ne le porte. */
export const ID_INEXISTANT = "00000000-0000-0000-0000-000000000000";

// --- Exécution ---------------------------------------------------------------

/** Réponse de l'API, réduite à ce qui sert à juger (jamais les données elles-mêmes). */
export type ReponseApi = {
  erreur: { code?: string; message: string } | null;
  /** select : nombre de lignes visibles. */
  lignes?: number | null;
  /** rpc : valeur renvoyée. */
  valeur?: unknown;
  /** insert réussi : identifiant de la ligne créée (pour l'effacer). */
  id?: string | null;
};

/** Accès à la base sous un rôle donné (le serveur fournit les vrais clients Supabase, les tests des faux). */
export type ClientAudit = {
  select(table: string, filtre?: Record<string, string | boolean>): Promise<ReponseApi>;
  insert(table: string, ligne: Record<string, unknown>): Promise<ReponseApi>;
  /** Modifie la ligne `id` (inexistante : seul le droit est testé). */
  update(table: string, valeurs: Record<string, unknown>, id: string): Promise<ReponseApi>;
  /** Supprime la ligne `id` (inexistante : seul le droit est testé). */
  delete(table: string, id: string): Promise<ReponseApi>;
  rpc(fonction: string): Promise<ReponseApi>;
};

export type DependancesAudit = {
  clients: Record<Role, ClientAudit>;
  /**
   * Efface une ligne créée par erreur (faille) avec la clé service_role.
   * null si la clé est absente : la ligne est alors signalée pour suppression à la main.
   */
  nettoyer: ((table: string, id: string) => Promise<void>) | null;
};

export type ResultatVerification = {
  verification: Verification;
  ok: boolean;
  /** Ce qui a été observé, en clair (« bloqué : droits refusés (42501) »…). */
  constat: string;
  /** Un accès qui aurait dû être refusé a réussi. */
  faille: boolean;
};

export type ResultatAudit = {
  date: string;
  resultats: ResultatVerification[];
  reussis: number;
  echoues: number;
};

/**
 * Codes qui veulent dire « l'API a refusé » :
 * - 42501 : droits insuffisants (GRANT retiré, ou policy RLS qui rejette une écriture) ;
 * - PGRST202 : fonction introuvable pour ce rôle (non exposée).
 * Tout autre code (réseau, 5xx, erreur SQL…) est « inattendu » : l'audit ne
 * conclut pas au vert sur une panne.
 */
const CODES_REFUS: Record<string, string> = {
  "42501": "droits refusés",
  PGRST202: "fonction non exposée",
};

type Constat =
  | { type: "refuse"; detail: string }
  | { type: "accorde"; lignes?: number | null; valeur?: unknown; id?: string | null }
  | { type: "inattendu"; detail: string };

function constater(reponse: ReponseApi): Constat {
  if (reponse.erreur) {
    const code = reponse.erreur.code ?? "";
    const motif = CODES_REFUS[code];
    if (motif) return { type: "refuse", detail: `${motif} (${code})` };
    return { type: "inattendu", detail: `${code ? `${code} : ` : ""}${reponse.erreur.message || "erreur sans message"}` };
  }
  return { type: "accorde", lignes: reponse.lignes, valeur: reponse.valeur, id: reponse.id };
}

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

function decrireAccord(c: Extract<Constat, { type: "accorde" }>, operation: Operation): string {
  if (operation === "select") return typeof c.lignes === "number" ? `${pluriel(c.lignes, "ligne")} visible${c.lignes > 1 ? "s" : ""}` : "lecture permise";
  if (operation === "insert") return "ligne créée";
  if (operation === "update") return "modification permise";
  if (operation === "delete") return "suppression permise";
  return `renvoie ${JSON.stringify(c.valeur ?? null)}`;
}

/** Juge une réponse au regard de ce qui est attendu (pur). */
export function juger(verification: Verification, reponse: ReponseApi): Omit<ResultatVerification, "verification"> {
  const c = constater(reponse);
  if (c.type === "inattendu") return { ok: false, faille: false, constat: `Réponse inattendue — ${c.detail}` };

  switch (verification.attendu) {
    case "refusé":
      if (c.type === "refuse") return { ok: true, faille: false, constat: `Bloqué : ${c.detail}` };
      return { ok: false, faille: true, constat: `FAILLE — accès permis : ${decrireAccord(c, verification.operation)}` };

    case "vide":
      if (c.type === "refuse") return { ok: true, faille: false, constat: `Bloqué : ${c.detail}` };
      if (verification.operation === "select" && c.lignes === 0) return { ok: true, faille: false, constat: "Bloqué : aucune ligne visible (RLS)" };
      return { ok: false, faille: true, constat: `FAILLE — ${decrireAccord(c, verification.operation)}` };

    case "autorisé": {
      if (c.type === "refuse") return { ok: false, faille: false, constat: `Refusé alors qu'il devrait être permis : ${c.detail}` };
      if (verification.valeur !== undefined && JSON.stringify(c.valeur) !== JSON.stringify(verification.valeur)) {
        return { ok: false, faille: false, constat: `Valeur inattendue : ${decrireAccord(c, verification.operation)} au lieu de ${JSON.stringify(verification.valeur)}` };
      }
      return { ok: true, faille: false, constat: `Autorisé : ${decrireAccord(c, verification.operation)}` };
    }
  }
}

async function executer(client: ClientAudit, v: Verification): Promise<ReponseApi> {
  try {
    if (v.operation === "select") return await client.select(v.cible, v.filtre);
    if (v.operation === "rpc") return await client.rpc(v.cible);
    if (v.operation === "delete") return await client.delete(v.cible, ID_INEXISTANT);
    if (v.operation === "update") {
      const valeurs = MODIFICATIONS_FICTIVES[v.cible];
      if (!valeurs) return { erreur: { message: `Aucune modification fictive définie pour « ${v.cible} » (MODIFICATIONS_FICTIVES).` } };
      return await client.update(v.cible, valeurs, ID_INEXISTANT);
    }
    const ligne = LIGNES_FICTIVES[v.cible];
    if (!ligne) return { erreur: { message: `Aucune ligne fictive définie pour « ${v.cible} » (LIGNES_FICTIVES).` } };
    return await client.insert(v.cible, ligne);
  } catch (e) {
    return { erreur: { message: e instanceof Error ? e.message : String(e) } };
  }
}

/** Lance toutes les vérifications, l'une après l'autre (une vingtaine de requêtes). */
export async function lancerAudit(
  d: DependancesAudit,
  verifications: readonly Verification[] = VERIFICATIONS,
  maintenant: Date = new Date(),
): Promise<ResultatAudit> {
  const resultats: ResultatVerification[] = [];
  for (const verification of verifications) {
    const reponse = await executer(d.clients[verification.role], verification);
    const jugement = juger(verification, reponse);
    let constat = jugement.constat;

    // Une écriture qui n'aurait pas dû réussir : on efface la ligne aussitôt.
    if (verification.operation === "insert" && !reponse.erreur && jugement.faille) {
      if (!reponse.id) constat += " — identifiant inconnu : vérifiez la table à la main.";
      else if (!d.nettoyer) constat += ` — clé service_role absente : supprimez à la main la ligne ${reponse.id}.`;
      else {
        try {
          await d.nettoyer(verification.cible, reponse.id);
          constat += " — ligne supprimée aussitôt.";
        } catch (e) {
          constat += ` — suppression impossible (${e instanceof Error ? e.message : String(e)}) : supprimez à la main la ligne ${reponse.id}.`;
        }
      }
    }
    resultats.push({ verification, ...jugement, constat });
  }
  const reussis = resultats.filter((r) => r.ok).length;
  return { date: maintenant.toISOString(), resultats, reussis, echoues: resultats.length - reussis };
}
