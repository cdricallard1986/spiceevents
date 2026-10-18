"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from "./config";

/**
 * Client Supabase du navigateur (clé publique, session lue dans les cookies).
 * `createBrowserClient` renvoie toujours la même instance dans un onglet.
 *
 * ⚠️ Il parle directement à Supabase : l'origine du projet figure donc dans la
 * CSP (`connect-src`, voir lib/securite/entetes.ts).
 */
export function clientNavigateur() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE);
}
