import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError, type User } from "@supabase/supabase-js";
import { aCookieSession } from "@/lib/admin/session";
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL, nomCookieSession } from "./config";

export type EtatSession = {
  /** Réponse « continuer », porteuse des cookies rafraîchis (ou effacés) par Supabase. */
  reponse: NextResponse;
  /** Utilisateur validé par le serveur d'auth (`getUser()`), sinon null. */
  utilisateur: User | null;
  /** Un cookie de session était présent : sans utilisateur, c'est qu'il a été refusé. */
  avaitSession: boolean;
  /** Le serveur d'auth n'a pas répondu (panne réseau), à distinguer d'une session expirée. */
  indisponible: boolean;
};

/**
 * Rafraîchit la session Supabase dans le middleware (les Server Components ne
 * peuvent pas écrire de cookies) et vérifie l'utilisateur avec `getUser()` —
 * jamais `getSession()` seul, qui croit le cookie sans le faire valider : une
 * session révoquée resterait utilisable jusqu'à l'expiration du jeton.
 */
export async function actualiserSession(requete: NextRequest): Promise<EtatSession> {
  let reponse = NextResponse.next({ request: requete });
  const avaitSession = aCookieSession(
    requete.cookies.getAll().map((c) => c.name),
    nomCookieSession(),
  );
  // Aucun cookie de session : inutile d'interroger Supabase.
  if (!avaitSession) return { reponse, utilisateur: null, avaitSession, indisponible: false };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    cookies: {
      getAll: () => requete.cookies.getAll(),
      setAll(aEcrire, entetes) {
        aEcrire.forEach(({ name, value }) => requete.cookies.set(name, value));
        reponse = NextResponse.next({ request: requete });
        aEcrire.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
        // En-têtes anti-cache : une réponse qui pose un jeton ne doit jamais être servie à un autre visiteur.
        Object.entries(entetes).forEach(([cle, valeur]) => reponse.headers.set(cle, valeur));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  return {
    reponse,
    utilisateur: data.user,
    avaitSession,
    indisponible: !data.user && isAuthRetryableFetchError(error),
  };
}

/**
 * Redirection qui REPORTE les cookies que Supabase vient d'écrire ou d'effacer :
 * un `NextResponse.redirect()` neuf les perdrait, le cookie périmé survivrait et
 * le message « session expirée » reviendrait à chaque page.
 */
export function redirigerAvecCookies(depuis: NextResponse, url: URL): NextResponse {
  const redirection = NextResponse.redirect(url);
  depuis.cookies.getAll().forEach((cookie) => redirection.cookies.set(cookie));
  for (const cle of ["cache-control", "expires", "pragma"]) {
    const valeur = depuis.headers.get(cle);
    if (valeur) redirection.headers.set(cle, valeur);
  }
  return redirection;
}
