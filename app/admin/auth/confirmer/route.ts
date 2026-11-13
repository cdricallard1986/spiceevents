import { type NextRequest, NextResponse } from "next/server";
import { clientServeur } from "@/lib/supabase/server";
import { CHEMIN_CONNEXION } from "@/lib/admin/session";
import { HREF_COMPTE } from "@/lib/admin/navigation";

/**
 * Lien de l'email « Mot de passe oublié » : ouvre la session de réinitialisation
 * puis mène à « Mon compte » pour choisir le nouveau mot de passe.
 *
 * - Une session est déjà ouverte dans ce navigateur : on ne la remplace JAMAIS
 *   en silence (règle de Cédric) ; seul un administrateur a un compte, et il est
 *   déjà connecté : on le mène directement à « Mon compte », le lien reste inutilisé.
 * - Lien expiré, déjà servi ou incomplet : retour à la connexion, avec la raison.
 * Le jeton n'est jamais journalisé ; la page suivante ne le voit pas (redirection).
 */
export const dynamic = "force-dynamic";

export async function GET(requete: NextRequest) {
  const url = requete.nextUrl;
  const vers = (chemin: string) => NextResponse.redirect(new URL(chemin, url.origin), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });

  const jeton = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await clientServeur();

  const { data: deja } = await supabase.auth.getUser();
  if (deja.user) return vers(HREF_COMPTE);

  if (!jeton || !/^[A-Za-z0-9_-]{10,200}$/.test(jeton) || type !== "recovery") return vers(`${CHEMIN_CONNEXION}?raison=lien_invalide`);
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: jeton });
  if (error) return vers(`${CHEMIN_CONNEXION}?raison=lien_invalide`);
  return vers(`${HREF_COMPTE}?raison=reinitialisation`);
}
