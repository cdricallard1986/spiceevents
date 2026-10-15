// Interdit l'import de ce fichier depuis un composant client : la compilation
// échoue au lieu de glisser la clé service_role dans le JavaScript du navigateur.
// (« server-only » est fourni par Next.js lui-même, sans paquet à installer.)
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase « service_role » : contourne la RLS. Réservé au serveur
 * (Server Actions), jamais exposé au navigateur.
 *
 * Renvoie null si Supabase n'est pas configuré (développement en local sans
 * variables d'environnement) : l'appelant décide quoi faire.
 */
export function clientAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.supabase_service_role_key;
  if (!url || !cle) return null;
  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
