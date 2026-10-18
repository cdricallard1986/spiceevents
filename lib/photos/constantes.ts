import { OPTIONS } from "@/contenu/options";
import { SUPABASE_URL } from "@/lib/supabase/config";

// Constantes des photos partagées par le site, le back office (navigateur
// compris) et les schémas Zod : fichier sans Zod, pour ne pas l'embarquer côté client.

/** Longueurs et dimensions maximales, alignées sur les contraintes des tables (migration 0006). */
export const LIMITES_PHOTOS = {
  alt: 300,
  credit: 200,
  dimension: 20000,
} as const;

/** Bucket Storage public des fichiers envoyés depuis le back office. */
export const BUCKET_MEDIAS = "medias";

/** Préfixe des galeries « page d'option » : `option:<slug français>`. */
export const PREFIXE_OPTION = "option:";

export type Galerie = "galerie_mariages" | "galerie_evenements" | `option:${string}`;

/** Une galerie d'option ne s'affiche sur sa page qu'à partir de ce nombre de photos. */
export const MINIMUM_PHOTOS_OPTION = 2;

/** Galerie de la page d'une option (slug français, celui de `contenu/options.ts`). */
export function galerieOption(slugFr: string): Galerie {
  return `${PREFIXE_OPTION}${slugFr}`;
}

export type GaleriePropose = {
  valeur: Galerie;
  libelle: string;
  /** Galerie d'une page d'animation (affichée seulement à partir de 2 photos). */
  option: boolean;
};

/** Toutes les galeries du site, dans l'ordre du sélecteur du back office. */
export const GALERIES: readonly GaleriePropose[] = [
  { valeur: "galerie_mariages", libelle: "Galerie — Mariages", option: false },
  { valeur: "galerie_evenements", libelle: "Galerie — Événements", option: false },
  ...OPTIONS.map((o) => ({ valeur: galerieOption(o.slug.fr), libelle: o.titre.fr, option: true })),
];

const PAR_VALEUR = new Map(GALERIES.map((g) => [g.valeur as string, g]));

export function estGalerieConnue(valeur: string): valeur is Galerie {
  return PAR_VALEUR.has(valeur);
}

export function estGalerieOption(valeur: string): boolean {
  return valeur.startsWith(PREFIXE_OPTION);
}

/** Libellé lisible ; une galerie inconnue (option retirée du site) est affichée telle quelle. */
export function libelleGalerie(valeur: string): string {
  const g = PAR_VALEUR.get(valeur);
  if (!g) return `${valeur} (galerie inconnue)`;
  return g.option ? `Page ${g.libelle}` : g.libelle;
}

/**
 * Adresse publique d'un fichier du bucket `medias` (bucket public : lecture
 * sans jeton). Le domaine est ouvert à `next/image` (`images.remotePatterns`
 * dans next.config.ts) et à la CSP (`img-src`).
 */
export function urlPublique(chemin: string, supabaseUrl: string = SUPABASE_URL): string {
  return `${new URL(supabaseUrl).origin}/storage/v1/object/public/${BUCKET_MEDIAS}/${chemin}`;
}
