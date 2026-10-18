/**
 * D'où les pages publiques lisent-elles les avis ?
 *
 * - `base` : Supabase (clé publishable, avis publiés). C'est le cas dès que
 *   `NEXT_PUBLIC_SUPABASE_URL` est définie, et TOUJOURS sur Vercel (`VERCEL`),
 *   même si la variable manquait : en production comme en aperçu, une page ne
 *   doit jamais être publiée avec les fichiers de secours à la place des avis
 *   gérés dans le back office. Une erreur de Supabase y fait échouer la
 *   génération de la page (au build) ou garde la version précédente (en ligne).
 * - `fichiers` : sans Supabase dans l'environnement (développement local,
 *   tests, conteneur sans accès réseau), les fichiers d'avis d'avant le back
 *   office, convertis au même format (`repli.ts`).
 */
export type SourceAvis = "base" | "fichiers";

type Environnement = Record<string, string | undefined>;

export function sourceAvis(env: Environnement): SourceAvis {
  return env.NEXT_PUBLIC_SUPABASE_URL || env.VERCEL ? "base" : "fichiers";
}
