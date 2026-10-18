import { ordreSuivant, rangsEchanges } from "@/lib/avis/admin";
import { MINIMUM_PHOTOS_OPTION, estGalerieOption, libelleGalerie } from "./constantes";
import type { ErreursPhoto } from "./schema";
import type { Liaison, Photo } from "./types";

/**
 * Logique pure de l'écran des photos du back office, testée et partagée avec
 * les Server Actions. Rangs : comme les avis (10, 20, 30… ; échange de deux
 * voisins).
 */

export { ordreSuivant, rangsEchanges };

/** Galeries où une photo apparaît (valeurs), dans l'ordre alphabétique de leur libellé. */
export function galeriesDeLaPhoto(liaisons: readonly Liaison[], photoId: string): string[] {
  return liaisons
    .filter((l) => l.photo_id === photoId)
    .map((l) => l.galerie)
    .sort((a, b) => libelleGalerie(a).localeCompare(libelleGalerie(b), "fr"));
}

/** Photos de la photothèque absentes d'une galerie (pour « Ajouter depuis la photothèque »). */
export function photosHorsGalerie(photos: readonly Photo[], liaisons: readonly Liaison[], galerie: string): Photo[] {
  const presentes = new Set(liaisons.filter((l) => l.galerie === galerie).map((l) => l.photo_id));
  return photos.filter((p) => !presentes.has(p.id));
}

/** Une galerie d'option sous le minimum ne s'affiche pas sur sa page. */
export function sousLeMinimum(galerie: string, nombre: number): boolean {
  return estGalerieOption(galerie) && nombre < MINIMUM_PHOTOS_OPTION;
}

/** Avertissement d'une galerie d'option qui n'a plus assez de photos. */
export function messageMinimum(galerie: string, nombre: number): string {
  const n = nombre === 0 ? "aucune photo" : `${nombre} photo${nombre > 1 ? "s" : ""}`;
  return `${libelleGalerie(galerie)} : ${n}. Il en faut au moins ${MINIMUM_PHOTOS_OPTION} — en attendant, la galerie ne s'affichera pas sur la page.`;
}

/** Photo supprimable définitivement ? Seulement un fichier envoyé (bucket), jamais un fichier du site. */
export function estSupprimable(photo: Pick<Photo, "origine">): boolean {
  return photo.origine === "stockage";
}

/** Nom lisible d'une photo (titres, messages) : le début de son texte alternatif. */
export function nomPhoto(photo: Pick<Photo, "alt_fr">, longueur = 60): string {
  const t = photo.alt_fr.trim();
  return t.length <= longueur ? t : `${t.slice(0, longueur - 1).trimEnd()}…`;
}

// --- Réponses des Server Actions (app/admin/(espace)/photos/actions.ts) -----

export type ResultatEchec = { ok: false; message: string; erreurs?: ErreursPhoto };

export type ResultatUrlEnvoi = { ok: true; chemin: string; jeton: string } | ResultatEchec;

/** Photo enregistrée (et sa liaison si une galerie était demandée). */
export type ResultatEnregistrement =
  | { ok: true; photo: Photo; liaison: Liaison | null; /** La photo est enregistrée, mais pas ajoutée à la galerie. */ avertissement?: string }
  | ResultatEchec;

export type ResultatPhoto = { ok: true; photo: Photo } | ResultatEchec;

export type ResultatAjout = { ok: true; liaisons: Liaison[] } | ResultatEchec;

/** Retrait d'une galerie : le nombre de photos qui y restent (pour l'avertissement des pages d'option). */
export type ResultatRetrait = { ok: true; galerie: string; photoId: string; restantes: number; avertissement?: string } | ResultatEchec;

export type ResultatEchangePhotos = { ok: true; rangs: { photoId: string; ordre: number }[] } | ResultatEchec;

export type ResultatSuppressionPhoto = { ok: true; id: string } | ResultatEchec;
