import "server-only";
import { unstable_cache } from "next/cache";
import { clientPublic } from "@/lib/supabase/public";
import { articleDepuisLigne, trierParDate } from "./articles";
import { lignesDeRepli } from "./repli";
import { sourceArticles } from "./source";
import { COLONNES_ARTICLE, type Article, type LigneArticle } from "./types";

/**
 * Lecture des articles publiés pour les pages publiques (serveur seulement),
 * sur le modèle des avis (lib/avis/lecture.ts) :
 *
 * - client publishable sans cookies : les pages restent statiques ;
 * - mise en cache sous l'étiquette `articles` : chaque action du back office
 *   appelle `revalidateTag("articles")`, la page est régénérée à la visite
 *   suivante. Filet : régénération toutes les heures ;
 * - une erreur de Supabase (ou un article publié invalide) est levée, jamais
 *   remplacée par les fichiers : on ne publie pas un journal incomplet.
 *
 * Une seule requête pour tout le journal (contenus compris : la liste affiche
 * le temps de lecture). Quelques centaines de Ko pour des dizaines d'articles,
 * loin de la limite de 2 Mo d'une entrée du cache de Next.
 */

export const ETIQUETTE_ARTICLES = "articles";
/** Filet de régénération (secondes), au cas où une revalidation se perdrait. */
export const REVALIDATION_ARTICLES = 3600;

async function lireBase(): Promise<LigneArticle[]> {
  const { data, error } = await clientPublic()
    .from("articles")
    .select(COLONNES_ARTICLE)
    .eq("statut", "publie")
    .order("date_publication", { ascending: false })
    .order("titre", { ascending: true });
  if (error) throw new Error(`[articles] Lecture des articles impossible dans Supabase : ${error.message}`);
  return (data ?? []) as LigneArticle[];
}

const lireBaseEnCache = unstable_cache(lireBase, ["articles-publies"], { tags: [ETIQUETTE_ARTICLES], revalidate: REVALIDATION_ARTICLES });

/** Articles publiés, du plus récent au plus ancien, selon la source (base ou fichiers de secours). */
export async function articlesPublies(env: Record<string, string | undefined> = process.env): Promise<Article[]> {
  const lignes = sourceArticles(env) === "base" ? await lireBaseEnCache() : lignesDeRepli();
  // La RLS ne laisse voir que les articles publiés ; le filtre reste ici par prudence.
  return trierParDate(lignes.filter((l) => l.statut === "publie").map(articleDepuisLigne));
}

/** Un article publié par son adresse, ou undefined (page 404). */
export async function articleParSlug(slug: string, env: Record<string, string | undefined> = process.env): Promise<Article | undefined> {
  return (await articlesPublies(env)).find((a) => a.slug === slug);
}
