"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent, type MouseEvent } from "react";
import { cadrageDepuisClic, lireCadrage } from "@/lib/equipe/constantes";
import { srcPhotoMembre } from "@/lib/equipe/affichage";
import { envoyerPhotoArticle, type DemandeEnvoi, type OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { LISTE_TYPES_IMAGE, TAILLE_MAX_OCTETS, formaterTaille } from "@/lib/photos/envoi";
import { CLASSES_AIDE, CLASSES_LIBELLE } from "./champs";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToasts } from "./Toasts";

const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";

export type ValeurPhoto = { photo_chemin: string; photo_largeur: number | null; photo_hauteur: number | null; photo_cadrage: string };

type Props = {
  valeur: ValeurPhoto;
  onChange: (maj: Partial<ValeurPhoto>) => void;
  /** Initiales affichées sans photo, comme sur la page. */
  monogramme: string;
  erreur?: string;
  idErreur: string;
  creerUrlEnvoi: DemandeEnvoi;
  outils: OutilsEnvoiArticle;
};

/**
 * Portrait d'un membre : au format de la carte de la page Nos DJ (3/2).
 * - Vide : grande zone de dépôt (glisser une photo ou cliquer pour choisir).
 * - Avec photo : au survol, icônes en transparence PAR-DESSUS l'image
 *   (remplacer, retirer) ; déposer un fichier la remplace ; un clic sur la
 *   photo choisit le point gardé au recadrage (le visage).
 * Envoi direct navigateur → Storage (URL signée), jamais par une Server Action.
 */
export function PhotoMembre({ valeur, onChange, monogramme, erreur, idErreur, creerUrlEnvoi, outils }: Props) {
  const { afficher } = useToasts();
  const champFichier = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [confirmerRetrait, setConfirmerRetrait] = useState(false);
  const aPhoto = valeur.photo_chemin !== "";
  const point = lireCadrage(valeur.photo_cadrage);

  async function envoyer(fichier: File) {
    setEnvoi(true);
    try {
      const r = await envoyerPhotoArticle(fichier, creerUrlEnvoi, outils);
      // Nouvelle photo : cadrage remis au centre, à rechoisir d'un clic.
      onChange({ photo_chemin: r.chemin, photo_largeur: r.largeur, photo_hauteur: r.hauteur, photo_cadrage: "50% 50%" });
      afficher(r.reduite ? `Photo envoyée (réduite à ${r.largeur} × ${r.hauteur} px). Cliquez sur le visage pour le cadrage.` : "Photo envoyée. Cliquez sur le visage pour le cadrage.");
    } catch (e) {
      afficher(e instanceof Error && e.message ? `Envoi impossible : ${e.message}` : ERREUR_RESEAU, "erreur");
    } finally {
      setEnvoi(false);
    }
  }

  function deposer(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setSurvol(false);
    if (envoi) return;
    const fichiers = [...e.dataTransfer.files];
    if (fichiers.length === 0) return;
    if (fichiers.length > 1) afficher("Une seule photo par membre : la première est envoyée.", "info");
    void envoyer(fichiers[0]);
  }

  function cadrer(e: MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    onChange({ photo_cadrage: cadrageDepuisClic((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height) });
  }

  const choisir = () => champFichier.current?.click();

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={erreur ? idErreur : undefined}>
      <legend className={`${CLASSES_LIBELLE} mb-2`}>Photo</legend>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!envoi) setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={deposer}
        className={`group relative aspect-[3/2] w-full max-w-xl overflow-hidden border bg-nuit-3 transition-colors ${
          survol ? "border-or" : erreur ? "border-erreur" : aPhoto ? "border-ligne" : "border-dashed border-ligne hover:border-or"
        }`}
      >
        {aPhoto ? (
          <>
            {/* Un clic sur la photo place le point de cadrage. */}
            <button type="button" onClick={cadrer} disabled={envoi} aria-label="Choisir le point de cadrage : cliquez sur le visage" className="absolute inset-0 cursor-crosshair">
              <Image
                src={srcPhotoMembre(valeur.photo_chemin)}
                alt=""
                fill
                sizes="(min-width: 640px) 36rem, 100vw"
                quality={70}
                className="object-cover"
                style={{ objectPosition: valeur.photo_cadrage }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-or shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              />
            </button>
            {/* Icônes en transparence par-dessus l'image, au survol (au doigt : au premier toucher, via focus-within). */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end gap-2 bg-gradient-to-b from-nuit/80 to-transparent p-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={choisir}
                disabled={envoi}
                aria-label="Remplacer la photo"
                title="Remplacer la photo"
                className="pointer-events-auto flex size-10 items-center justify-center bg-nuit/70 text-ivoire transition-colors hover:text-or"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setConfirmerRetrait(true)}
                disabled={envoi}
                aria-label="Retirer la photo"
                title="Retirer la photo"
                className="pointer-events-auto flex size-10 items-center justify-center bg-nuit/70 text-ivoire transition-colors hover:text-erreur"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={choisir} disabled={envoi} className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span aria-hidden="true" className="font-display text-6xl leading-none text-or/25">
              {monogramme}
            </span>
            <span className="text-ivoire">Déposez une photo ici ou cliquez pour choisir</span>
            <span className={CLASSES_AIDE}>
              JPEG, PNG, WebP ou AVIF, {formaterTaille(TAILLE_MAX_OCTETS)} au maximum. Sans photo, la page affiche ces initiales.
            </span>
          </button>
        )}
        {envoi && (
          <p role="status" className="absolute inset-0 flex items-center justify-center bg-nuit/80 text-sm text-ivoire">
            Envoi de la photo…
          </p>
        )}
      </div>
      <input
        ref={champFichier}
        type="file"
        accept={LISTE_TYPES_IMAGE.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choisir la photo du membre"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void envoyer(f);
        }}
      />
      {aPhoto && (
        <p className={CLASSES_AIDE}>
          Cadrée comme sur la page Nos DJ. Cliquez sur le visage pour qu&apos;il reste dans le cadre (point orange) ; survolez la photo pour la remplacer
          ou la retirer, ou déposez-en une autre dessus.
        </p>
      )}
      {erreur && (
        <p id={idErreur} className="text-sm text-erreur">
          {erreur}
        </p>
      )}
      <ConfirmDialog
        ouverte={confirmerRetrait}
        titre="Retirer la photo ?"
        message={<p>La carte affichera les initiales à la place de la photo. Vous pourrez en envoyer une autre.</p>}
        libelleConfirmer="Retirer la photo"
        danger
        onConfirmer={() => {
          setConfirmerRetrait(false);
          onChange({ photo_chemin: "", photo_largeur: null, photo_hauteur: null, photo_cadrage: "50% 50%" });
        }}
        onAnnuler={() => setConfirmerRetrait(false)}
      />
    </fieldset>
  );
}
