import { OPTIONS } from "@/contenu/options";
import { SUPABASE_URL } from "@/lib/supabase/config";

// Constantes des photos partagées par le site, le back office (navigateur
// compris) et les schémas Zod : fichier sans Zod, pour ne pas l’embarquer côté client.

/** Longueurs et dimensions maximales, alignées sur les contraintes des tables (migration 0006). */
export const LIMITES_PHOTOS = {
  alt: 300,
  credit: 200,
  dimension: 20000,
} as const;

/** Bucket Storage public des fichiers envoyés depuis le back office. */
export const BUCKET_MEDIAS = "medias";

/** Préfixe des galeries « page d’option » : `option:<slug français>`. */
export const PREFIXE_OPTION = "option:";

/** Préfixe des diaporamas d’en-tête de page (une photo tirée au hasard à chaque visite) : `entete:<page>`. */
export const PREFIXE_ENTETE = "entete:";

export type Galerie = "galerie_mariages" | "galerie_evenements" | `option:${string}` | `entete:${string}`;

/**
 * Pages dont l’en-tête est un diaporama (une photo tirée au hasard à chaque
 * visite), dans l’ordre du back office. `page` : l’adresse française.
 */
export const ENTETES = [
  { page: "accueil", libelle: "Accueil", href: "/" },
  { page: "mariages", libelle: "Mariages", href: "/mariages" },
  { page: "evenementiel", libelle: "Événements", href: "/evenementiel" },
  { page: "son-et-lumiere", libelle: "Son & lumière", href: "/son-et-lumiere" },
] as const;

export type PageEntete = (typeof ENTETES)[number]["page"];

/** Diaporama d’en-tête d’une page. */
export function galerieEntete(page: PageEntete): Galerie {
  return `${PREFIXE_ENTETE}${page}`;
}

/** Une photo d’en-tête remplit l’écran : paysage, et assez large pour rester nette. */
export const ENTETE_LARGEUR_MIN = 1600;
export const ENTETE_RATIO_MIN = 1.3;

/** La photo convient-elle à un en-tête plein écran ? */
export function convientEnTete(photo: { largeur: number; hauteur: number }): boolean {
  return photo.largeur >= ENTETE_LARGEUR_MIN && photo.largeur / photo.hauteur >= ENTETE_RATIO_MIN;
}

export const MESSAGE_ENTETE_INADAPTEE = `Photo trop petite ou pas assez en paysage pour un en-tête plein écran (${ENTETE_LARGEUR_MIN} px de large au moins, format paysage).`;

/** Une galerie d’option ne s’affiche sur sa page qu’à partir de ce nombre de photos. */
export const MINIMUM_PHOTOS_OPTION = 2;

/** Galerie de la page d’une option (slug français, celui de `contenu/options.ts`). */
export function galerieOption(slugFr: string): Galerie {
  return `${PREFIXE_OPTION}${slugFr}`;
}

/** Famille d’un emplacement : diaporama d’en-tête, page Galerie, ou galerie d’une page d’animation. */
export type FamilleGalerie = "entete" | "galerie" | "option";

export type GaleriePropose = {
  valeur: Galerie;
  libelle: string;
  famille: FamilleGalerie;
  /** Galerie d’une page d’animation (affichée seulement à partir de 2 photos). */
  option: boolean;
};

/** Libellés des familles, dans l’ordre du back office. */
export const FAMILLES_GALERIES: readonly { famille: FamilleGalerie; libelle: string; aide: string }[] = [
  { famille: "entete", libelle: "Diaporamas en haut de page", aide: "Une photo tirée au hasard à chaque visite, en plein écran." },
  { famille: "galerie", libelle: "Page Galerie", aide: "Dans l’ordre choisi ici." },
  { famille: "option", libelle: "Pages des animations", aide: "Galerie en bas de la page, à partir de 2 photos." },
];

/** Tous les emplacements de photos du site, dans l’ordre du back office. */
export const GALERIES: readonly GaleriePropose[] = [
  ...ENTETES.map((e) => ({ valeur: galerieEntete(e.page), libelle: e.libelle, famille: "entete" as const, option: false })),
  { valeur: "galerie_mariages", libelle: "Galerie — Mariages", famille: "galerie", option: false },
  { valeur: "galerie_evenements", libelle: "Galerie — Événements", famille: "galerie", option: false },
  ...OPTIONS.map((o) => ({ valeur: galerieOption(o.slug.fr), libelle: o.titre.fr, famille: "option" as const, option: true })),
];

const PAR_VALEUR = new Map(GALERIES.map((g) => [g.valeur as string, g]));

export function estGalerieConnue(valeur: string): valeur is Galerie {
  return PAR_VALEUR.has(valeur);
}

export function estGalerieOption(valeur: string): boolean {
  return valeur.startsWith(PREFIXE_OPTION);
}

export function estGalerieEntete(valeur: string): boolean {
  return valeur.startsWith(PREFIXE_ENTETE);
}

/** Libellé lisible ; une galerie inconnue (option retirée du site) est affichée telle quelle. */
export function libelleGalerie(valeur: string): string {
  const g = PAR_VALEUR.get(valeur);
  if (!g) return `${valeur} (galerie inconnue)`;
  if (g.famille === "entete") return `En-tête ${g.libelle}`;
  return g.option ? `Page ${g.libelle}` : g.libelle;
}

/**
 * Adresse publique d’un fichier du bucket `medias` (bucket public : lecture
 * sans jeton). Le domaine est ouvert à `next/image` (`images.remotePatterns`
 * dans next.config.ts) et à la CSP (`img-src`).
 */
export function urlPublique(chemin: string, supabaseUrl: string = SUPABASE_URL): string {
  return `${new URL(supabaseUrl).origin}/storage/v1/object/public/${BUCKET_MEDIAS}/${chemin}`;
}
