"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LIMITES_ARTICLES, srcImage } from "@/lib/journal/constantes";
import { envoyerPhotoArticle, type DemandeEnvoi, type OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { LISTE_TYPES_IMAGE, TAILLE_MAX_OCTETS, altDepuisNomFichier, estTypeImage, formaterTaille } from "@/lib/photos/envoi";
import { classesBouton } from "@/components/ui/Bouton";
import { Champ } from "./Champ";
import { Modale } from "./Modale";

export type PhotoAInserer = { chemin: string; largeur: number; hauteur: number; alt: string; legende: string };

const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";
export const AIDE_ALT_ARTICLE =
  "Obligatoire : décrivez ce que montre la photo, pour les personnes qui ne la voient pas (lecteurs d'écran) et pour Google. Ex. « Piste de danse éclairée en doré pendant l'ouverture de bal ».";

/**
 * Photo du texte d'un article :
 * - `ajout` : choix du fichier (ou fichier collé / glissé), texte alternatif
 *   DEMANDÉ AVANT l'insertion, légende facultative ; envoi direct au stockage
 *   (`journal/<aaaa>/<mm>/…`), dimensions lues dans le navigateur ;
 * - `modification` : texte alternatif et légende de la photo sélectionnée.
 */
export function FenetrePhoto({
  mode,
  fichierInitial,
  photoActuelle,
  creerUrlEnvoi,
  outils,
  onInserer,
  onModifier,
  onFermer,
}: {
  mode: "ajout" | "modification";
  fichierInitial?: File;
  photoActuelle?: { alt: string; legende: string; src: string };
  creerUrlEnvoi: DemandeEnvoi;
  outils: OutilsEnvoiArticle;
  onInserer: (photo: PhotoAInserer) => void;
  onModifier: (alt: string, legende: string) => void;
  onFermer: () => void;
}) {
  const id = useId();
  const champFichier = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(fichierInitial ?? null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [alt, setAlt] = useState(() => photoActuelle?.alt ?? (fichierInitial ? altDepuisNomFichier(fichierInitial.name) : ""));
  const [legende, setLegende] = useState(photoActuelle?.legende ?? "");
  const [erreurs, setErreurs] = useState<{ fichier?: string; alt?: string; legende?: string }>({});
  const [envoi, setEnvoi] = useState(false);

  // Aperçu local du fichier choisi (adresse blob:, libérée ensuite).
  useEffect(() => {
    if (!fichier) {
      setApercu(null);
      return;
    }
    const url = URL.createObjectURL(fichier);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [fichier]);

  function choisir(liste: FileList | null) {
    const f = liste?.[0];
    if (!f) return;
    if (!estTypeImage(f.type)) {
      setErreurs({ fichier: "Format refusé : envoyez une photo JPEG, PNG, WebP ou AVIF." });
      return;
    }
    setFichier(f);
    setErreurs({});
    if (!alt.trim()) setAlt(altDepuisNomFichier(f.name));
  }

  async function valider(e?: FormEvent) {
    e?.preventDefault();
    if (envoi) return;
    const nouvelles: typeof erreurs = {};
    if (mode === "ajout" && !fichier) nouvelles.fichier = "Choisissez la photo à insérer.";
    if (!alt.trim()) nouvelles.alt = "Décrivez la photo (texte alternatif) : c'est obligatoire.";
    else if (Array.from(alt.trim()).length > LIMITES_ARTICLES.altImage) nouvelles.alt = `${LIMITES_ARTICLES.altImage} caractères au maximum.`;
    if (Array.from(legende.trim()).length > LIMITES_ARTICLES.legendeImage) nouvelles.legende = `${LIMITES_ARTICLES.legendeImage} caractères au maximum.`;
    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) return;

    if (mode === "modification") {
      onModifier(alt.trim(), legende.trim());
      return;
    }
    setEnvoi(true);
    try {
      const envoyee = await envoyerPhotoArticle(fichier!, creerUrlEnvoi, outils);
      onInserer({ chemin: envoyee.chemin, largeur: envoyee.largeur, hauteur: envoyee.hauteur, alt: alt.trim(), legende: legende.trim() });
    } catch (erreur) {
      setErreurs({ fichier: erreur instanceof Error && erreur.message ? `Envoi impossible : ${erreur.message}` : ERREUR_RESEAU });
      setEnvoi(false);
    }
  }

  const apercuAffiche = mode === "modification" && photoActuelle ? srcImage(photoActuelle.src) : apercu;

  return (
    <Modale
      ouverte
      onFermer={() => {
        if (!envoi) onFermer();
      }}
      titre={mode === "ajout" ? "Insérer une photo" : "Texte de la photo"}
      largeur="normale"
      pied={
        <button type="submit" form={`${id}-formulaire`} disabled={envoi} className={`${classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}>
          {envoi ? "Envoi de la photo…" : mode === "ajout" ? "Insérer la photo" : "Enregistrer"}
        </button>
      }
    >
      <form id={`${id}-formulaire`} onSubmit={(e) => void valider(e)} className="flex flex-col gap-6" noValidate>
        {mode === "ajout" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => champFichier.current?.click()} disabled={envoi} className={classesBouton("contour")}>
                {fichier ? "Choisir une autre photo" : "Choisir une photo"}
              </button>
              {fichier && <span className="text-sm text-sable">{fichier.name}</span>}
            </div>
            <input
              ref={champFichier}
              type="file"
              accept={LISTE_TYPES_IMAGE.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-label="Choisir la photo à insérer"
              onChange={(e) => {
                choisir(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-sable/80">
              JPEG, PNG, WebP ou AVIF, {formaterTaille(TAILLE_MAX_OCTETS)} au maximum ; au-delà de 3 000 pixels de côté, la photo est réduite avant
              l&apos;envoi. Elle s&apos;affichera sur toute la largeur du texte, comme sur le site.
            </p>
            {erreurs.fichier && (
              <p role="alert" className="text-sm text-erreur">
                {erreurs.fichier}
              </p>
            )}
          </div>
        )}

        {apercuAffiche && (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) ou du stockage, avant l'insertion.
          <img src={apercuAffiche} alt="" className="max-h-64 w-auto self-start border border-ligne object-contain" />
        )}

        <Champ id={`${id}-alt`} libelle="Texte alternatif" erreur={erreurs.alt} max={LIMITES_ARTICLES.altImage} valeur={alt} aide={AIDE_ALT_ARTICLE}>
          {(attributs) => <textarea {...attributs} rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} />}
        </Champ>
        <Champ
          id={`${id}-legende`}
          libelle="Légende"
          erreur={erreurs.legende}
          max={LIMITES_ARTICLES.legendeImage}
          valeur={legende}
          aide="Facultative : affichée sous la photo."
        >
          {(attributs) => <input {...attributs} type="text" value={legende} onChange={(e) => setLegende(e.target.value)} />}
        </Champ>
      </form>
    </Modale>
  );
}
