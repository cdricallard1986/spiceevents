"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { nomPhoto, photosHorsGalerie, type ResultatAjout, type ResultatEnregistrement, type ResultatUrlEnvoi } from "@/lib/photos/admin";
import { libelleGalerie } from "@/lib/photos/constantes";
import { LISTE_TYPES_IMAGE, TAILLE_MAX_OCTETS, altDepuisNomFichier, estTypeImage, formaterTaille, type TypeImage } from "@/lib/photos/envoi";
import type { FichierPrepare } from "@/lib/photos/navigateur";
import type { ErreursPhoto, FormulairePhoto } from "@/lib/photos/schema";
import type { Liaison, Photo } from "@/lib/photos/types";
import { classesBouton } from "@/components/ui/Bouton";
import { ApercuPhoto, PillOrigine } from "./ApercuPhoto";
import { AIDE_ALT, ChampsPhoto, ERREUR_RESEAU } from "./FichePhoto";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modale } from "./Modale";
import { useToasts } from "./Toasts";

/** Server Actions de l'ajout (injectées pour pouvoir tester le composant). */
export type ActionsAjout = {
  creerUrlEnvoi: (entree: { nomFichier: string; type: TypeImage; taille: number }) => Promise<ResultatUrlEnvoi>;
  enregistrerPhoto: (entree: { chemin: string; largeur: number; hauteur: number; galerie: string } & FormulairePhoto) => Promise<ResultatEnregistrement>;
  ajouterAGalerie: (entree: { galerie: string; photoIds: string[] }) => Promise<ResultatAjout>;
};

/** Ce qui se passe dans le navigateur (remplacé dans les tests : pas de canvas ni de réseau). */
export type OutilsEnvoi = {
  /** Dimensions, et réduction des très grandes photos. */
  preparer: (fichier: File) => Promise<FichierPrepare>;
  /** Envoi direct à Storage avec l'URL signée (jamais par une Server Action). */
  televerser: (chemin: string, jeton: string, fichier: Blob, type: TypeImage) => Promise<void>;
};

type Etat = "attente" | "envoi" | "fait" | "echec";

type Element = {
  cle: number;
  fichier: File;
  apercu: string;
  fiche: FormulairePhoto;
  erreurs: ErreursPhoto;
  etat: Etat;
  message?: string;
  /** Fichier déjà arrivé dans le bucket (un nouvel essai ne le renvoie pas). */
  chemin?: string;
  prepare?: FichierPrepare;
};

const LIBELLES_ETAT: Record<Etat, string> = { attente: "Prête", envoi: "Envoi…", fait: "Ajoutée", echec: "Échec" };

const CLASSES_ONGLET = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors";

/**
 * Ajout de photos à une galerie : envoi de nouveaux fichiers (sélection
 * multiple ou glisser-déposer, direct navigateur → Storage) ou choix dans la
 * photothèque. Le texte alternatif français est exigé avant l'envoi.
 */
