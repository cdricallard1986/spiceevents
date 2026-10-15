import { createHmac } from "node:crypto";

/**
 * Limitation des demandes par adresse IP (logique pure, testée).
 *
 * - L'IP n'est jamais stockée en clair : seulement son empreinte HMAC-SHA256,
 *   calculée avec un secret serveur (`contact_secret_ip`). Sans le secret, on ne
 *   peut pas retrouver l'IP à partir de l'empreinte, même en essayant toutes les
 *   adresses possibles.
 * - On compte les demandes enregistrées dans `demandes_contact` sur la dernière
 *   heure pour cette empreinte.
 *
 * Choix assumé — si la base ne répond pas, on LAISSE PASSER (« échoue ouvert ») :
 * le formulaire sert à recevoir des clients, et bloquer un vrai couple parce
 * que Supabase a un incident coûterait bien plus cher que quelques messages
 * indésirables. L'incident est journalisé pour être vu dans les logs Vercel.
 * Le champ piège et le délai minimal continuent de filtrer les robots.
 * (Différent de la limite des tentatives de connexion des plateformes, qui
 * échoue fermé : là, laisser passer ouvrirait un compte.)
 */

export const LIMITE = {
  /** Nombre de demandes acceptées par IP et par fenêtre. */
  maximum: 5,
  fenetreMs: 60 * 60 * 1000,
} as const;

/**
 * Adresse du visiteur d'après `x-forwarded-for` (la première de la liste).
 * Sur Vercel, cet en-tête est réécrit par la plateforme : le visiteur ne peut
 * pas l'usurper. Null si l'en-tête est absent ou n'a pas l'allure d'une IP.
 */
export function ipDepuisEntetes(xForwardedFor: string | null): string | null {
  const premiere = xForwardedFor?.split(",")[0]?.trim();
  if (!premiere || premiere.length > 45 || !/^[0-9a-fA-F.:]+$/.test(premiere)) return null;
  return premiere;
}

/** Empreinte HMAC-SHA256 (hexadécimal) de l'IP : c'est elle, et elle seule, qui est stockée. */
export function empreinteIp(ip: string, secret: string): string {
  if (!secret) throw new Error("Secret d'empreinte IP manquant");
  return createHmac("sha256", secret).update(ip).digest("hex");
}

/** Début de la fenêtre de comptage. */
export function debutFenetre(maintenant: Date): Date {
  return new Date(maintenant.getTime() - LIMITE.fenetreMs);
}

export type DecisionLimite = {
  autorise: boolean;
  /** Vrai quand la base n'a pas répondu et qu'on a laissé passer par défaut. */
  degrade: boolean;
};

/**
 * Décide si une nouvelle demande est acceptée. `compter` renvoie le nombre de
 * demandes récentes pour l'empreinte ; s'il échoue, on laisse passer (voir en tête).
 */
export async function verifierLimite(
  compter: () => Promise<number>,
  journaliser: (message: string, erreur: unknown) => void = console.warn,
): Promise<DecisionLimite> {
  try {
    const recentes = await compter();
    return { autorise: recentes < LIMITE.maximum, degrade: false };
  } catch (erreur) {
    journaliser("[contact] Limite par IP non vérifiée (base indisponible) : demande acceptée par défaut.", erreur);
    return { autorise: true, degrade: true };
  }
}
