import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { sourceAvis } from "@/lib/avis/source";
import { COLONNES_AVIS, type Avis } from "@/lib/avis/types";
import { Icone } from "@/components/admin/Icones";
import { GestionAvis } from "@/components/admin/GestionAvis";
import { changerPublication, creerAvis, echangerOrdre, enregistrerAvis, supprimerAvis } from "./actions";

export const metadata: Metadata = { title: "Avis" };

/**
 * Avis des clients : liste filtrable, ordre, modale d'édition auto-enregistrée,
 * création (non publiée), publication et suppression confirmées. Lecture et
 * écriture avec la session de Cédric (RLS : est_admin()).
 */
export default async function PageAvis() {
  const { supabase } = await exigerAdmin();
  const section = sectionDe("/admin/avis");
  const { data, error } = await supabase.from("avis").select(COLONNES_AVIS).order("ordre", { ascending: true }).order("id", { ascending: true });
  if (error) console.warn(`[admin] Avis — lecture de la liste : ${error.code ?? ""} ${error.message}`);
  const siteSurFichiers = sourceAvis(process.env) === "fichiers";

  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <p className="mt-4 max-w-2xl text-sable">
        Les avis des mariés et des clients : texte, traduction, pages où ils sont mis en avant, ordre d&apos;affichage. Après chaque modification, le
        site public se met à jour à la visite suivante d&apos;une page.
      </p>

      {siteSurFichiers && (
        <p className="mt-6 max-w-2xl border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Supabase n&apos;est pas configuré dans cet environnement (<code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> absente) : les pages
          publiques d&apos;ici affichent les avis des fichiers de secours, et vos modifications n&apos;y apparaîtront pas.
        </p>
      )}

      <div className="mt-10">
        {error ? (
          <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            La liste des avis n&apos;a pas pu être chargée (la base ne répond pas). Rechargez la page dans un instant.
          </p>
        ) : (
          <GestionAvis
            avisInitiaux={(data ?? []) as Avis[]}
            actions={{ enregistrer: enregistrerAvis, creer: creerAvis, changerPublication, supprimer: supprimerAvis, echanger: echangerOrdre }}
          />
        )}
      </div>
    </>
  );
}
