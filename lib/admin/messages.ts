/**
 * Pourquoi est-on sur la page de connexion ? Sans explication, être renvoyé
 * vers la connexion ressemble à un bug. La raison arrive par l'adresse
 * (`/admin/connexion?raison=session_expiree`).
 */
export const RAISONS = {
  session_expiree: "Votre session a expiré ou a été fermée depuis un autre appareil. Reconnectez-vous.",
  deconnecte: "Vous êtes déconnecté de cet appareil.",
  acces_refuse: "Ce compte n'a pas accès au back office.",
  indisponible: "Le service de connexion ne répond pas. Réessayez dans un instant.",
} as const;

export type Raison = keyof typeof RAISONS;

/**
 * Message à afficher pour la raison reçue, ou null. Recherche avec
 * `Object.hasOwn` : `RAISONS["toString"]` renverrait sinon une fonction héritée.
 */
export function messageRaison(raison: string | string[] | undefined | null): string | null {
  const cle = Array.isArray(raison) ? raison[0] : raison;
  if (!cle || !Object.hasOwn(RAISONS, cle)) return null;
  return RAISONS[cle as Raison];
}
