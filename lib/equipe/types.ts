/** DJ ou musicien : la section de la page Nos DJ où apparaît le membre. */
export type GroupeEquipe = "dj" | "musicien";

/**
 * Un membre de l’équipe tel que la table `public.equipe` le stocke (migration
 * 0012), sans les horodatages. Champs `_en` à null : la version anglaise du
 * site affiche le texte français.
 */
export type MembreEquipe = {
  id: string;
  groupe: GroupeEquipe;
  /** Prénom et initiale du nom (« Kevin R. »), ou nom de scène (« DJ Pan’s »). */
  nom: string;
  /** L’autre nom sous lequel les mariés le connaissent, affiché sous le nom. */
  alias: string | null;
  role_fr: string;
  role_en: string | null;
  styles_fr: string[];
  styles_en: string[];
  accroche_fr: string;
  accroche_en: string | null;
  /** Paragraphes séparés par une ligne vide. */
  presentation_fr: string;
  presentation_en: string | null;
  avis_texte_fr: string | null;
  avis_texte_en: string | null;
  avis_auteur_fr: string | null;
  avis_auteur_en: string | null;
  lieux_fr: string | null;
  lieux_en: string | null;
  lien_url: string | null;
  lien_libelle_fr: string | null;
  lien_libelle_en: string | null;
  /** `/images/<clé>.jpg` (fichier du site) ou `equipe/…` (envoyé dans le bucket `medias`). */
  photo_chemin: string | null;
  photo_largeur: number | null;
  photo_hauteur: number | null;
  /** Point gardé au recadrage de la carte (`object-position`), ex. « 50% 30% ». */
  photo_cadrage: string;
  publie: boolean;
  ordre: number;
};

/** Colonnes lues (site et back office), dans l’ordre du type. */
export const COLONNES_EQUIPE =
  "id, groupe, nom, alias, role_fr, role_en, styles_fr, styles_en, accroche_fr, accroche_en, presentation_fr, presentation_en, avis_texte_fr, avis_texte_en, avis_auteur_fr, avis_auteur_en, lieux_fr, lieux_en, lien_url, lien_libelle_fr, lien_libelle_en, photo_chemin, photo_largeur, photo_hauteur, photo_cadrage, publie, ordre";
