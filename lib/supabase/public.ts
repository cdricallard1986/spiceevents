import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from "./config";

/**
 * Client « visiteur » : clé publishable, SANS session ni cookie. Il n'a que les
 * droits de l'anonyme (RLS : les seules lignes publiées). Sert à la lecture
 * publique des pages — sans `cookies()`, elles restent statiques — et à
 * l'audit RLS (ce que peut faire n'importe qui depuis Internet).
 */
export function clientPublic(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
