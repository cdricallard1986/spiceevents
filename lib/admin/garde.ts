import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { clientServeur } from "@/lib/supabase/server";
import { CHEMIN_CONNEXION } from "./session";

export type ContexteAdmin = {
  supabase: Awaited<ReturnType<typeof clientServeur>>;
  utilisateur: User;
};

/**
 * Garde du back office : à appeler EN TÊTE de chaque page et de chaque Server
 * Action admin. Le middleware vérifie déjà la session, mais :
 * - une Server Action est un point d'entrée HTTP public, appelable sans passer
 *   par la page ;
 * - seul `est_admin()` (ligne dans `administrateurs`) donne accès : un compte
 *   créé par erreur n'a aucun droit.
 *
 * Renvoie le client lié à la session et l'utilisateur, ou redirige vers la
 * connexion (avec la raison). Mise en cache pour la durée d'une requête : la
 * mise en page et la page ne paient qu'une vérification.
 */
export const exigerAdmin = cache(async (): Promise<ContexteAdmin> => {
  const supabase = await clientServeur();
  const { data, error } = await supabase.auth.getUser();
  if (!data.user) redirect(error && error.name !== "AuthSessionMissingError" ? `${CHEMIN_CONNEXION}?raison=session_expiree` : CHEMIN_CONNEXION);

  const { data: admin, error: erreurAdmin } = await supabase.rpc("est_admin");
  if (erreurAdmin) redirect(`${CHEMIN_CONNEXION}?raison=indisponible`);
  if (admin !== true) redirect(`${CHEMIN_CONNEXION}?raison=acces_refuse`);

  return { supabase, utilisateur: data.user };
});
