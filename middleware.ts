import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { decisionAcces, estCheminAdmin } from "./lib/admin/session";
import { actualiserSession, redirigerAvecCookies } from "./lib/supabase/middleware";

const intl = createMiddleware(routing);

/**
 * Deux mondes séparés :
 * - `/admin…` (back office, français seul, hors next-intl) : session Supabase
 *   rafraîchie et vérifiée par `getUser()`, sinon renvoi vers la connexion ;
 * - tout le reste : le middleware next-intl (langue, adresses traduites).
 */
export default async function middleware(requete: NextRequest) {
  const { pathname, search } = requete.nextUrl;
  if (!estCheminAdmin(pathname)) return intl(requete);

  const session = await actualiserSession(requete);
  const decision = decisionAcces({
    chemin: pathname,
    recherche: search,
    connecte: Boolean(session.utilisateur),
    avaitSession: session.avaitSession,
    indisponible: session.indisponible,
  });
  const reponse =
    decision.type === "continuer" ? session.reponse : redirigerAvecCookies(session.reponse, new URL(decision.vers, requete.url));
  // En plus des balises robots des pages : jamais d'indexation du back office.
  reponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  return reponse;
}

export const config = {
  // Tout sauf l'API, les fichiers internes de Next et les fichiers statiques
  // (`/admin` et ses pages comprises ; `/api/version` reste public).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
