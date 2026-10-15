/**
 * Constantes du formulaire de contact, sans dépendance : importables par le
 * composant client sans embarquer Zod dans le navigateur.
 */

export const LANGUES = ["fr", "en"] as const;
export type Langue = (typeof LANGUES)[number];

export const TYPES_EVENEMENT = ["mariage", "prive", "entreprise", "autre"] as const;
export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

export const LIBELLES_TYPE: Record<Langue, Record<TypeEvenement, string>> = {
  fr: { mariage: "Mariage", prive: "Événement privé", entreprise: "Événement d'entreprise", autre: "Autre" },
  en: { mariage: "Wedding", prive: "Private event", entreprise: "Corporate event", autre: "Other" },
};

export const LIMITES = { nom: 80, email: 254, lieu: 150, message: 3000, invitesMax: 2000 } as const;

/** Champs lus dans le formulaire (tout le reste est ignoré). */
export const CHAMPS = [
  "prenoms",
  "nom",
  "email",
  "telephone",
  "type",
  "date",
  "lieu",
  "invites",
  "message",
  "langue",
  "site_web",
  "ouvert_le",
  "envoye_le",
] as const;
export type Champ = (typeof CHAMPS)[number];
