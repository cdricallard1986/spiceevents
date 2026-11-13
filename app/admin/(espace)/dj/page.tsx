import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { sourceAvis } from "@/lib/avis/source";
import { COLONNES_EQUIPE, type MembreEquipe } from "@/lib/equipe/types";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { GestionEquipe } from "@/components/admin/GestionEquipe";
import { changerPublicationMembre, creerMembre, creerUrlEnvoiMembre, echangerOrdreMembres, enregistrerMembre, supprimerMembre } from "./actions";

export const metadata: Metadata = { title: "DJ" };

/**
 * DJ et musiciens de la page Nos DJ : liste dans l'ordre de la page, modale
 * d'édition auto-enregistrée (textes FR/EN, photo, cadrage), création (non
 * publiée), publication et suppression confirmées. Lecture et écriture avec la
 * session de Cédric (RLS : est_admin()).
 */
export default async function PageDj() {
  const { supabase } = await exigerAdmin();
  const section = sectionDe("/admin/dj");
  const { data, error } = await supabase.from("equipe").select(COLONNES_EQUIPE).order("ordre", { ascending: true });
  if (error) console.warn(`[admin] DJ — lecture de la liste : ${error.code ?? ""} ${error.message}`);
  const siteSurFichiers = sourceAvis(process.env) === "fichiers";

  return (
    <>
      <EnTeteAdmin
        section={section}
        intro={
          <>
            Les DJ et musiciens de la page Nos DJ : photo, présentation, styles, avis, lien, ordre d&apos;affichage. Après chaque modification, la page se
            met à jour à la visite suivante.
          </>
        }
      />

      {siteSurFichiers && (
        <p className="mt-6 max-w-2xl border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Supabase n&apos;est pas configuré dans cet environnement (<code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> absente) : la page Nos DJ
          d&apos;ici affiche l&apos;équipe du code, et vos modifications n&apos;y apparaîtront pas.
        </p>
      )}

      <div className="mt-10">
        {error ? (
          <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            La liste des DJ n&apos;a pas pu être chargée (la base ne répond pas). Rechargez la page dans un instant.
          </p>
        ) : (
          <GestionEquipe
            membresInitiaux={(data ?? []) as MembreEquipe[]}
            actions={{
              enregistrer: enregistrerMembre,
              creer: creerMembre,
              changerPublication: changerPublicationMembre,
              supprimer: supprimerMembre,
              echanger: echangerOrdreMembres,
              creerUrlEnvoi: creerUrlEnvoiMembre,
            }}
          />
        )}
      </div>
    </>
  );
}
