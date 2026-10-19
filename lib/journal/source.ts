/**
 * D'où les pages publiques lisent-elles les articles du journal ? Même règle
 * que les avis et les galeries (voir lib/avis/source.ts) :
 *
 * - `base` : Supabase (clé publishable, articles publiés), dès que
 *   `NEXT_PUBLIC_SUPABASE_URL` est définie, et TOUJOURS sur Vercel (`VERCEL`) :
 *   une page publiée ne montre jamais les fichiers de secours à la place des
 *   articles gérés dans le back office. Une erreur de Supabase fait échouer
 *   la génération de la page.
 * - `fichiers` : sans Supabase dans l'environnement (développement local,
 *   tests, conteneur sans accès réseau), les fichiers MDX d'avant le back
 *   office, convertis à la volée au format de la base (`repli.ts`).
 */
export type SourceArticles = "base" | "fichiers";

type Environnement = Record<string, string | undefined>;

export function sourceArticles(env: Environnement): SourceArticles {
  return env.NEXT_PUBLIC_SUPABASE_URL || env.VERCEL ? "base" : "fichiers";
}
