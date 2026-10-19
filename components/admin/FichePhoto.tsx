"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { useModalAutosave } from "@/hooks/useModalAutosave";
import { estSupprimable, galeriesDeLaPhoto, nomPhoto, type ResultatPhoto, type ResultatSuppressionPhoto } from "@/lib/photos/admin";
import { LIMITES_PHOTOS, libelleGalerie } from "@/lib/photos/constantes";
import { formulaireDepuisPhoto, type ErreursPhoto, type FormulairePhoto } from "@/lib/photos/schema";
import { adressePhoto } from "@/lib/photos/selection";
import type { Liaison, Photo } from "@/lib/photos/types";
import { classesBouton } from "@/components/ui/Bouton";
import { PillOrigine } from "./ApercuPhoto";
import { Champ } from "./Champ";
import { CLASSES_DANGER, ConfirmDialog } from "./ConfirmDialog";
import { Modale } from "./Modale";
import { PillStatut } from "./PillStatut";
import { useToasts } from "./Toasts";

export const AIDE_ALT =
  "Décrivez la photo pour Google et les personnes malvoyantes (lecteurs d'écran) : ce qu'on y voit, en une phrase (« Mariés sur la piste sous des faisceaux dorés »).";
export const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";

/** Champs d'une photo : texte alternatif FR (obligatoire) et EN, crédit. Toujours éditables. */
export function ChampsPhoto({
  valeur,
  modifier,
  erreurs,
  prefixe,
}: {
  valeur: FormulairePhoto;
  modifier: (maj: Partial<FormulairePhoto>) => void;
  erreurs: ErreursPhoto;
  /** Préfixe des identifiants (plusieurs fiches sur une même page). */
  prefixe?: string;
}) {
  const genere = useId();
  const id = prefixe ?? genere;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Champ
        id={`${id}-alt_fr`}
        libelle="Texte alternatif — français (obligatoire)"
        erreur={erreurs.alt_fr}
        max={LIMITES_PHOTOS.alt}
        valeur={valeur.alt_fr}
        aide={AIDE_ALT}
        className="lg:col-span-2"
      >
        {(attributs) => <textarea {...attributs} rows={2} required value={valeur.alt_fr} onChange={(e) => modifier({ alt_fr: e.target.value })} />}
      </Champ>
      <Champ id={`${id}-alt_en`} libelle="Texte alternatif — anglais" erreur={erreurs.alt_en} max={LIMITES_PHOTOS.alt} valeur={valeur.alt_en} aide="Vide = le site anglais reprend le texte français.">
        {(attributs) => <textarea {...attributs} rows={2} lang="en" value={valeur.alt_en} onChange={(e) => modifier({ alt_en: e.target.value })} />}
      </Champ>
      <Champ id={`${id}-credit`} libelle="Crédit" erreur={erreurs.credit} max={LIMITES_PHOTOS.credit} valeur={valeur.credit} aide="Facultatif : le photographe, par exemple. Pas encore affiché sur le site.">
        {(attributs) => <input {...attributs} type="text" value={valeur.credit} onChange={(e) => modifier({ credit: e.target.value })} />}
      </Champ>
    </div>
  );
}

/** Toast d'erreur sans répétition : la même erreur, à chaque nouvel essai d'enregistrement, ne s'affiche qu'une fois. */
function useErreurs() {
  const { afficher } = useToasts();
  const [erreurs, setErreurs] = useState<ErreursPhoto>({});
  const dernier = useRef("");
  return {
    erreurs,
    signaler(message: string, champs: ErreursPhoto = {}) {
      setErreurs(champs);
      if (message !== dernier.current) afficher(message, "erreur");
      dernier.current = message;
    },
    effacer() {
      setErreurs({});
      dernier.current = "";
    },
  };
}

export type ActionsFiche = {
  modifier: (id: string, champs: FormulairePhoto) => Promise<ResultatPhoto>;
  supprimer: (id: string) => Promise<ResultatSuppressionPhoto>;
};

type Confirmation = "supprimer" | "fermer" | null;

/**
 * Fiche d'une photo, auto-enregistrée (textes alternatifs, crédit), avec son
 * aperçu. Suppression définitive pour une photo envoyée seulement ; retrait de
 * la galerie ouverte si elle en fait partie.
 */
