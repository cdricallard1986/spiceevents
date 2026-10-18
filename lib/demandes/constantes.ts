/**
 * Statuts commerciaux des demandes de contact (migration 0005), sans
 * dépendance : importables par les composants clients sans embarquer Zod.
 */

export const STATUTS = ["nouvelle", "rappelee", "devis_envoye", "signee", "perdue"] as const;
export type StatutDemande = (typeof STATUTS)[number];

/** Libellé d'une demande (pastille, sélecteur de la fiche). */
export const LIBELLES_STATUT: Record<StatutDemande, string> = {
  nouvelle: "Nouvelle",
  rappelee: "Rappelée",
  devis_envoye: "Devis envoyé",
  signee: "Signée",
  perdue: "Perdue",
};

/** Libellé des filtres de la liste (au pluriel). */
export const LIBELLES_FILTRE: Record<StatutDemande | "toutes", string> = {
  nouvelle: "Nouvelles",
  rappelee: "Rappelées",
  devis_envoye: "Devis envoyé",
  signee: "Signées",
  perdue: "Perdues",
  toutes: "Toutes",
};

/**
 * Couleur de la pastille de chaque statut, dans la charte « Nuit de fête » :
 * une nouvelle demande ressort en or plein, une demande signée en vert, une
 * demande perdue s'efface.
 */
export const COULEURS_STATUT: Record<StatutDemande, string> = {
  nouvelle: "border-or bg-or/15 text-or",
  rappelee: "border-ivoire/50 text-ivoire",
  devis_envoye: "border-or-clair/50 text-or-clair",
  signee: "border-succes/60 text-succes",
  perdue: "border-ligne text-sable/80",
};

/** Longueur maximale de la note interne (contrainte de la base). */
export const LIMITE_NOTE = 5000;

export const LIBELLES_LANGUE = { fr: "Français", en: "Anglais" } as const;

/** Objet du mail ouvert par « Écrire », dans la langue de la demande. */
export const OBJET_EMAIL = { fr: "Votre demande — Spice Events", en: "Your enquiry — Spice Events" } as const;

/** Demandes par page dans la liste. */
export const TAILLE_PAGE = 50;

/** Nombre maximal de demandes chargées par la page (les plus récentes). */
export const LIMITE_CHARGEMENT = 2000;

export function estStatut(v: unknown): v is StatutDemande {
  return typeof v === "string" && (STATUTS as readonly string[]).includes(v);
}
