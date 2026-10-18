"use client";

import { useState } from "react";
import {
  galeriesDeLaPhoto,
  messageMinimum,
  nomPhoto,
  sousLeMinimum,
  type ResultatAjout,
  type ResultatEchangePhotos,
  type ResultatEnregistrement,
  type ResultatPhoto,
  type ResultatRetrait,
  type ResultatSuppressionPhoto,
  type ResultatUrlEnvoi,
} from "@/lib/photos/admin";
import { BUCKET_MEDIAS, GALERIES, MINIMUM_PHOTOS_OPTION, estGalerieOption, libelleGalerie } from "@/lib/photos/constantes";
import type { TypeImage } from "@/lib/photos/envoi";
import { preparerPhoto } from "@/lib/photos/navigateur";
import type { FormulairePhoto } from "@/lib/photos/schema";
import { photosDeLaGalerie } from "@/lib/photos/selection";
import type { Liaison, Photo } from "@/lib/photos/types";
import { clientNavigateur } from "@/lib/supabase/client";
import { classesBouton } from "@/components/ui/Bouton";
import { AjoutPhotos, type OutilsEnvoi } from "./AjoutPhotos";
import { ApercuPhoto, CLASSES_PASTILLE, PillOrigine } from "./ApercuPhoto";
import { CLASSES_CHAMP, CLASSES_LIBELLE } from "./champs";
import { ConfirmDialog } from "./ConfirmDialog";
import { ERREUR_RESEAU, FichePhoto } from "./FichePhoto";
import { useToasts } from "./Toasts";

/** Server Actions (injectées pour pouvoir tester le composant). */
export type ActionsPhotos = {
  creerUrlEnvoi: (entree: { nomFichier: string; type: TypeImage; taille: number }) => Promise<ResultatUrlEnvoi>;
  enregistrerPhoto: (entree: { chemin: string; largeur: number; hauteur: number; galerie: string } & FormulairePhoto) => Promise<ResultatEnregistrement>;
  modifier: (id: string, champs: FormulairePhoto) => Promise<ResultatPhoto>;
  ajouterAGalerie: (entree: { galerie: string; photoIds: string[] }) => Promise<ResultatAjout>;
  retirer: (entree: { galerie: string; photoId: string }) => Promise<ResultatRetrait>;
  echanger: (entree: { galerie: string; photoId: string; avecId: string; sens: "monter" | "descendre" }) => Promise<ResultatEchangePhotos>;
  supprimer: (id: string) => Promise<ResultatSuppressionPhoto>;
};

/** Envoi réel : préparation dans le navigateur, puis directement à Storage avec l'URL signée. */
export const OUTILS_NAVIGATEUR: OutilsEnvoi = {
  preparer: preparerPhoto,
  async televerser(chemin, jeton, fichier, type) {
    const { error } = await clientNavigateur()
      .storage.from(BUCKET_MEDIAS)
      // Nom de fichier unique, jamais réécrit : il peut rester en cache un an.
      .uploadToSignedUrl(chemin, jeton, fichier, { contentType: type, cacheControl: "31536000" });
    if (error) throw new Error(error.message || "le stockage a refusé le fichier");
  },
};

const CLASSES_ONGLET = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors";
const CLASSES_FLECHE =
  "flex size-10 items-center justify-center border border-ligne text-lg text-sable transition-colors hover:border-or hover:text-or disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ligne disabled:hover:text-sable";

type Ouverte = { id: string; depuisGalerie: boolean } | null;

/**
 * Photos des galeries : la galerie choisie dans l'ordre (flèches, retrait
 * confirmé, fiche auto-enregistrée), l'ajout (envoi direct ou photothèque), et
 * la photothèque (toutes les photos ; suppression définitive des photos envoyées).
 */
