import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { LIMITE_CHARGEMENT } from "@/lib/demandes/constantes";
import { COLONNES_DEMANDE, type Demande } from "@/lib/demandes/types";
import { Icone } from "@/components/admin/Icones";
import { GestionDemandes } from "@/components/admin/GestionDemandes";
import { enregistrerSuiviDemande } from "./actions";

export const metadata: Metadata = { title: "Demandes" };

/**
 * Demandes reçues par le formulaire de contact : liste filtrable (statut,
 * recherche), fiche en modale avec liens de contact, statut et note interne
 * auto-enregistrés. Lecture avec la session de Cédric (RLS : est_admin()).
 */
export default async function PageDemandes() {
  const { supabase } = await exigerAdmin();
  const section = sectionDe("/admin/demandes");
  const { data, error } = await supabase
    .from("demandes_contact")
    .select(COLONNES_DEMANDE)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(LIMITE_CHARGEMENT);
  if (error) console.warn(`[admin] Demandes — lecture de la liste : ${error.code ?? ""} ${error.message}`);
  const demandes = (data ?? []) as Demande[];

  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <p className="mt-4 max-w-2xl text-sable">
        Les demandes reçues par le formulaire de contact, les plus récentes en tête. Ouvrez une demande pour rappeler, écrire ou suivre où vous en
        êtes : le statut et la note interne ne sont visibles qu&apos;ici.
      </p>

      <div className="mt-10">
        {error ? (
          <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            La liste des demandes n&apos;a pas pu être chargée (la base ne répond pas). Rechargez la page dans un instant.
          </p>
        ) : (
          <>
            {demandes.length >= LIMITE_CHARGEMENT && (
              <p className="mb-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
                Seules les {LIMITE_CHARGEMENT.toLocaleString("fr-FR")} demandes les plus récentes sont affichées.
              </p>
            )}
            <GestionDemandes demandesInitiales={demandes} actions={{ enregistrer: enregistrerSuiviDemande }} />
          </>
        )}
      </div>
    </>
  );
}
