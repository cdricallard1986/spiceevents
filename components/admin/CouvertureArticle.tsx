"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ResultatCopiePhoto } from "@/lib/journal/admin";
import { LIMITES_ARTICLES, srcImage } from "@/lib/journal/constantes";
import { envoyerPhotoArticle, type DemandeEnvoi, type OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { nomPhoto } from "@/lib/photos/admin";
import { LISTE_TYPES_IMAGE, TAILLE_MAX_OCTETS, formaterTaille } from "@/lib/photos/envoi";
import type { Photo } from "@/lib/photos/types";
import { classesBouton } from "@/components/ui/Bouton";
import { ApercuPhoto, PillOrigine } from "./ApercuPhoto";
import { Champ } from "./Champ";
import { CLASSES_LIBELLE } from "./champs";
import { Modale } from "./Modale";
import { useToasts } from "./Toasts";

const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";

type Props = {
  idChamp: string;
  couverture: string;
  alt: string;
  erreurs: { couverture?: string; couverture_alt?: string };
  onChange: (maj: { couverture?: string; couverture_alt?: string }) => void;
  photos: readonly Photo[];
  creerUrlEnvoi: DemandeEnvoi;
  copierPhoto: (photoId: string) => Promise<ResultatCopiePhoto>;
  outils: OutilsEnvoiArticle;
};

/**
 * Photo de couverture d'un article (en-tête de l'article, carte du journal,
 * partage) : envoi d'une nouvelle photo (direct au stockage, sous
 * `journal/…`) ou choix dans la photothèque (copiée dans le dossier du
 * journal), et son texte alternatif, obligatoire pour publier.
 */
export function CouvertureArticle({ idChamp, couverture, alt, erreurs, onChange, photos, creerUrlEnvoi, copierPhoto, outils }: Props) {
  const { afficher } = useToasts();
  const champFichier = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [phototheque, setPhototheque] = useState(false);

  /** Nouvelle couverture : le texte alternatif proposé ne remplace jamais celui déjà écrit. */
  function appliquer(chemin: string, altPropose = "") {
    onChange({ couverture: chemin, ...(alt.trim() || !altPropose ? {} : { couverture_alt: altPropose }) });
  }

  async function envoyer(fichier: File, altPropose = "") {
    setEnvoi(true);
    try {
      const r = await envoyerPhotoArticle(fichier, creerUrlEnvoi, outils);
      appliquer(r.chemin, altPropose);
      afficher(r.reduite ? `Couverture envoyée (réduite à ${r.largeur} × ${r.hauteur} px).` : "Couverture envoyée.");
    } catch (e) {
      afficher(e instanceof Error && e.message ? `Envoi impossible : ${e.message}` : ERREUR_RESEAU, "erreur");
    } finally {
      setEnvoi(false);
    }
  }

  async function choisir(photo: Photo) {
    setPhototheque(false);
    if (photo.origine === "site") {
      // Fichier du site : le navigateur le relit puis l'envoie dans le dossier du journal.
      setEnvoi(true);
      try {
        const fichier = await outils.lireFichierDuSite(photo.chemin);
        setEnvoi(false);
        await envoyer(fichier, photo.alt_fr);
      } catch (e) {
        setEnvoi(false);
        afficher(e instanceof Error && e.message ? `Copie impossible : ${e.message}` : ERREUR_RESEAU, "erreur");
      }
      return;
    }
    setEnvoi(true);
    try {
      const r = await copierPhoto(photo.id);
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      appliquer(r.chemin, r.alt);
      afficher("Couverture choisie dans la photothèque.");
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <fieldset className="flex flex-col gap-5" aria-describedby={erreurs.couverture ? `${idChamp}-erreur` : undefined}>
      <legend className={`${CLASSES_LIBELLE} mb-2`}>Photo de couverture</legend>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className={`relative aspect-[3/2] overflow-hidden border bg-nuit ${erreurs.couverture ? "border-erreur" : "border-ligne"}`}>
          {couverture ? (
            <Image src={srcImage(couverture)} alt="" fill sizes="(min-width: 640px) 18rem, 100vw" quality={70} className="object-cover" />
          ) : (
            <p className="flex h-full items-center justify-center px-4 text-center text-sm text-sable">Pas encore de couverture</p>
          )}
          {envoi && (
            <p role="status" className="absolute inset-0 flex items-center justify-center bg-nuit/80 text-sm text-ivoire">
              Envoi de la photo…
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => champFichier.current?.click()} disabled={envoi} className={`${classesBouton("contour")} disabled:opacity-60`}>
              Envoyer une photo
            </button>
            <button type="button" onClick={() => setPhototheque(true)} disabled={envoi || photos.length === 0} className={`${classesBouton("contour")} disabled:opacity-60`}>
              Choisir dans la photothèque
            </button>
          </div>
          {couverture && (
            <button type="button" onClick={() => onChange({ couverture: "" })} disabled={envoi} className="self-start text-sm text-sable underline underline-offset-4 hover:text-or">
              Retirer la couverture
            </button>
          )}
          <input
            ref={champFichier}
            type="file"
            accept={LISTE_TYPES_IMAGE.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choisir la photo de couverture"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void envoyer(f);
            }}
          />
          <p className="text-xs text-sable/80">
            En haut de l&apos;article et sur sa carte dans le journal. Une photo en largeur, JPEG, PNG, WebP ou AVIF, {formaterTaille(TAILLE_MAX_OCTETS)} au
            maximum.
          </p>
          {erreurs.couverture && (
            <p id={`${idChamp}-erreur`} className="text-sm text-erreur">
              {erreurs.couverture}
            </p>
          )}
        </div>
      </div>

      <Champ
        id={`${idChamp}-alt`}
        libelle="Texte alternatif de la couverture"
        erreur={erreurs.couverture_alt}
        max={LIMITES_ARTICLES.couvertureAlt}
        valeur={alt}
        aide="Obligatoire pour publier : décrivez ce que montre la photo (lecteurs d'écran, Google)."
      >
        {(attributs) => <textarea {...attributs} rows={2} value={alt} onChange={(e) => onChange({ couverture_alt: e.target.value })} />}
      </Champ>

      {phototheque && (
        <Modale ouverte onFermer={() => setPhototheque(false)} titre="Choisir la couverture" largeur="large">
          <p className="mb-5 text-sm text-sable">
            La photo choisie est copiée dans le dossier du journal ; elle reste aussi dans ses galeries. Son texte alternatif est repris s&apos;il n&apos;y en
            a pas encore.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => void choisir(p)} className="group flex w-full flex-col gap-2 text-left">
                  <span className="relative block aspect-[3/2] overflow-hidden border border-ligne transition-colors group-hover:border-or group-focus-visible:border-or">
                    <ApercuPhoto photo={p} sizes="(min-width: 1024px) 12rem, 45vw" />
                  </span>
                  <span className="line-clamp-2 text-xs text-sable group-hover:text-ivoire">{nomPhoto(p, 80)}</span>
                  <PillOrigine photo={p} />
                </button>
              </li>
            ))}
          </ul>
        </Modale>
      )}
    </fieldset>
  );
}
