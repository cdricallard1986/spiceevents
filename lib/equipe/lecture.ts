import "server-only";
import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { EQUIPE_INITIALE } from "@/contenu/equipe";
import { sourceAvis } from "@/lib/avis/source";
import { clientPublic } from "@/lib/supabase/public";
import { trierEquipe } from "./admin";
import { carteEquipe, type CarteEquipe } from "./affichage";
import { COLONNES_EQUIPE, type MembreEquipe } from "./types";

/**
 * Lecture de l'équipe publiée pour la page Nos DJ (serveur seulement), sur le
 * modèle des avis : client publishable sans cookies (page statique), cache
 * étiqueté `equipe` (chaque action du back office appelle
 * `revalidateTag("equipe")`), filet d'une heure. Sans Supabase dans
 * l'environnement : l'équipe du code (`contenu/equipe.ts`). Une erreur de
 * Supabase est levée, jamais remplacée par ces données : on ne publie pas
 * une équipe périmée.
 */

export const ETIQUETTE_EQUIPE = "equipe";
export const REVALIDATION_EQUIPE = 3600;

async function lireBase(): Promise<MembreEquipe[]> {
  const { data, error } = await clientPublic().from("equipe").select(COLONNES_EQUIPE).eq("publie", true).order("ordre", { ascending: true });
  if (error) throw new Error(`[equipe] Lecture de l'équipe impossible dans Supabase : ${error.message}`);
  return (data ?? []) as MembreEquipe[];
}

const lireBaseEnCache = unstable_cache(lireBase, ["equipe-publiee"], { tags: [ETIQUETTE_EQUIPE], revalidate: REVALIDATION_EQUIPE });

/** Membres publiés, triés (DJ puis musiciens), en cartes dans la langue de la page. */
export async function equipePubliee(locale: Locale, env: Record<string, string | undefined> = process.env): Promise<CarteEquipe[]> {
  const membres = sourceAvis(env) === "base" ? await lireBaseEnCache() : EQUIPE_INITIALE.filter((m) => m.publie);
  return trierEquipe(membres).map((m) => carteEquipe(m, locale));
}
