import type { Categorie, Source } from "./constantes";

/** Un avis tel que la table `public.avis` le stocke (sans les horodatages). */
export type Avis = {
  id: string;
  auteurs: string;
  role_fr: string | null;
  role_en: string | null;
  categorie: Categorie;
  texte_fr: string;
  /** null : la version anglaise du site affiche le texte français. */
  texte_en: string | null;
  /** Extrait mis en avant ; null : le début du texte. */
  citation_fr: string | null;
  citation_en: string | null;
  source: Source;
  /** AAAA-MM-JJ. */
  date_avis: string | null;
  lien_source: string | null;
  publie: boolean;
  ordre: number;
  emplacements: string[];
};

/** Colonnes lues (site et back office), dans l'ordre du type. */
export const COLONNES_AVIS =
  "id, auteurs, role_fr, role_en, categorie, texte_fr, texte_en, citation_fr, citation_en, source, date_avis, lien_source, publie, ordre, emplacements";

/**
 * Un avis prêt à afficher dans une langue. `langue` n'est renseignée que si le
 * texte n'est pas dans la langue de la page (anglais non traduit → « fr ») :
 * le composant pose alors `lang="fr"` pour les lecteurs d'écran et les moteurs.
 */
export type AvisAffiche = {
  cle: string;
  auteurs: string;
  role?: string;
  /** Le texte affiché : citation, extrait ou texte complet selon l'endroit. */
  texte: string;
  langue?: "fr";
};
