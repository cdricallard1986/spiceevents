// Classes des champs de saisie du back office : les mêmes que les formulaires
// du site et de la connexion (cohérence graphique).

export const CLASSES_CHAMP = "w-full border border-ligne bg-nuit px-3.5 py-3.5 text-base text-ivoire transition-colors focus:border-or";
/** Champ en erreur : bordure rouge (avec un message sous le champ et un toast). */
export const CLASSES_CHAMP_ERREUR = "w-full border border-erreur bg-nuit px-3.5 py-3.5 text-base text-ivoire transition-colors focus:border-erreur";
export const CLASSES_LIBELLE = "text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-sable";
/** Petit texte d'aide sous un champ. */
export const CLASSES_AIDE = "text-xs text-sable/80";

/** Étiquette (statut, origine, galerie…) : rectangle fin, capitales espacées (charte Nocturne). */
export const CLASSES_PASTILLE = "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.6875rem] font-semibold uppercase leading-5 tracking-[0.12em]";
/** Onglet ou filtre : capitales condensées ; actif = fond orange, texte noir (`aria-pressed`). */
export const CLASSES_ONGLET = "inline-flex items-center gap-2 border px-4 py-2 font-display text-[0.9375rem] uppercase tracking-[0.08em] transition-colors";
export const CLASSES_ONGLET_ACTIF = "border-or bg-or text-nuit";
export const CLASSES_ONGLET_INACTIF = "border-ligne text-sable hover:border-or hover:text-or";
/** Panneau (filtres, liste, carte) : fond un ton au-dessus de la nuit. */
export const CLASSES_PANNEAU = "border border-ligne bg-nuit-2";

/** Bandeau d'information (bordure orange) ou d'alerte (bordure rouge) : la forme de tous les messages en ligne du back office. */
export const CLASSES_BANDEAU = "border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire";
export const CLASSES_BANDEAU_ERREUR = "border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire";
/** Flèches d'ordre (monter / descendre) des listes. */
export const CLASSES_FLECHE =
  "flex size-10 items-center justify-center border border-ligne text-lg text-sable transition-colors hover:border-or hover:text-or disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ligne disabled:hover:text-sable";
