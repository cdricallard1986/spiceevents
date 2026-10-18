/**
 * D'où les pages publiques lisent-elles les galeries ? Même règle que les avis
 * (voir lib/avis/source.ts) :
 *
 * - `base` : Supabase, dès que `NEXT_PUBLIC_SUPABASE_URL` est définie, et
 *   TOUJOURS sur Vercel (`VERCEL`) : une page publiée ne montre jamais les
 *   listes de secours à la place des galeries gérées dans le back office. Une
 *   erreur de Supabase fait échouer la génération de la page.
 * - `fichiers` : sans Supabase dans l'environnement (développement local,
 *   tests, conteneur sans accès réseau), les listes du code d'avant le back
 *   office (`repli.ts`).
 */
export type SourcePhotos = "base" | "fichiers";

type Environnement = Record<string, string | undefined>;

export function sourcePhotos(env: Environnement): SourcePhotos {
  return env.NEXT_PUBLIC_SUPABASE_URL || env.VERCEL ? "base" : "fichiers";
}
