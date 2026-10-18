import "server-only";
import { unstable_cache } from "next/cache";
import { clientPublic } from "@/lib/supabase/public";
import { avisDeRepli } from "./repli";
import { sourceAvis } from "./source";
import { COLONNES_AVIS, type Avis } from "./types";

/**
 * Lecture des avis publiés pour les pages publiques (serveur seulement).
 *
 * - Client publishable sans cookies : les pages restent statiques.
 * - Mise en cache sous l'étiquette `avis` : chaque action du back office
 *   appelle `revalidateTag("avis")`, et la page est régénérée à la visite
 *   suivante. Filet : régénération toutes les heures.
 * - Source choisie par `sourceAvis()` : Supabase, ou les fichiers de secours
 *   sans Supabase dans l'environnement. Une erreur de Supabase est levée,
 *   jamais remplacée par les fichiers : on ne publie pas une page sans ses avis.
 */

export const ETIQUETTE_AVIS = "avis";
/** Filet de régénération (secondes), au cas où une revalidation se perdrait. */
export const REVALIDATION_AVIS = 3600;

async function lireBase(): Promise<Avis[]> {
  const { data, error } = await clientPublic()
    .from("avis")
    .select(COLONNES_AVIS)
    .eq("publie", true)
    .order("ordre", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(`[avis] Lecture des avis impossible dans Supabase : ${error.message}`);
  return (data ?? []) as Avis[];
}

const lireBaseEnCache = unstable_cache(lireBase, ["avis-publies"], { tags: [ETIQUETTE_AVIS], revalidate: REVALIDATION_AVIS });

/** Avis publiés (tous) ; le choix par page se fait avec `selection.ts`. */
export async function avisPublies(env: Record<string, string | undefined> = process.env): Promise<Avis[]> {
  return sourceAvis(env) === "base" ? lireBaseEnCache() : avisDeRepli();
}
