"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { useModalAutosave } from "@/hooks/useModalAutosave";
import { estSupprimable, galeriesDeLaPhoto, nomPhoto, type ResultatAjout, type ResultatPhoto, type ResultatRetrait, type ResultatSuppressionPhoto } from "@/lib/photos/admin";
import { FAMILLES_GALERIES, GALERIES, LIMITES_PHOTOS, MESSAGE_ENTETE_INADAPTEE, convientEnTete, libelleGalerie } from "@/lib/photos/constantes";
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
import { CLASSES_LIBELLE } from "./champs";

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
  /** Emplacements (cases de la fiche) : ajout en fin de liste, retrait. */
  ajouter: (entree: { galerie: string; photoIds: string[] }) => Promise<ResultatAjout>;
  retirer: (entree: { galerie: string; photoId: string }) => Promise<ResultatRetrait>;
};

/**
 * « Où apparaît cette photo » : une case par emplacement du site (diaporamas
 * d'en-tête, page Galerie, pages des animations). Cocher l'ajoute à la fin de
 * la liste, décocher l'en retire ; enregistré aussitôt. Une photo trop petite
 * ou en portrait ne peut pas entrer dans un en-tête, et la dernière photo d'un
 * en-tête ne peut pas en sortir.
 */
export function EmplacementsPhoto({
  photo,
  liaisons,
  actions,
  onLiaisons,
}: {
  photo: Photo;
  liaisons: readonly Liaison[];
  actions: Pick<ActionsFiche, "ajouter" | "retirer">;
  onLiaisons: (maj: (liste: Liaison[]) => Liaison[]) => void;
}) {
  const { afficher } = useToasts();
  const [enCours, setEnCours] = useState<string | null>(null);
  const presentes = new Set(liaisons.filter((l) => l.photo_id === photo.id).map((l) => l.galerie));
  const nombre = (galerie: string) => liaisons.filter((l) => l.galerie === galerie).length;
  const adaptee = convientEnTete(photo);

  async function basculer(galerie: string, cocher: boolean) {
    setEnCours(galerie);
    try {
      if (cocher) {
        const r = await actions.ajouter({ galerie, photoIds: [photo.id] });
        if (!r.ok) return afficher(r.message, "erreur");
        onLiaisons((l) => [...l, ...r.liaisons]);
        afficher(`Ajoutée : ${libelleGalerie(galerie)}.`);
      } else {
        const r = await actions.retirer({ galerie, photoId: photo.id });
        if (!r.ok) return afficher(r.message, "erreur");
        onLiaisons((l) => l.filter((x) => !(x.galerie === galerie && x.photo_id === photo.id)));
        afficher(`Retirée : ${libelleGalerie(galerie)}.`);
        if (r.avertissement) afficher(r.avertissement, "erreur");
      }
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className={`${CLASSES_LIBELLE} mb-1`}>Où apparaît cette photo</legend>
      {presentes.size === 0 && <p className="-mt-3 text-sm text-sable">Nulle part pour l&apos;instant : cochez les emplacements où l&apos;afficher.</p>}
      {FAMILLES_GALERIES.map((f) => (
        <div key={f.famille}>
          <p className="font-display text-lg leading-tight text-ivoire">{f.libelle}</p>
          <p className="mt-1 text-xs text-sable/80">
            {f.aide}
            {f.famille === "entete" && !adaptee ? ` ${MESSAGE_ENTETE_INADAPTEE}` : ""}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {GALERIES.filter((g) => g.famille === f.famille).map((g) => {
              const coche = presentes.has(g.valeur);
              const derniere = f.famille === "entete" && coche && nombre(g.valeur) <= 1;
              const bloquee = (f.famille === "entete" && !coche && !adaptee) || derniere;
              return (
                <li key={g.valeur}>
                  <label
                    title={derniere ? "Dernière photo de cet en-tête : ajoutez-en une autre avant de la retirer." : undefined}
                    className={`flex min-h-11 items-center gap-3 border px-3 py-2 text-sm transition-colors ${
                      coche ? "border-or bg-or/10 text-ivoire" : "border-ligne text-sable"
                    } ${bloquee || enCours ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-or hover:text-ivoire"}`}
                  >
                    <input
                      type="checkbox"
                      checked={coche}
                      disabled={bloquee || enCours !== null}
                      onChange={(e) => void basculer(g.valeur, e.target.checked)}
                      className="size-4 shrink-0 accent-[var(--color-or)]"
                    />
                    <span className="min-w-0 flex-1">{g.libelle}</span>
                    {enCours === g.valeur && <span className="text-xs text-sable">…</span>}
                    {derniere && <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-sable">Seule photo</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </fieldset>
  );
}

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
  onLiaisons,
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
  /** Emplacements cochés ou décochés dans la fiche. */
  onLiaisons: (maj: (liste: Liaison[]) => Liaison[]) => void;
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
            {!estSupprimable(photo) && (
              <p className="border-l-2 border-ligne bg-nuit-3 px-4 py-3 text-sm text-sable">
                Cette photo fait partie des fichiers du site (livrés avec le code) : elle ne peut pas être supprimée ici. Pour ne plus l&apos;afficher,
                décochez ses emplacements ci-dessous.
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-ligne pt-6">
          <EmplacementsPhoto photo={photo} liaisons={liaisons} actions={actions} onLiaisons={onLiaisons} />
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