export function FichePhoto({
  photo,
  liaisons,
  galerie,
  actions,
  onMaj,
  onSupprimee,
  onRetirer,
  onFermer,
}: {
  photo: Photo;
  liaisons: readonly Liaison[];
  /** Galerie depuis laquelle la fiche est ouverte (bouton « Retirer de la galerie »). */
  galerie?: string;
  actions: ActionsFiche;
  onMaj: (photo: Photo) => void;
  onSupprimee: (id: string) => void;
  onRetirer?: () => void;
  onFermer: () => void;
}) {
  const { afficher } = useToasts();
  const { erreurs, signaler, effacer } = useErreurs();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [enCours, setEnCours] = useState(false);
  // Valeur d'ouverture figée : la liste se met à jour après chaque enregistrement, la fiche ouverte non.
  const [initiale] = useState(() => formulaireDepuisPhoto(photo));
  const galeries = galeriesDeLaPhoto(liaisons, photo.id);

  const fiche = useModalAutosave<FormulairePhoto>({
    mode: "edition",
    cle: `photo:${photo.id}`,
    valeurInitiale: initiale,
    enregistrer: async (valeur) => {
      let r: ResultatPhoto;
      try {
        r = await actions.modifier(photo.id, valeur);
      } catch (e) {
        signaler(ERREUR_RESEAU);
        throw e;
      }
      if (!r.ok) {
        signaler(r.message, r.erreurs);
        throw new Error(r.message);
      }
      effacer();
      onMaj(r.photo);
      return r;
    },
  });

  async function fermer() {
    if (await fiche.fermer()) onFermer();
    else setConfirmation("fermer");
  }

  async function supprimer() {
    setEnCours(true);
    try {
      const r = await actions.supprimer(photo.id);
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      fiche.oublierBrouillon();
      afficher("Photo supprimée définitivement.");
      onSupprimee(photo.id);
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(false);
      setConfirmation(null);
    }
  }

  const dansLaGalerie = galerie !== undefined && galeries.includes(galerie);

  return (
    <>
      <Modale
        ouverte
        onFermer={() => void fermer()}
        titre={nomPhoto(fiche.valeur.alt_fr.trim() ? { alt_fr: fiche.valeur.alt_fr } : photo, 48) || "Photo"}
        largeur="large"
        aside={
          <>
            <PillStatut statut={fiche.statut} onReessayer={() => void fiche.reessayer()} />
            <PillOrigine photo={photo} />
          </>
        }
        pied={
          estSupprimable(photo) || (dansLaGalerie && onRetirer) ? (
            <>
              {estSupprimable(photo) && (
                <button type="button" onClick={() => setConfirmation("supprimer")} className={`${CLASSES_DANGER} sm:mr-auto`}>
                  Supprimer définitivement
                </button>
              )}
              {dansLaGalerie && onRetirer && (
                <button type="button" onClick={onRetirer} className={classesBouton("contour")}>
                  Retirer de la galerie
                </button>
              )}
            </>
          ) : undefined
        }
      >
        <p className="mb-6 text-sm text-sable">Chaque modification est enregistrée automatiquement ; le site public se met à jour à la visite suivante d&apos;une page.</p>
        {fiche.brouillonRestaure && (
          <p className="mb-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            Une saisie non enregistrée a été retrouvée sur cet appareil : elle est reprise et enregistrée.
          </p>
        )}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <figure className="flex flex-col gap-3">
            <div className="flex items-center justify-center border border-ligne bg-nuit">
              <Image
                src={adressePhoto(photo)}
                alt={photo.alt_fr}
                width={photo.largeur}
                height={photo.hauteur}
                sizes="(min-width: 768px) 360px, 100vw"
                quality={70}
                // Taille connue avant le chargement (largeur du cadre, hauteur par le ratio) et
                // chargement immédiat : Safari ne charge jamais une image différée de taille nulle.
                loading="eager"
                className="h-auto max-h-[45vh] w-full object-contain"
              />
            </div>
            <figcaption className="text-xs text-sable/80">
              {photo.largeur.toLocaleString("fr-FR")} × {photo.hauteur.toLocaleString("fr-FR")} px ·{" "}
              {photo.origine === "site" ? "fichier du site" : "envoyée depuis le back office"}
            </figcaption>
          </figure>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[0.8125rem] tracking-[0.08em] text-sable">Galeries</p>
              {galeries.length === 0 ? (
                <p className="mt-1 text-sm text-sable">Dans aucune galerie : elle n&apos;apparaît pas sur le site.</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {galeries.map((g) => (
                    <li key={g} className="inline-flex items-center rounded-full border border-ligne px-2.5 py-0.5 text-xs text-ivoire">
                      {libelleGalerie(g)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!estSupprimable(photo) && (
              <p className="border-l-2 border-ligne bg-nuit-3 px-4 py-3 text-sm text-sable">
                Cette photo fait partie des fichiers du site (livrés avec le code) : elle ne peut pas être supprimée ici. Pour ne plus l&apos;afficher,
                retirez-la des galeries.
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-ligne pt-6">
          <ChampsPhoto valeur={fiche.valeur} modifier={fiche.modifier} erreurs={erreurs} />
        </div>
      </Modale>

      <ConfirmDialog
        ouverte={confirmation === "supprimer"}
        titre="Supprimer définitivement ?"
        message={
          <>
            <p>
              {galeries.length === 0
                ? "Cette photo n'est dans aucune galerie."
                : `Elle sera retirée de : ${galeries.map(libelleGalerie).join(", ")}.`}{" "}
              Son fichier sera effacé du stockage.
            </p>
            <p className="mt-3">
              <strong className="font-semibold text-erreur">C&apos;est définitif : elle ne pourra pas être récupérée.</strong> Pour la cacher sans la perdre,
              retirez-la plutôt des galeries.
            </p>
          </>
        }
        libelleConfirmer="Supprimer définitivement"
        danger
        enCours={enCours}
        onConfirmer={() => void supprimer()}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "fermer"}
        titre="Modification non enregistrée"
        message={<p>La dernière modification n&apos;a pas pu être enregistrée. Elle reste gardée sur cet appareil : vous la retrouverez en rouvrant cette photo.</p>}
        libelleConfirmer="Fermer quand même"
        libelleAnnuler="Rester"
        danger
        onConfirmer={() => {
          setConfirmation(null);
          onFermer();
        }}
        onAnnuler={() => setConfirmation(null)}
      />
    </>
  );
}
