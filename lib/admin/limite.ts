import { createHmac } from "node:crypto";

/**
 * Limite des tentatives de connexion au back office (logique pure, testée).
 *
 * La connexion passe par notre Server Action : Supabase voit toutes les
 * requêtes venir de NOTRE serveur, sa propre limite par IP ne protège donc
 * plus rien. On compte nous-mêmes, dans `tentatives_connexion` (RLS sans
 * policy : accessible au seul `service_role`), sur 15 minutes :
 *
 * - par **IP** : toutes les tentatives (message explicite, qui ne dit rien du compte) ;
 * - par **compte** : les échecs seulement. Compter les simples tentatives
 *   permettrait de bloquer Cédric en ne connaissant que son email.
 *
 * IP et email ne sont jamais stockés en clair : seulement leur empreinte
 * HMAC-SHA256 (secret serveur `contact_secret_ip`, partagé avec le formulaire de
 * contact). Le type est mêlé à la valeur, pour que l'empreinte d'une IP ici ne
 * soit pas celle stockée avec les demandes de contact.
 *
 * Contrairement au formulaire de contact, on **échoue fermé** : si la base ne
 * répond pas, la connexion est refusée (laisser passer ouvrirait la porte à un
 * essai de mots de passe en série). Exception : sans clé `service_role`
 * (développement local), on laisse passer — se verrouiller dehors serait pire.
 */

export const LIMITE_CONNEXION = {
  /** Tentatives acceptées par IP et par fenêtre. */
  parIp: 10,
  /** Échecs acceptés par compte et par fenêtre. */
  parCompte: 5,
  fenetreMs: 15 * 60 * 1000,
} as const;

/** Durée minimale d'une réponse : sinon le temps de réponse révélerait si le compte existe. */
export const DUREE_MINIMALE_MS = 1500;

export type TypeTentative = "ip" | "compte";

/** Empreinte HMAC-SHA256 (64 caractères hexadécimaux), seule valeur stockée. */
export function empreinteTentative(type: TypeTentative, valeur: string, secret: string): string {
  if (!secret) throw new Error("Secret d'empreinte manquant");
  return createHmac("sha256", secret).update(`connexion:${type}:${valeur}`).digest("hex");
}

/** Début de la fenêtre de comptage. */
export function debutFenetreConnexion(maintenant: number): Date {
  return new Date(maintenant - LIMITE_CONNEXION.fenetreMs);
}

/** Autorise la tentative si l'IP et le compte sont sous leur seuil. */
export function tentativeAutorisee(tentativesIp: number, echecsCompte: number): boolean {
  return tentativesIp < LIMITE_CONNEXION.parIp && echecsCompte < LIMITE_CONNEXION.parCompte;
}
