import "server-only";
import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { clientPublic } from "@/lib/supabase/public";
import { image, type CleImage } from "@/lib/images";
import { galerieEntete, type PageEntete } from "./constantes";
import { ENTETES_REPLI, lignesDeRepli } from "./repli";
import { galerieEnLangue, sansPhotosDejaMontrees } from "./selection";
import { sourcePhotos } from "./source";
import { COLONNES_LIAISON, COLONNES_PHOTO, type LigneGalerie, type PhotoAffichee } from "./types";

/**
 * Lecture des galeries pour les pages publiques (serveur seulement), sur le
 * modèle des avis (lib/avis/lecture.ts) :
 *
 * - client publishable sans cookies : les pages restent statiques ;
 * - mise en cache sous l’étiquette `galeries` : chaque action du back office
 *   appelle `revalidateTag("galeries")`, la page est régénérée à la visite
 *   suivante. Filet : régénération toutes les heures ;
 * - une erreur de Supabase est levée, jamais remplacée par les listes de
 *   secours : on ne publie pas une page avec d’autres photos que celles choisies.
 */

export const ETIQUETTE_GALERIES = "galeries";
/** Filet de régénération (secondes), au cas où une revalidation se perdrait. */
export const REVALIDATION_GALERIES = 3600;

/** Toutes les photos de toutes les galeries, en une requête (liaison + photo). */
async function lireBase(): Promise<LigneGalerie[]> {
  const { data, error } = await clientPublic()
    .from("galeries_photos")
    .select(`${COLONNES_LIAISON}, photo:photos!inner(${COLONNES_PHOTO})`)
    .order("galerie", { ascending: true })
    .order("ordre", { ascending: true });
  if (error) throw new Error(`[galeries] Lecture des galeries impossible dans Supabase : ${error.message}`);
  return (data ?? []) as unknown as LigneGalerie[];
}

const lireBaseEnCache = unstable_cache(lireBase, ["galeries-photos"], { tags: [ETIQUETTE_GALERIES], revalidate: REVALIDATION_GALERIES });

/** Toutes les lignes des galeries, selon la source (base ou listes de secours). */
export async function lignesDesGaleries(env: Record<string, string | undefined> = process.env): Promise<LigneGalerie[]> {
  return sourcePhotos(env) === "base" ? lireBaseEnCache() : lignesDeRepli();
}

/**
 * Photos d’une galerie (`galerie_mariages`, `galerie_evenements`,
 * `option:<slug>`), dans l’ordre, prêtes à afficher dans la langue de la page.
 */
export async function photosDeGalerie(galerie: string, locale: Locale, env: Record<string, string | undefined> = process.env): Promise<PhotoAffichee[]> {
  return galerieEnLangue(await lignesDesGaleries(env), galerie, locale);
}

/**
 * Photos du diaporama d’en-tête d’une page (`entete:<page>`), choisies dans le
 * back office. Liste vide en base (toutes retirées, ou migration 0011 pas
 * encore appliquée) : la liste du code, pour ne jamais publier un en-tête vide.
 * `sauf` : les photos déjà montrées plus bas sur la page, retirées du tirage
 * (la même photo ne revient pas deux fois sur une page).
 */
export async function photosEnTete(
  page: PageEntete,
  locale: Locale,
  sauf: readonly CleImage[] = [],
  env: Record<string, string | undefined> = process.env,
): Promise<PhotoAffichee[]> {
  const photos = await photosDeGalerie(galerieEntete(page), locale, env);
  const liste = photos.length > 0 ? photos : ENTETES_REPLI[page].map((cle) => image(cle, locale));
  return sansPhotosDejaMontrees(liste, sauf.map((cle) => image(cle, locale).src));
}
