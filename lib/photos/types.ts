/** Une photo est un fichier du site (`/images/…`, livré avec le code) ou un fichier envoyé dans le bucket `medias`. */
export type OriginePhoto = "site" | "stockage";

/** Une photo telle que la table `public.photos` la stocke (sans les horodatages). */
export type Photo = {
  id: string;
  origine: OriginePhoto;
  /** `/images/<clé>.jpg` (fichier du site) ou `galeries/…` (chemin dans le bucket). */
  chemin: string;
  largeur: number;
  hauteur: number;
  alt_fr: string;
  /** null : la version anglaise du site affiche le texte français. */
  alt_en: string | null;
  credit: string | null;
};

/** Colonnes lues (site et back office), dans l'ordre du type. */
export const COLONNES_PHOTO = "id, origine, chemin, largeur, hauteur, alt_fr, alt_en, credit";

/** Une photo dans une galerie (table `public.galeries_photos`). */
export type Liaison = {
  galerie: string;
  photo_id: string;
  ordre: number;
};

export const COLONNES_LIAISON = "galerie, photo_id, ordre";

/** Une photo de galerie avec sa photo (lecture publique, en une requête). */
export type LigneGalerie = Liaison & { photo: Photo };

/** Une photo prête à afficher dans une langue (props de `next/image`). */
export type PhotoAffichee = {
  src: string;
  width: number;
  height: number;
  alt: string;
};
