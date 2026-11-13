import type { Metadata } from "next";
import { compterNouvellesDemandes } from "@/lib/admin/compteurs";
import { exigerAdmin, type ContexteAdmin } from "@/lib/admin/garde";
import { TableauDeBord, salutation, type ResumeDemandes } from "@/components/admin/TableauDeBord";

export const metadata: Metadata = { title: "Accueil" };

/**
 * Demandes à traiter : les nouvelles, et parmi elles celles dont l'email de
 * notification n'est pas parti. null si la base ne répond pas.
 */
async function resumeDemandes(supabase: ContexteAdmin["supabase"]): Promise<ResumeDemandes | null> {
  const [nouvelles, sansEmail] = await Promise.all([compterNouvellesDemandes(supabase), compterNouvellesDemandes(supabase, true)]);
  return nouvelles === null || sansEmail === null ? null : { nouvelles, sansEmail };
}

/** Comptage seul (aucune ligne lue) ; null si la base ne répond pas. */
async function compter(requete: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number | null> {
  const { count, error } = await requete;
  if (error) console.warn(`[admin] Accueil — comptage : ${error.message}`);
  return error ? null : (count ?? 0);
}

export default async function AccueilAdmin() {
  const { supabase } = await exigerAdmin();
  const tete = { count: "exact", head: true } as const;
  const [demandes, avis, photos, articles] = await Promise.all([
    resumeDemandes(supabase),
    compter(supabase.from("avis").select("id", tete).eq("publie", true)),
    compter(supabase.from("photos").select("id", tete)),
    compter(supabase.from("articles").select("id", tete).eq("statut", "publie")),
  ]);
  return (
    <TableauDeBord
      salut={salutation()}
      demandes={demandes}
      chiffres={[
        { valeur: demandes?.nouvelles ?? null, libelle: "Nouvelles demandes", href: "/admin/demandes", alerte: Boolean(demandes?.nouvelles) },
        { valeur: avis, libelle: "Avis publiés", href: "/admin/avis" },
        { valeur: photos, libelle: "Photos", href: "/admin/photos" },
        { valeur: articles, libelle: "Articles en ligne", href: "/admin/journal" },
      ]}
    />
  );
}
