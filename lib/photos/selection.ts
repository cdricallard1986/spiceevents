import type { Locale } from "@/i18n/routing";
import { urlPublique } from "./constantes";
import type { Liaison, LigneGalerie, Photo, PhotoAffichee } from "./types";

/**
 * Choix et mise en forme des photos de galerie (logique pure et testée),
 * partagés par les pages publiques et le back office.
 */

/** Tri d'une galerie : par `ordre`, puis identifiant de photo (ordre stable). */
export function comparerLiaisons(a: Pick<Liaison, "ordre" | "photo_id">, b: Pick<Liaison, "ordre" | "photo_id">): number {
  return a.ordre - b.ordre || (a.photo_id < b.photo_id ? -1 : a.photo_id > b.photo_id ? 1 : 0);
}

/** Adresse d'affichage : le fichier du site tel quel, ou l'adresse publique du bucket. */
export function adressePhoto(photo: Pick<Photo, "origine" | "chemin">): string {
  return photo.origine === "site" ? photo.chemin : urlPublique(photo.chemin);
}

/** Texte alternatif dans une langue : en anglais, l'anglais ou à défaut le français. */
export function altEnLangue(photo: Pick<Photo, "alt_fr" | "alt_en">, locale: Locale): string {
  return locale === "en" ? (photo.alt_en ?? photo.alt_fr) : photo.alt_fr;
}

export function photoAffichee(photo: Photo, locale: Locale): PhotoAffichee {
  return { src: adressePhoto(photo), width: photo.largeur, height: photo.hauteur, alt: altEnLangue(photo, locale) };
}

/** Photos d'une galerie (lecture publique), dans l'ordre, prêtes à afficher. */
export function galerieEnLangue(lignes: readonly LigneGalerie[], galerie: string, locale: Locale): PhotoAffichee[] {
  return lignes
    .filter((l) => l.galerie === galerie)
    .sort(comparerLiaisons)
    .map((l) => photoAffichee(l.photo, locale));
}

/** Photos d'une galerie à partir des deux tables (back office), dans l'ordre. */
export function photosDeLaGalerie(photos: readonly Photo[], liaisons: readonly Liaison[], galerie: string): Photo[] {
  const parId = new Map(photos.map((p) => [p.id, p]));
  return liaisons
    .filter((l) => l.galerie === galerie && parId.has(l.photo_id))
    .sort(comparerLiaisons)
    .map((l) => parId.get(l.photo_id)!);
}
