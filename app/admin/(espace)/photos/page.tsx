import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { sourcePhotos } from "@/lib/photos/source";
import { COLONNES_LIAISON, COLONNES_PHOTO, type Liaison, type Photo } from "@/lib/photos/types";
import { Icone } from "@/components/admin/Icones";
import { GestionPhotos } from "@/components/admin/GestionPhotos";
import { ajouterAGalerie, creerUrlEnvoi, echangerOrdrePhotos, enregistrerPhoto, modifierPhoto, retirerDeGalerie, supprimerPhoto } from "./actions";

export const metadata: Metadata = { title: "Photos" };

/**
 * Photos des galeries (page Galerie et pages d'animations) : ordre, retrait,
 * fiche auto-enregistrée (textes alternatifs), ajout par envoi direct au
 * stockage ou depuis la photothèque, suppression des photos envoyées. Lecture
 * et écriture avec la session de Cédric (RLS : est_admin()).
 */
export default async function PagePhotos() {
  const { supabase } = await exigerAdmin();
  const section = sectionDe("/admin/photos");
  const [photos, liaisons] = await Promise.all([
    // Les plus récentes d'abord : une photo envoyée apparaît en tête de la photothèque.
    supabase.from("photos").select(COLONNES_PHOTO).order("created_at", { ascending: false }).order("chemin", { ascending: true }),
    supabase.from("galeries_photos").select(COLONNES_LIAISON).order("galerie", { ascending: true }).order("ordre", { ascending: true }),
  ]);
  const erreur = photos.error ?? liaisons.error;
  if (erreur) console.warn(`[admin] Photos — lecture : ${erreur.code ?? ""} ${erreur.message}`);
  const siteSurFichiers = sourcePhotos(process.env) === "fichiers";
  const baseVide = !erreur && (photos.data ?? []).length === 0;

  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <p className="mt-4 max-w-2xl text-sable">
        Les photos de la page Galerie et des pages d&apos;animations : ajout, ordre, retrait, texte alternatif. Après chaque modification, le site public se
        met à jour à la visite suivante d&apos;une page.
      </p>

      {siteSurFichiers && (
        <p className="mt-6 max-w-2xl border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Supabase n&apos;est pas configuré dans cet environnement (<code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> absente) : les pages
          publiques d&apos;ici affichent les galeries de secours du code, et vos modifications n&apos;y apparaîtront pas.
        </p>
      )}
      {baseVide && (
        <p className="mt-6 max-w-2xl border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Aucune photo en base : l&apos;import des galeries actuelles (migration <code className="font-mono">0007_import_galeries.sql</code>) n&apos;a pas
          encore été appliqué. Tant qu&apos;il ne l&apos;est pas, les galeries du site en ligne seraient vides.
        </p>
      )}

      <div className="mt-10">
        {erreur ? (
          <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            Les photos n&apos;ont pas pu être chargées (la base ne répond pas). Rechargez la page dans un instant.
          </p>
        ) : (
          <GestionPhotos
            photosInitiales={(photos.data ?? []) as Photo[]}
            liaisonsInitiales={(liaisons.data ?? []) as Liaison[]}
            actions={{
              creerUrlEnvoi,
              enregistrerPhoto,
              modifier: modifierPhoto,
              ajouterAGalerie,
              retirer: retirerDeGalerie,
              echanger: echangerOrdrePhotos,
              supprimer: supprimerPhoto,
            }}
          />
        )}
      </div>
    </>
  );
}
