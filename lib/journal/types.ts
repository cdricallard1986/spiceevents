import type { Categorie } from "./constantes";
import type { DocumentArticle } from "./document";

export type StatutArticle = "brouillon" | "publie";

/** Un article tel que la table `public.articles` le stocke (sans les horodatages de ligne). */
export type LigneArticle = {
  id: string;
  statut: StatutArticle;
  /** Horodatage ISO de la première publication ; null pour un brouillon jamais publié. */
  publie_le: string | null;
  slug: string;
  titre: string;
  sous_titre: string | null;
  description: string | null;
  categorie: Categorie | null;
  /** AAAA-MM-JJ, date affichée. */
  date_publication: string | null;
  /** `/journal/…` (fichier du site) ou `journal/…` (chemin dans le bucket `medias`). */
  couverture: string | null;
  couverture_alt: string | null;
  /** Document de l'éditeur (lib/journal/document.ts) ; validé à la lecture. */
  contenu: unknown;
};

/** Colonnes lues par le site, dans l'ordre du type. */
export const COLONNES_ARTICLE =
  "id, statut, publie_le, slug, titre, sous_titre, description, categorie, date_publication, couverture, couverture_alt, contenu";

/**
 * Un article publié, prêt pour les pages publiques : tous les champs d'un
 * article publié sont renseignés (contrainte `articles_publie_complet`).
 */
export type Article = {
  id: string;
  slug: string;
  titre: string;
  sousTitre?: string;
  description: string;
  categorie: Categorie;
  /** AAAA-MM-JJ. */
  date: string;
  /** Chemin enregistré (`/journal/…` ou `journal/…`) ; à afficher avec `srcImage()`. */
  couverture: string;
  couvertureAlt: string;
  contenu: DocumentArticle;
  /** Minutes de lecture estimées. */
  lecture: number;
};
