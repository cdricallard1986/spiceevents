import { DESTINATAIRE_PAR_DEFAUT, EXPEDITEUR_PAR_DEFAUT } from "@/lib/contact/config-email";

/**
 * État de la configuration de l'environnement (page `/admin/tests`), logique
 * pure et testée. ⚠️ Un secret n'est JAMAIS renvoyé : seulement « présente » ou
 * « absente ». Seules les valeurs non secrètes (adresses email, version) sont
 * affichées en clair.
 */

export type LigneConfiguration = {
  nom: string;
  description: string;
  secret: boolean;
  /** Variable définie (non vide) dans l'environnement. */
  presente: boolean;
  /** Valeur affichée : null pour un secret, la valeur par défaut si la variable manque. */
  valeur: string | null;
  /** La valeur affichée est celle par défaut du code. */
  parDefaut: boolean;
};

type Environnement = Record<string, string | undefined>;

const SECRETS = [
  { nom: "supabase_service_role_key", description: "Clé service_role : formulaire de contact, limite des connexions." },
  { nom: "resend_api_key", description: "Clé d'API Resend : envoi des emails." },
  { nom: "contact_secret_ip", description: "Secret des empreintes HMAC des adresses IP." },
] as const;

const VALEURS = [
  { nom: "contact_destinataire", description: "Adresse qui reçoit les demandes de contact.", defaut: DESTINATAIRE_PAR_DEFAUT },
  { nom: "contact_expediteur", description: "Expéditeur des emails (domaine vérifié dans Resend).", defaut: EXPEDITEUR_PAR_DEFAUT },
] as const;

/** Même règle que le code qui les lit (`process.env.x || défaut`) : une variable vide compte comme absente. */
function definie(env: Environnement, nom: string): boolean {
  return Boolean(env[nom]);
}

export function etatConfiguration(env: Environnement): LigneConfiguration[] {
  return [
    ...SECRETS.map((s) => ({ ...s, secret: true, presente: definie(env, s.nom), valeur: null, parDefaut: false })),
    ...VALEURS.map(({ nom, description, defaut }) => {
      const presente = definie(env, nom);
      return { nom, description, secret: false, presente, valeur: presente ? env[nom]! : defaut, parDefaut: !presente };
    }),
  ];
}

/** « production » / « preview » / « development » (Vercel), sinon le mode de Node. */
export function nomEnvironnement(env: Environnement): string {
  return env.VERCEL_ENV || env.NODE_ENV || "inconnu";
}
