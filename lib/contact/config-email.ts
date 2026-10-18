import type { ConfigEmail } from "./email";

/**
 * Adresses des emails du formulaire, lues dans l'environnement (variables
 * Vercel `contact_destinataire`, `contact_expediteur`), avec les valeurs par
 * défaut du site. Logique pure, partagée par le formulaire et le back office.
 */

export const DESTINATAIRE_PAR_DEFAUT = "cedric@spiceevents.fr";
export const EXPEDITEUR_PAR_DEFAUT = "Spice Events <contact@spiceevents.fr>";

export function configEmail(env: Record<string, string | undefined>): ConfigEmail {
  return {
    destinataire: env.contact_destinataire || DESTINATAIRE_PAR_DEFAUT,
    expediteur: env.contact_expediteur || EXPEDITEUR_PAR_DEFAUT,
  };
}