export function GestionPhotos({
  photosInitiales,
  liaisonsInitiales,
  actions,
  outils = OUTILS_NAVIGATEUR,
}: {
  photosInitiales: Photo[];
  liaisonsInitiales: Liaison[];
  actions: ActionsPhotos;
  outils?: OutilsEnvoi;
}) {
  const [photos, setPhotos] = useState<Photo[]>(photosInitiales);
  const [liaisons, setLiaisons] = useState<Liaison[]>(liaisonsInitiales);
  const [onglet, setOnglet] = useState<"galeries" | "phototheque">("galeries");
  const [galerie, setGalerie] = useState<string>(GALERIES[0].valeur);
  const [ouverte, setOuverte] = useState<Ouverte>(null);
  const [ajout, setAjout] = useState(false);
  const [aRetirer, setARetirer] = useState<Photo | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [deplacement, setDeplacement] = useState(false);
  const { afficher } = useToasts();

  const dansLaGalerie = photosDeLaGalerie(photos, liaisons, galerie);
  const photoOuverte = ouverte ? photos.find((p) => p.id === ouverte.id) : undefined;
  const option = estGalerieOption(galerie);

  async function deplacer(photo: Photo, sens: "monter" | "descendre") {
    const i = dansLaGalerie.findIndex((p) => p.id === photo.id);
    const voisine = dansLaGalerie[sens === "monter" ? i - 1 : i + 1];
    if (!voisine || deplacement) return;
    setDeplacement(true);
    try {
      const r = await actions.echanger({ galerie, photoId: photo.id, avecId: voisine.id, sens });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      setLiaisons((l) => l.map((x) => (x.galerie === galerie ? { ...x, ordre: r.rangs.find((y) => y.photoId === x.photo_id)?.ordre ?? x.ordre } : x)));
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setDeplacement(false);
    }
  }

  async function retirer(photo: Photo) {
    setEnCours(true);
    try {
      const r = await actions.retirer({ galerie, photoId: photo.id });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      setLiaisons((l) => l.filter((x) => !(x.galerie === galerie && x.photo_id === photo.id)));
      afficher(`Photo retirée de ${libelleGalerie(galerie)} : elle reste dans la photothèque.`);
      if (r.avertissement) afficher(r.avertissement, "erreur");
      setOuverte(null);
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(false);
      setARetirer(null);
    }
  }

  function apresSuppression(id: string) {
    const touchees = liaisons.filter((l) => l.photo_id === id).map((l) => l.galerie);
    const restantes = liaisons.filter((l) => l.photo_id !== id);
    setLiaisons(restantes);
    setPhotos((p) => p.filter((x) => x.id !== id));
    setOuverte(null);
    for (const g of touchees) {
      const n = restantes.filter((l) => l.galerie === g).length;
      if (sousLeMinimum(g, n)) afficher(messageMinimum(g, n), "erreur");
    }
  }

  const restantesApresRetrait = dansLaGalerie.length - 1;

  return (
    <div>
      <div className="flex flex-col gap-6 border border-ligne bg-nuit-2 p-5 sm:p-6">
        <ul className="flex flex-wrap gap-2" aria-label="Affichage">
          {(
            [
              ["galeries", "Galeries", null],
              ["phototheque", "Photothèque", photos.length],
            ] as const
          ).map(([valeur, libelle, nombre]) => {
            const actif = onglet === valeur;
            return (
              <li key={valeur}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setOnglet(valeur)}
                  className={`${CLASSES_ONGLET} ${actif ? "border-or bg-or text-nuit" : "border-ligne text-sable hover:border-or hover:text-or"}`}
                >
                  {libelle}
                  {nombre !== null && <span className={`tabular-nums ${actif ? "text-nuit/70" : "text-sable/70"}`}>{nombre}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {onglet === "galeries" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2 sm:min-w-80">
              <label htmlFor="photos-galerie" className={CLASSES_LIBELLE}>
                Galerie
              </label>
              <select id="photos-galerie" value={galerie} onChange={(e) => setGalerie(e.target.value)} className={CLASSES_CHAMP}>
                <optgroup label="Page Galerie">
                  {GALERIES.filter((g) => !g.option).map((g) => (
                    <option key={g.valeur} value={g.valeur}>
                      {g.libelle}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Pages des animations">
                  {GALERIES.filter((g) => g.option).map((g) => (
                    <option key={g.valeur} value={g.valeur}>
                      {g.libelle}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <p role="status" className="text-sm text-sable">
                {dansLaGalerie.length} photo{dansLaGalerie.length > 1 ? "s" : ""}
              </p>
              <button type="button" onClick={() => setAjout(true)} className={classesBouton("primaire")}>
                Ajouter des photos
              </button>
            </div>
          </div>
        ) : (
          <p role="status" className="text-sm text-sable">
            {photos.length} photo{photos.length > 1 ? "s" : ""} · {photos.filter((p) => p.origine === "stockage").length} envoyée
            {photos.filter((p) => p.origine === "stockage").length > 1 ? "s" : ""} depuis le back office
          </p>
        )}
      </div>

      {onglet === "galeries" ? (
        <>
          {option && dansLaGalerie.length < MINIMUM_PHOTOS_OPTION && (
            <p role="alert" className="mt-6 border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
              {messageMinimum(galerie, dansLaGalerie.length)}
            </p>
          )}
          <p className="mt-6 text-xs text-sable/80">
            Les flèches changent l&apos;ordre des photos sur la page. « Retirer » enlève la photo de cette galerie seulement : elle reste dans la photothèque.
            {option ? ` La galerie d'une animation ne s'affiche qu'à partir de ${MINIMUM_PHOTOS_OPTION} photos.` : ""}
          </p>
          {dansLaGalerie.length === 0 ? (
            <p className="mt-4 border border-ligne bg-nuit-2 px-5 py-8 text-center text-sable">
              Aucune photo dans cette galerie : ajoutez-en avec « Ajouter des photos ».
            </p>
          ) : (
            <ol className="mt-4 border border-ligne bg-nuit-2">
              {dansLaGalerie.map((p, i) => (
                <LignePhoto
                  key={p.id}
                  photo={p}
                  rang={i + 1}
                  premiere={i === 0}
                  derniere={i === dansLaGalerie.length - 1}
                  enDeplacement={deplacement}
                  onOuvrir={() => setOuverte({ id: p.id, depuisGalerie: true })}
                  onDeplacer={(sens) => void deplacer(p, sens)}
                  onRetirer={() => setARetirer(p)}
                />
              ))}
            </ol>
          )}
        </>
      ) : (
        <>
          <p className="mt-6 text-xs text-sable/80">
            Toutes les photos, dans une galerie ou non. Une photo envoyée depuis le back office peut être supprimée définitivement depuis sa fiche ; un
            fichier du site (livré avec le code) ne se supprime pas, il se retire des galeries.
          </p>
          {photos.length === 0 ? (
            <p className="mt-4 border border-ligne bg-nuit-2 px-5 py-8 text-center text-sable">La photothèque est vide.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p) => {
                const n = galeriesDeLaPhoto(liaisons, p.id).length;
                return (
                  <li key={p.id} className="flex flex-col border border-ligne bg-nuit-2">
                    <button type="button" onClick={() => setOuverte({ id: p.id, depuisGalerie: false })} className="group relative block aspect-[4/3] overflow-hidden" aria-label={`Ouvrir la fiche : ${nomPhoto(p)}`}>
                      <ApercuPhoto photo={p} sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw" className="transition-transform duration-700 group-hover:scale-105" />
                    </button>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="line-clamp-2 text-sm text-ivoire">{p.alt_fr}</p>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <PillOrigine photo={p} />
                        <span className={`${CLASSES_PASTILLE} ${n === 0 ? "border-ligne text-sable/80" : "border-ligne text-ivoire"}`}>
                          {n === 0 ? "Dans aucune galerie" : `Dans ${n} galerie${n > 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {photoOuverte && (
        <FichePhoto
          key={photoOuverte.id}
          photo={photoOuverte}
          liaisons={liaisons}
          galerie={ouverte?.depuisGalerie ? galerie : undefined}
          actions={{ modifier: actions.modifier, supprimer: actions.supprimer }}
          onMaj={(maj) => setPhotos((l) => l.map((p) => (p.id === maj.id ? maj : p)))}
          onSupprimee={apresSuppression}
          onRetirer={() => setARetirer(photoOuverte)}
          onFermer={() => setOuverte(null)}
        />
      )}

      {ajout && (
        <AjoutPhotos
          galerie={galerie}
          photos={photos}
          liaisons={liaisons}
          actions={{ creerUrlEnvoi: actions.creerUrlEnvoi, enregistrerPhoto: actions.enregistrerPhoto, ajouterAGalerie: actions.ajouterAGalerie }}
          outils={outils}
          onAjoutees={(nouvelles, creees) => {
            setPhotos((l) => [...nouvelles, ...l]);
            setLiaisons((l) => [...l, ...creees]);
          }}
          onFermer={() => setAjout(false)}
        />
      )}

      <ConfirmDialog
        ouverte={aRetirer !== null}
        titre="Retirer de la galerie ?"
        message={
          <>
            <p>
              La photo ne s&apos;affichera plus dans <span className="text-ivoire">{libelleGalerie(galerie)}</span>. Elle reste dans la photothèque : vous
              pourrez l&apos;y remettre.
            </p>
            {sousLeMinimum(galerie, restantesApresRetrait) && (
              <p className="mt-3 text-erreur">
                Il ne restera {restantesApresRetrait === 0 ? "aucune photo" : `que ${restantesApresRetrait} photo`} : la galerie ne s&apos;affichera plus sur la
                page de l&apos;animation tant qu&apos;elle n&apos;en aura pas au moins {MINIMUM_PHOTOS_OPTION}.
              </p>
            )}
          </>
        }
        libelleConfirmer="Retirer"
        enCours={enCours}
        onConfirmer={() => aRetirer && void retirer(aRetirer)}
        onAnnuler={() => setARetirer(null)}
      />
    </div>
  );
}

function LignePhoto({
  photo: p,
  rang,
  premiere,
  derniere,
  enDeplacement,
  onOuvrir,
  onDeplacer,
  onRetirer,
}: {
  photo: Photo;
  rang: number;
  premiere: boolean;
  derniere: boolean;
  enDeplacement: boolean;
  onOuvrir: () => void;
  onDeplacer: (sens: "monter" | "descendre") => void;
  onRetirer: () => void;
}) {
  const nom = nomPhoto(p);
  return (
    <li className="flex gap-4 border-t border-ligne px-4 py-4 first:border-t-0 sm:px-5">
      <button type="button" onClick={onOuvrir} tabIndex={-1} aria-hidden="true" className="group relative h-20 w-28 shrink-0 overflow-hidden bg-nuit sm:h-24 sm:w-36">
        <ApercuPhoto photo={p} sizes="144px" className="transition-transform duration-700 group-hover:scale-105" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-display text-xl leading-tight text-or tabular-nums">{rang}</span>
          <PillOrigine photo={p} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ivoire">{p.alt_fr}</p>
        <p className="mt-1 text-xs text-sable/80">
          {p.largeur} × {p.hauteur} px{p.credit ? ` · ${p.credit}` : ""}
          {!p.alt_en && " · sans texte anglais"}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={onOuvrir}
            aria-label={`Modifier la photo ${rang} : ${nom}`}
            className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
          >
            Modifier →
          </button>
          <button
            type="button"
            onClick={onRetirer}
            aria-label={`Retirer de la galerie la photo ${rang} : ${nom}`}
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-sable hover:text-erreur"
          >
            Retirer
          </button>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button type="button" onClick={() => onDeplacer("monter")} disabled={premiere || enDeplacement} aria-label={`Monter la photo ${rang}`} className={CLASSES_FLECHE}>
          ↑
        </button>
        <button type="button" onClick={() => onDeplacer("descendre")} disabled={derniere || enDeplacement} aria-label={`Descendre la photo ${rang}`} className={CLASSES_FLECHE}>
          ↓
        </button>
      </div>
    </li>
  );
}
