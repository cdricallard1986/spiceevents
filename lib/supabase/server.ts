import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from "./config";

/**
 * Client Supabase lié à la session du visiteur (cookies), pour les Server
 * Components et les Server Actions. Clé publique : il n'a que les droits de la
 * RLS (`est_admin()` pour l'écriture). Un client neuf par requête.
 */
export async function clientServeur() {
  const magasin = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    cookies: {
      getAll: () => magasin.getAll(),
      setAll(aEcrire) {
        try {
          aEcrire.forEach(({ name, value, options }) => magasin.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component (cookies en lecture seule) : sans
          // conséquence, le middleware rafraîchit la session à chaque requête.
        }
      },
    },
  });
}
