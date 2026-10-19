import "server-only";
import type { ContexteAdmin } from "@/lib/admin/garde";
import { DELAI_BROUILLON_VIDE_MS, estBrouillonVide } from "./admin";

type Supabase = Pick<ContexteAdmin["supabase"], "from">;

/**
 * À l'ouverture de la liste du journal : supprime les brouillons jamais
 * remplis (« Nouvel article » ouvert puis abandonné) depuis plus de 24 heures
 * — voir `estBrouillonVide`. Avec la session de Cédric (RLS). Une erreur est
 * journalisée sans bloquer la page. Renvoie le nombre de brouillons supprimés.
 */
export async function nettoyerBrouillonsVides(supabase: Supabase, maintenant: Date = new Date()): Promise<number> {
  const limite = new Date(maintenant.getTime() - DELAI_BROUILLON_VIDE_MS).toISOString();
  const { data, error } = await supabase
    .from("articles")
    .select("id, statut, publie_le, titre, sous_titre, description, couverture, contenu, updated_at")
    .eq("statut", "brouillon")
    .is("publie_le", null)
    .eq("titre", "")
    .lt("updated_at", limite);
  if (error) {
    console.warn(`[admin] Journal — recherche des brouillons vides : ${error.code ?? ""} ${error.message}`);
    return 0;
  }
  const ids = (data ?? []).filter((l) => estBrouillonVide(l as Parameters<typeof estBrouillonVide>[0], maintenant)).map((l) => String(l.id));
  if (ids.length === 0) return 0;
  // Mêmes conditions à la suppression : un brouillon rempli entre-temps n'est pas touché.
  const { data: supprimes, error: erreur } = await supabase
    .from("articles")
    .delete()
    .in("id", ids)
    .eq("statut", "brouillon")
    .is("publie_le", null)
    .eq("titre", "")
    .lt("updated_at", limite)
    .select("id");
  if (erreur) {
    console.warn(`[admin] Journal — suppression des brouillons vides : ${erreur.code ?? ""} ${erreur.message}`);
    return 0;
  }
  return (supprimes ?? []).length;
}
