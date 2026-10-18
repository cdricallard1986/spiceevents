/**
 * Adresse et clé publique du projet Supabase, communes au serveur, au
 * middleware et au navigateur.
 *
 * La clé « publishable » est publique par nature (elle remplace l'ancienne clé
 * `anon`) : elle ne donne que les droits accordés par la RLS. Elle peut donc
 * figurer ici comme valeur par défaut. La clé `service_role`, elle, ne quitte
 * jamais le serveur (voir `admin.ts`).
 *
 * ⚠️ Les deux variables sont lues telles quelles (`process.env.NEXT_PUBLIC_…`)
 * pour que Next les remplace par leur valeur dans le JavaScript du navigateur.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tyghpfqyppiughrknuit.supabase.co";

export const SUPABASE_CLE_PUBLIQUE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_cilJqj51OvDW5i4E72LlFw_JLkkTU7N";

/**
 * Nom du cookie de session posé par `@supabase/ssr` : `sb-<ref>-auth-token`,
 * où `<ref>` est le premier mot du domaine du projet. Un jeton trop long est
 * découpé en `…-auth-token.0`, `.1`…
 */
export function nomCookieSession(url: string = SUPABASE_URL): string {
  return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
}