export function AjoutPhotos({
  galerie,
  photos,
  liaisons,
  actions,
  outils,
  onAjoutees,
  onFermer,
}: {
  galerie: string;
  photos: readonly Photo[];
  liaisons: readonly Liaison[];
  actions: ActionsAjout;
  outils: OutilsEnvoi;
  /** Photos nouvelles (envoyées) et liaisons créées. */
  onAjoutees: (nouvelles: Photo[], liaisons: Liaison[]) => void;
  onFermer: () => void;
}) {
  const { afficher } = useToasts();
  const [mode, setMode] = useState<"envoi" | "phototheque">("envoi");
  const [elements, setElements] = useState<Element[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [choisies, setChoisies] = useState<Set<string>>(new Set());
  const [confirmerFermeture, setConfirmerFermeture] = useState(false);
  const compteur = useRef(0);
  const champ = useRef<HTMLInputElement>(null);
  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  });
  // Les aperçus (adresses blob:) sont libérés à la fermeture.
  useEffect(() => () => elementsRef.current.forEach((e) => URL.revokeObjectURL(e.apercu)), []);

  const disponibles = photosHorsGalerie(photos, liaisons, galerie);
  const aEnvoyer = elements.filter((e) => e.etat !== "fait");
  const faites = elements.filter((e) => e.etat === "fait").length;

  function ajouterFichiers(liste: FileList | File[]) {
    const refuses: string[] = [];
    const nouveaux: Element[] = [];
    for (const fichier of Array.from(liste)) {
      if (!estTypeImage(fichier.type)) {
        refuses.push(`${fichier.name} (format non accepté)`);
        continue;
      }
      compteur.current += 1;
      nouveaux.push({
        cle: compteur.current,
        fichier,
        apercu: URL.createObjectURL(fichier),
        fiche: { alt_fr: altDepuisNomFichier(fichier.name), alt_en: "", credit: "" },
        erreurs: {},
        etat: "attente",
      });
    }
    if (refuses.length > 0) afficher(`Ignorée${refuses.length > 1 ? "s" : ""} : ${refuses.join(", ")}. Formats acceptés : JPEG, PNG, WebP, AVIF.`, "erreur");
    if (nouveaux.length > 0) setElements((l) => [...l, ...nouveaux]);
  }

  function maj(cle: number, changement: Partial<Element>) {
    setElements((l) => l.map((e) => (e.cle === cle ? { ...e, ...changement } : e)));
  }

  function retirer(cle: number) {
    setElements((l) => {
      const e = l.find((x) => x.cle === cle);
      if (e) URL.revokeObjectURL(e.apercu);
      return l.filter((x) => x.cle !== cle);
    });
  }

  /** Envoie une photo : préparation, URL signée, envoi direct, enregistrement. Renvoie la photo enregistrée. */
  async function envoyerUne(e: Element): Promise<{ photo: Photo; liaison: Liaison | null } | null> {
    if (!e.fiche.alt_fr.trim()) {
      maj(e.cle, { etat: "echec", message: "Décrivez la photo (texte alternatif français) avant de l'envoyer.", erreurs: { alt_fr: "Texte alternatif obligatoire." } });
      return null;
    }
    maj(e.cle, { etat: "envoi", message: undefined, erreurs: {} });
    try {
      const prepare = e.prepare ?? (await outils.preparer(e.fichier));
      let chemin = e.chemin;
      if (!chemin) {
        if (prepare.fichier.size > TAILLE_MAX_OCTETS) {
          maj(e.cle, { etat: "echec", prepare, message: `Fichier trop lourd (${formaterTaille(prepare.fichier.size)}) : ${formaterTaille(TAILLE_MAX_OCTETS)} au maximum.` });
          return null;
        }
        const url = await actions.creerUrlEnvoi({ nomFichier: e.fichier.name, type: prepare.type, taille: prepare.fichier.size });
        if (!url.ok) {
          maj(e.cle, { etat: "echec", prepare, message: url.message });
          return null;
        }
        await outils.televerser(url.chemin, url.jeton, prepare.fichier, prepare.type);
        chemin = url.chemin;
      }
      const r = await actions.enregistrerPhoto({ chemin, largeur: prepare.largeur, hauteur: prepare.hauteur, galerie, ...e.fiche });
      if (!r.ok) {
        maj(e.cle, { etat: "echec", prepare, chemin, message: r.message, erreurs: r.erreurs ?? {} });
        return null;
      }
      if (r.avertissement) afficher(r.avertissement, "erreur");
      maj(e.cle, { etat: "fait", prepare, chemin, message: prepare.reduite ? `Réduite à ${prepare.largeur} × ${prepare.hauteur} px avant l'envoi.` : undefined });
      return { photo: r.photo, liaison: r.liaison };
    } catch (erreur) {
      const message = erreur instanceof Error && erreur.message ? erreur.message : ERREUR_RESEAU;
      maj(e.cle, { etat: "echec", message: `Envoi interrompu : ${message}` });
      return null;
    }
  }

  async function envoyer() {
    if (aEnvoyer.length === 0 || enCours) return;
    setEnCours(true);
    const nouvelles: Photo[] = [];
    const creees: Liaison[] = [];
    // Une à la fois, dans l'ordre choisi : l'ordre de la galerie suit celui de la liste.
    for (const e of aEnvoyer) {
      const r = await envoyerUne(e);
      if (r) {
        nouvelles.push(r.photo);
        if (r.liaison) creees.push(r.liaison);
      }
    }
    setEnCours(false);
    if (nouvelles.length > 0) onAjoutees(nouvelles, creees);
    const echecs = aEnvoyer.length - nouvelles.length;
    if (echecs === 0) {
      afficher(`${nouvelles.length} photo${nouvelles.length > 1 ? "s ajoutées" : " ajoutée"} à ${libelleGalerie(galerie)}.`);
      onFermer();
    } else {
      afficher(`${echecs} photo${echecs > 1 ? "s n'ont" : " n'a"} pas pu être envoyée${echecs > 1 ? "s" : ""} : voyez le message sous chacune, puis réessayez.`, "erreur");
    }
  }

  async function ajouterDepuisPhototheque() {
    if (choisies.size === 0 || enCours) return;
    setEnCours(true);
    try {
      // Dans l'ordre de la photothèque.
      const ids = disponibles.filter((p) => choisies.has(p.id)).map((p) => p.id);
      const r = await actions.ajouterAGalerie({ galerie, photoIds: ids });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      onAjoutees([], r.liaisons);
      afficher(`${r.liaisons.length} photo${r.liaisons.length > 1 ? "s ajoutées" : " ajoutée"} à ${libelleGalerie(galerie)}.`);
      onFermer();
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(false);
    }
  }

  function fermer() {
    if (enCours) {
      afficher("Envoi en cours : patientez jusqu'à la fin avant de fermer.", "info");
      return;
    }
    // Des photos choisies (et leurs textes) pas encore envoyées : on demande avant de les abandonner.
    if (aEnvoyer.length > 0) setConfirmerFermeture(true);
    else onFermer();
  }

  function surDepot(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setSurvol(false);
    if (e.dataTransfer.files.length > 0) ajouterFichiers(e.dataTransfer.files);
  }

  return (
    <>
    <Modale
      ouverte
      onFermer={fermer}
      titre={`Ajouter à ${libelleGalerie(galerie)}`}
      largeur="large"
      pied={
        mode === "envoi" ? (
          <button
            type="button"
            onClick={() => void envoyer()}
            disabled={enCours || aEnvoyer.length === 0}
            className={`${classesBouton("primaire")} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {enCours
              ? `Envoi… ${faites} / ${elements.length}`
              : aEnvoyer.length === 0
                ? "Envoyer"
                : `Envoyer ${aEnvoyer.length} photo${aEnvoyer.length > 1 ? "s" : ""}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void ajouterDepuisPhototheque()}
            disabled={enCours || choisies.size === 0}
            className={`${classesBouton("primaire")} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {enCours ? "Ajout…" : choisies.size === 0 ? "Ajouter" : `Ajouter ${choisies.size} photo${choisies.size > 1 ? "s" : ""}`}
          </button>
        )
      }
    >
      <ul className="mb-6 flex flex-wrap gap-2" aria-label="Origine des photos">
        {(
          [
            ["envoi", "Envoyer de nouvelles photos", null],
            ["phototheque", "Choisir dans la photothèque", disponibles.length],
          ] as const
        ).map(([valeur, libelle, nombre]) => {
          const actif = mode === valeur;
          return (
            <li key={valeur}>
              <button
                type="button"
                aria-pressed={actif}
                disabled={enCours}
                onClick={() => setMode(valeur)}
                className={`${CLASSES_ONGLET} ${actif ? "border-or bg-or text-nuit" : "border-ligne text-sable hover:border-or hover:text-or"}`}
              >
                {libelle}
                {nombre !== null && <span className={`tabular-nums ${actif ? "text-nuit/70" : "text-sable/70"}`}>{nombre}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {mode === "envoi" ? (
        <div className="flex flex-col gap-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={surDepot}
            className={`flex flex-col items-center gap-3 border border-dashed px-5 py-8 text-center transition-colors ${survol ? "border-or bg-nuit-3" : "border-ligne bg-nuit"}`}
          >
            <p className="text-ivoire">Glissez vos photos ici, ou</p>
            <button type="button" onClick={() => champ.current?.click()} disabled={enCours} className={classesBouton("contour")}>
              Choisir des photos
            </button>
            <input
              ref={champ}
              type="file"
              multiple
              accept={LISTE_TYPES_IMAGE.join(",")}
              className="sr-only"
              aria-label="Choisir des photos à envoyer"
              tabIndex={-1}
              onChange={(e) => {
                if (e.target.files) ajouterFichiers(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-sable/80">
              JPEG, PNG, WebP ou AVIF, {formaterTaille(TAILLE_MAX_OCTETS)} au maximum. Les très grandes photos (plus de 3 000 pixels de côté) sont réduites
              avant l&apos;envoi. Elles s&apos;ajoutent à la fin de la galerie, dans l&apos;ordre de la liste.
            </p>
          </div>

          {elements.length > 0 && (
            <>
              <p className="border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
                Texte alternatif : {AIDE_ALT.replace("Décrivez", "décrivez")} Il est proposé à partir du nom du fichier — corrigez-le avant l&apos;envoi.
              </p>
              {enCours && (
                <div role="progressbar" aria-label="Envoi des photos" aria-valuemin={0} aria-valuemax={elements.length} aria-valuenow={faites} className="h-1 w-full bg-ligne">
                  <div className="h-1 bg-or transition-[width] duration-500" style={{ width: `${(faites / elements.length) * 100}%` }} />
                </div>
              )}
              <ul className="flex flex-col border border-ligne">
                {elements.map((e) => (
                  <li key={e.cle} className={`flex flex-col gap-4 border-t border-ligne p-4 first:border-t-0 sm:flex-row ${e.etat === "echec" ? "bg-erreur/5" : ""}`}>
                    <div className="relative h-32 w-full shrink-0 overflow-hidden bg-nuit sm:h-28 sm:w-36">
                      <Image src={e.apercu} alt="" fill unoptimized sizes="144px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-sm text-sable">
                          {e.fichier.name} · {formaterTaille(e.fichier.size)}
                        </p>
                        <span
                          role="status"
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${
                            e.etat === "fait" ? "border-succes/60 text-succes" : e.etat === "echec" ? "border-erreur text-erreur" : e.etat === "envoi" ? "border-or/60 text-or" : "border-ligne text-sable"
                          }`}
                        >
                          {LIBELLES_ETAT[e.etat]}
                        </span>
                      </div>
                      {e.etat === "fait" ? (
                        <p className="text-sm text-ivoire">{nomPhoto({ alt_fr: e.fiche.alt_fr }, 120)}</p>
                      ) : (
                        <fieldset disabled={e.etat === "envoi"} className="min-w-0">
                          <legend className="sr-only">Fiche de {e.fichier.name}</legend>
                          <ChampsPhoto
                            prefixe={`envoi-${e.cle}`}
                            valeur={e.fiche}
                            erreurs={e.erreurs}
                            modifier={(changement) =>
                              setElements((l) => l.map((x) => (x.cle === e.cle ? { ...x, fiche: { ...x.fiche, ...changement }, erreurs: {} } : x)))
                            }
                          />
                        </fieldset>
                      )}
                      {e.message && <p className={`mt-3 text-sm ${e.etat === "echec" ? "text-erreur" : "text-sable"}`}>{e.message}</p>}
                      {e.etat !== "fait" && e.etat !== "envoi" && !enCours && (
                        <button
                          type="button"
                          onClick={() => retirer(e.cle)}
                          className="mt-3 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-sable hover:text-erreur"
                        >
                          Ne pas envoyer
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : disponibles.length === 0 ? (
        <p className="border border-ligne bg-nuit px-5 py-8 text-center text-sable">Toutes les photos de la photothèque sont déjà dans cette galerie.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-sable">Les photos cochées s&apos;ajoutent à la fin de la galerie. Elles restent aussi dans leurs autres galeries.</p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {disponibles.map((p) => {
              const coche = choisies.has(p.id);
              return (
                <li key={p.id}>
                  <label className={`flex h-full cursor-pointer flex-col border bg-nuit transition-colors ${coche ? "border-or" : "border-ligne hover:border-or/60"}`}>
                    <span className="relative block aspect-[4/3] overflow-hidden">
                      <ApercuPhoto photo={p} sizes="(min-width: 640px) 240px, 50vw" />
                    </span>
                    <span className="flex flex-1 items-start gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={(ev) =>
                          setChoisies((s) => {
                            const suivant = new Set(s);
                            if (ev.target.checked) suivant.add(p.id);
                            else suivant.delete(p.id);
                            return suivant;
                          })
                        }
                        className="mt-0.5 size-4 shrink-0 accent-or"
                      />
                      <span className="flex min-w-0 flex-col gap-2">
                        <span className="line-clamp-2 text-sm text-ivoire">{p.alt_fr}</span>
                        <span>
                          <PillOrigine photo={p} />
                        </span>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modale>
    <ConfirmDialog
      ouverte={confirmerFermeture}
      titre="Fermer sans envoyer ?"
      message={
        <p>
          {aEnvoyer.length} photo{aEnvoyer.length > 1 ? "s choisies ne sont" : " choisie n'est"} pas encore envoyée{aEnvoyer.length > 1 ? "s" : ""} : elle
          {aEnvoyer.length > 1 ? "s seront abandonnées" : " sera abandonnée"}, avec les textes saisis.
        </p>
      }
      libelleConfirmer="Fermer sans envoyer"
      libelleAnnuler="Rester"
      danger
      onConfirmer={() => {
        setConfirmerFermeture(false);
        onFermer();
      }}
      onAnnuler={() => setConfirmerFermeture(false)}
    />
    </>
  );
}
