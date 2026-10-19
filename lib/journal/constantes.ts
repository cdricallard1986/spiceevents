import { urlPublique } from "@/lib/photos/constantes";

// Constantes du journal partagées par le site, le back office (navigateur
// compris) et les schémas Zod : fichier sans Zod, pour ne pas l'embarquer côté client.

export const CATEGORIES = [
  "Conseils mariage",
  "Musique & ambiance",
  "Technique",
  "Animations",
  "Mariages réalisés",
] as const;

export type Categorie = (typeof CATEGORIES)[number];

/**
 * Filtres invisibles des rangées « derniers articles » des pages Mariages et
 * Événementiel. Il n'existe pas de catégorie « événement » : la page
 * Événementiel montre les articles techniques, musicaux et d'animation.
 */
export const CATEGORIES_MARIAGE: readonly Categorie[] = ["Conseils mariage", "Mariages réalisés"];
export const CATEGORIES_EVENEMENT: readonly Categorie[] = ["Technique", "Musique & ambiance", "Animations"];

export function estCategorie(valeur: unknown): valeur is Categorie {
  return (CATEGORIES as readonly unknown[]).includes(valeur);
}

/** Longueurs maximales (en caractères), alignées sur les contraintes de la table `articles` (migration 0008). */
export const LIMITES_ARTICLES = {
  slug: 120,
  titre: 200,
  sousTitre: 300,
  description: 160,
  couvertureAlt: 300,
  /** Texte alternatif et légende d'une photo du texte (même limite que les photos des galeries). */
  altImage: 300,
  legendeImage: 300,
  /** Adresse d'un lien du texte. */
  lien: 2048,
} as const;

/** Adresse d'un article : minuscules, chiffres et tirets simples (contrainte de la table). */
export const MOTIF_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Une image d'article (couverture ou photo du texte) est :
 * - un fichier du site, livré avec le code : `/journal/<slug>/<fichier>` ;
 * - ou un fichier du bucket `medias` envoyé depuis le back office : `journal/…`.
 * Mêmes motifs que la contrainte `couverture` de la table.
 */
export const MOTIF_IMAGE_SITE = /^\/journal\/[a-z0-9/_.-]+\.(jpg|jpeg|png|webp)$/;
export const MOTIF_IMAGE_BUCKET = /^journal\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/;

/** Chemin d'image accepté : l'un des deux motifs, sans remontée de dossier ni `//`. */
export function estCheminImage(chemin: string): boolean {
  if (chemin.includes("..") || chemin.includes("//")) return false;
  return MOTIF_IMAGE_SITE.test(chemin) || MOTIF_IMAGE_BUCKET.test(chemin);
}

/** Adresse à afficher : le fichier du site tel quel, ou l'adresse publique du bucket `medias`. */
export function srcImage(chemin: string): string {
  return chemin.startsWith("/") ? chemin : urlPublique(chemin);
}

export function longueur(texte: string): number {
  return Array.from(texte).length;
}
