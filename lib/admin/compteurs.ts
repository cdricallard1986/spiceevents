import "server-only";
import type { ContexteAdmin } from "./garde";

/**
 * Nombre de demandes au statut « nouvelle » (comptage seul, aucune ligne lue),
 * pour la pastille du menu et la carte de l'accueil. null si la base ne répond
 * pas : la pastille disparaît plutôt que d'afficher un faux zéro.
 */
export async function compterNouvellesDemandes(supabase: ContexteAdmin["supabase"], sansEmail = false): Promise<number | null> {
  let requete = supabase.from("demandes_contact").select("id", { count: "exact", head: true }).eq("statut", "nouvelle");
  if (sansEmail) requete = requete.eq("email_envoye", false);
  const { count, error } = await requete;
  if (error) {
    console.warn(`[admin] Comptage des nouvelles demandes : ${error.code ?? ""} ${error.message}`);
    return null;
  }
  return count ?? 0;
}
