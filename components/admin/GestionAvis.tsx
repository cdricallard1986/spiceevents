"use client";

import { useMemo, useRef, useState } from "react";
import { useModalAutosave } from "@/hooks/useModalAutosave";
import {
  FILTRES_PAR_DEFAUT,
  filtrerAvis,
  filtresActifs,
  type FiltresAvis,
  type ResultatAvis,
  type ResultatEchange,
  type ResultatPublication,
  type ResultatSuppression,
  type Retrait,
} from "@/lib/avis/admin";
import { CATEGORIES, LIBELLES_CATEGORIE, LIBELLES_SOURCE, SOURCES, estEmplacementUnique, libelleEmplacement, type Categorie, type Source } from "@/lib/avis/constantes";
import { FORMULAIRE_VIDE, formulaireDepuisAvis, type ErreursAvis, type FormulaireAvis } from "@/lib/avis/schema";
import { extrait } from "@/lib/avis/selection";
import type { Avis } from "@/lib/avis/types";
import { classesBouton } from "@/components/ui/Bouton";
import { CLASSES_CHAMP, CLASSES_LIBELLE } from "./champs";
import { CLASSES_DANGER, ConfirmDialog } from "./ConfirmDialog";
import { FicheAvis } from "./FicheAvis";
import { Modale } from "./Modale";
import { PillStatut } from "./PillStatut";
import { useToasts } from "./Toasts";

/** Server Actions (injectées pour pouvoir tester le composant). */
export type ActionsAvis = {
  enregistrer: (id: string, champs: FormulaireAvis) => Promise<ResultatAvis>;
  creer: (champs: FormulaireAvis) => Promise<ResultatAvis>;
  changerPublication: (entree: { id: string; publie: boolean }) => Promise<ResultatPublication>;
  supprimer: (id: string) => Promise<ResultatSuppression>;
  echanger: (entree: { id: string; avecId: string; sens: "monter" | "descendre" }) => Promise<ResultatEchange>;
};

const AIDE_MISE_A_JOUR = "Chaque modification est enregistrée automatiquement ; le site public se met à jour à la visite suivante d'une page.";
const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";
const CLASSES_PASTILLE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs tracking-[0.02em]";

/** Message des emplacements uniques retirés à un autre avis. */
function messageRetrait(r: Retrait): string {
  return `« ${libelleEmplacement(r.emplacement)} » a été retiré de l'avis de ${r.auteurs} : un seul avis à la fois à cet endroit.`;
}

type Ouverte = { type: "edition"; id: string } | { type: "creation" } | null;

/**
 * Liste des avis du back office : filtres, ordre (flèches), ouverture de la
 * modale d'édition auto-enregistrée, création d'un avis (non publié).
 */
export function GestionAvis({ avisInitiaux, actions }: { avisInitiaux: Avis[]; actions: ActionsAvis }) {
  const [liste, setListe] = useState<Avis[]>(avisInitiaux);
  const [filtres, setFiltres] = useState<FiltresAvis>(FILTRES_PAR_DEFAUT);
  const [ouverte, setOuverte] = useState<Ouverte>(null);
  const [deplacement, setDeplacement] = useState<string | null>(null);
  const { afficher } = useToasts();

  const visibles = useMemo(() => filtrerAvis(liste, filtres), [liste, filtres]);
  const nbPublies = liste.filter((a) => a.publie).length;
  const avisOuvert = ouverte?.type === "edition" ? liste.find((a) => a.id === ouverte.id) : undefined;

  /** Après un enregistrement : l'avis à jour, et les emplacements retirés aux autres. */
  function integrer(avis: Avis, retraits: Retrait[]) {
    setListe((l) => {
      const existe = l.some((a) => a.id === avis.id);
      const maj = existe ? l.map((a) => (a.id === avis.id ? avis : a)) : [...l, avis];
      return maj.map((a) => {
        const r = retraits.find((x) => x.id === a.id);
        return r ? { ...a, emplacements: r.emplacements } : a;
      });
    });
  }

  async function deplacer(avis: Avis, sens: "monter" | "descendre") {
    const i = visibles.findIndex((a) => a.id === avis.id);
    const voisin = visibles[sens === "monter" ? i - 1 : i + 1];
    if (!voisin || deplacement) return;
    setDeplacement(avis.id);
    try {
      const r = await actions.echanger({ id: avis.id, avecId: voisin.id, sens });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      setListe((l) => l.map((a) => ({ ...a, ordre: r.rangs.find((x) => x.id === a.id)?.ordre ?? a.ordre })));
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setDeplacement(null);
    }
  }

  function modifierFiltre<K extends keyof FiltresAvis>(cle: K, valeur: FiltresAvis[K]) {
    setFiltres((f) => ({ ...f, [cle]: valeur }));
  }

  return (
    <div>
      {/* Filtres et création */}
      <div className="flex flex-col gap-6 border border-ligne bg-nuit-2 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-1">
            <label htmlFor="avis-recherche" className={CLASSES_LIBELLE}>
              Rechercher (auteurs)
            </label>
            <input
              id="avis-recherche"
              type="search"
              value={filtres.recherche}
              onChange={(e) => modifierFiltre("recherche", e.target.value)}
              placeholder="Pierre, Juliette…"
              className={CLASSES_CHAMP}
            />
          </div>
          <Filtre
            id="avis-categorie"
            libelle="Catégorie"
            valeur={filtres.categorie}
            onChange={(v) => modifierFiltre("categorie", v as Categorie | "toutes")}
            options={[{ valeur: "toutes", libelle: "Toutes" }, ...CATEGORIES.map((c) => ({ valeur: c, libelle: LIBELLES_CATEGORIE[c] }))]}
          />
          <Filtre
            id="avis-statut"
            libelle="Statut"
            valeur={filtres.statut}
            onChange={(v) => modifierFiltre("statut", v as FiltresAvis["statut"])}
            options={[
              { valeur: "tous", libelle: "Tous" },
              { valeur: "publies", libelle: "Publiés" },
              { valeur: "non_publies", libelle: "Non publiés" },
            ]}
          />
          <Filtre
            id="avis-source"
            libelle="Source"
            valeur={filtres.source}
            onChange={(v) => modifierFiltre("source", v as Source | "toutes")}
            options={[{ valeur: "toutes", libelle: "Toutes" }, ...SOURCES.map((s) => ({ valeur: s, libelle: LIBELLES_SOURCE[s] }))]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p role="status" className="text-sm text-sable">
            {filtresActifs(filtres) ? `${visibles.length} avis affiché${visibles.length > 1 ? "s" : ""} sur ${liste.length}` : `${liste.length} avis`} ·{" "}
            {nbPublies} publié{nbPublies > 1 ? "s" : ""}
            {filtresActifs(filtres) && (
              <button type="button" onClick={() => setFiltres(FILTRES_PAR_DEFAUT)} className="ml-3 text-or underline underline-offset-4 hover:text-or-clair">
                Effacer les filtres
              </button>
            )}
          </p>
          <button type="button" onClick={() => setOuverte({ type: "creation" })} className={classesBouton("primaire")}>
            Nouvel avis
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-sable/80">
        Les flèches changent l&apos;ordre des avis sur le site (page Avis et grilles). Avec un filtre, un avis s&apos;échange avec son voisin dans la liste
        affichée.
      </p>

      {/* Liste */}
      {visibles.length === 0 ? (
        <p className="mt-4 border border-ligne bg-nuit-2 px-5 py-8 text-center text-sable">
          {liste.length === 0 ? "Aucun avis pour l'instant : créez le premier avec « Nouvel avis »." : "Aucun avis ne correspond à ces filtres."}
        </p>
      ) : (
        <ul className="mt-4 border border-ligne bg-nuit-2">
          {visibles.map((a, i) => (
            <LigneAvis
              key={a.id}
              avis={a}
              premier={i === 0}
              dernier={i === visibles.length - 1}
              enDeplacement={deplacement !== null}
              onOuvrir={() => setOuverte({ type: "edition", id: a.id })}
              onDeplacer={(sens) => void deplacer(a, sens)}
            />
          ))}
        </ul>
      )}

      {avisOuvert && (
        <ModaleEdition
          key={avisOuvert.id}
          avis={avisOuvert}
          liste={liste}
          actions={actions}
          onMaj={integrer}
          onSupprime={(id) => {
            setListe((l) => l.filter((a) => a.id !== id));
            setOuverte(null);
          }}
          onFermer={() => setOuverte(null)}
        />
      )}
      {ouverte?.type === "creation" && (
        <ModaleCreation
          liste={liste}
          actions={actions}
          onCree={(avis, retraits) => {
            integrer(avis, retraits);
            setFiltres(FILTRES_PAR_DEFAUT);
            // On enchaîne sur la fiche du nouvel avis : relecture, puis publication.
            setOuverte({ type: "edition", id: avis.id });
          }}
          onFermer={() => setOuverte(null)}
        />
      )}
    </div>
  );
}

function Filtre({
  id,
  libelle,
  valeur,
  options,
  onChange,
}: {
  id: string;
  libelle: string;
  valeur: string;
  options: { valeur: string; libelle: string }[];
  onChange: (valeur: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={CLASSES_LIBELLE}>
        {libelle}
      </label>
      <select id={id} value={valeur} onChange={(e) => onChange(e.target.value)} className={CLASSES_CHAMP}>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PillPublication({ publie }: { publie: boolean }) {
  return (
    <span className={`${CLASSES_PASTILLE} ${publie ? "border-succes/60 text-succes" : "border-ligne text-sable"}`}>{publie ? "Publié" : "Non publié"}</span>
  );
}

function LigneAvis({
  avis: a,
  premier,
  dernier,
  enDeplacement,
  onOuvrir,
  onDeplacer,
}: {
  avis: Avis;
  premier: boolean;
  dernier: boolean;
  enDeplacement: boolean;
  onOuvrir: () => void;
  onDeplacer: (sens: "monter" | "descendre") => void;
}) {
  const date = a.date_avis ? new Date(`${a.date_avis}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
  const classesFleche =
    "flex size-10 items-center justify-center border border-ligne text-lg text-sable transition-colors hover:border-or hover:text-or disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ligne disabled:hover:text-sable";
  return (
    <li className={`flex gap-4 border-t border-ligne px-4 py-4 first:border-t-0 sm:px-5 ${a.publie ? "" : "bg-nuit-3/60"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onClick={onOuvrir} className="text-left font-display text-xl leading-tight text-ivoire hover:text-or">
            {a.auteurs}
          </button>
          <PillPublication publie={a.publie} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-sable sm:line-clamp-1">{extrait(a.texte_fr, 160)}</p>
        <p className="mt-1 text-xs text-sable/80">
          {LIBELLES_CATEGORIE[a.categorie]} · {LIBELLES_SOURCE[a.source]}
          {date && ` · ${date}`}
          {!a.texte_en && " · sans traduction anglaise"}
        </p>
        {a.emplacements.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Emplacements">
            {a.emplacements.map((e) => (
              <li key={e} className={`${CLASSES_PASTILLE} ${estEmplacementUnique(e) ? "border-or/50 text-or" : "border-ligne text-sable"}`}>
                {libelleEmplacement(e)}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onOuvrir}
          aria-label={`Modifier l'avis de ${a.auteurs}`}
          className="mt-3 inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
        >
          Modifier →
        </button>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button type="button" onClick={() => onDeplacer("monter")} disabled={premier || enDeplacement} aria-label={`Monter l'avis de ${a.auteurs}`} className={classesFleche}>
          ↑
        </button>
        <button
          type="button"
          onClick={() => onDeplacer("descendre")}
          disabled={dernier || enDeplacement}
          aria-label={`Descendre l'avis de ${a.auteurs}`}
          className={classesFleche}
        >
          ↓
        </button>
      </div>
    </li>
  );
}

/** Toast d'erreur sans répétition : la même erreur, à chaque nouvel essai d'enregistrement, ne s'affiche qu'une fois. */
function useErreurs() {
  const { afficher } = useToasts();
  const [erreurs, setErreurs] = useState<ErreursAvis>({});
  const dernier = useRef("");
  return {
    erreurs,
    signaler(message: string, champs: ErreursAvis = {}) {
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

type Confirmation = "publier" | "retirer" | "supprimer" | "fermer" | null;

function ModaleEdition({
  avis,
  liste,
  actions,
  onMaj,
  onSupprime,
  onFermer,
}: {
  avis: Avis;
  liste: Avis[];
  actions: ActionsAvis;
  onMaj: (avis: Avis, retraits: Retrait[]) => void;
  onSupprime: (id: string) => void;
  onFermer: () => void;
}) {
  const { afficher } = useToasts();
  const { erreurs, signaler, effacer } = useErreurs();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [enCours, setEnCours] = useState(false);
  // Valeur d'ouverture figée : la liste se met à jour après chaque enregistrement, la fiche ouverte non.
  const [initiale] = useState(() => formulaireDepuisAvis(avis));

  const fiche = useModalAutosave<FormulaireAvis>({
    mode: "edition",
    cle: `avis:${avis.id}`,
    valeurInitiale: initiale,
    enregistrer: async (valeur) => {
      let r: ResultatAvis;
      try {
        r = await actions.enregistrer(avis.id, valeur);
      } catch (e) {
        signaler(ERREUR_RESEAU);
        throw e;
      }
      if (!r.ok) {
        signaler(r.message, r.erreurs);
        throw new Error(r.message);
      }
      effacer();
      onMaj(r.avis, r.retraits);
      r.retraits.forEach((x) => afficher(messageRetrait(x), "info"));
      if (r.avertissement) afficher(r.avertissement, "erreur");
      return r;
    },
  });

  async function fermer() {
    if (await fiche.fermer()) onFermer();
    else setConfirmation("fermer");
  }

  async function publier(publie: boolean) {
    setEnCours(true);
    try {
      // D'abord ce qui attend : on publie la fiche telle qu'elle est à l'écran.
      if (!(await fiche.enregistrerMaintenant())) {
        afficher("La fiche n'est pas enregistrée (pastille rouge) : corrigez-la avant de publier ou de retirer l'avis.", "erreur");
        return;
      }
      const r = await actions.changerPublication({ id: avis.id, publie });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      onMaj(r.avis, []);
      afficher(publie ? `Avis de ${avis.auteurs} publié : il apparaît sur le site à la visite suivante.` : `Avis de ${avis.auteurs} retiré du site.`);
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(false);
      setConfirmation(null);
    }
  }

  async function supprimer() {
    setEnCours(true);
    try {
      const r = await actions.supprimer(avis.id);
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      fiche.oublierBrouillon();
      afficher(`Avis de ${avis.auteurs} supprimé définitivement.`);
      onSupprime(avis.id);
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(false);
      setConfirmation(null);
    }
  }

  return (
    <>
      <Modale
        ouverte
        onFermer={() => void fermer()}
        titre={avis.auteurs || "Avis sans auteurs"}
        largeur="large"
        aside={
          <>
            <PillStatut statut={fiche.statut} onReessayer={() => void fiche.reessayer()} />
            <PillPublication publie={avis.publie} />
          </>
        }
        pied={
          <>
            <button type="button" onClick={() => setConfirmation("supprimer")} className={`${CLASSES_DANGER} sm:mr-auto`}>
              Supprimer
            </button>
            {avis.publie ? (
              <button type="button" onClick={() => setConfirmation("retirer")} className={classesBouton("contour")}>
                Retirer du site
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmation("publier")} className={classesBouton("primaire")}>
                Publier
              </button>
            )}
          </>
        }
      >
        <p className="mb-6 text-sm text-sable">{AIDE_MISE_A_JOUR}</p>
        {fiche.brouillonRestaure && (
          <p className="mb-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            Une saisie non enregistrée a été retrouvée sur cet appareil : elle est reprise et enregistrée.
          </p>
        )}
        <FicheAvis valeur={fiche.valeur} modifier={fiche.modifier} erreurs={erreurs} liste={liste} avis={avis} />
      </Modale>

      <ConfirmDialog
        ouverte={confirmation === "publier"}
        titre="Publier l'avis ?"
        message={
          <p>
            L&apos;avis de <span className="text-ivoire">{avis.auteurs}</span> apparaîtra sur le site (page Avis et emplacements cochés) dès la visite
            suivante d&apos;une page.
          </p>
        }
        libelleConfirmer="Publier"
        enCours={enCours}
        onConfirmer={() => void publier(true)}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "retirer"}
        titre="Retirer l'avis du site ?"
        message={
          <p>
            L&apos;avis de <span className="text-ivoire">{avis.auteurs}</span> n&apos;apparaîtra plus sur le site. Il reste ici, non publié : vous pourrez le
            republier.
          </p>
        }
        libelleConfirmer="Retirer du site"
        enCours={enCours}
        onConfirmer={() => void publier(false)}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "supprimer"}
        titre="Supprimer définitivement ?"
        message={
          <p>
            L&apos;avis de <span className="text-ivoire">{avis.auteurs}</span> sera supprimé du site et du back office.{" "}
            <strong className="font-semibold text-erreur">C&apos;est définitif : il ne pourra pas être récupéré.</strong> Pour le cacher sans le perdre,
            utilisez plutôt « Retirer du site ».
          </p>
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
        message={
          <p>
            La dernière modification n&apos;a pas pu être enregistrée. Elle reste gardée sur cet appareil : vous la retrouverez en rouvrant cet avis.
          </p>
        }
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

function ModaleCreation({
  liste,
  actions,
  onCree,
  onFermer,
}: {
  liste: Avis[];
  actions: ActionsAvis;
  onCree: (avis: Avis, retraits: Retrait[]) => void;
  onFermer: () => void;
}) {
  const { afficher } = useToasts();
  const { erreurs, signaler, effacer } = useErreurs();
  const [enCours, setEnCours] = useState(false);
  const fiche = useModalAutosave<FormulaireAvis>({ mode: "creation-locale", cle: "avis:nouveau", valeurInitiale: FORMULAIRE_VIDE });

  async function creer() {
    setEnCours(true);
    try {
      const r = await actions.creer(fiche.valeur);
      if (!r.ok) {
        signaler(r.message, r.erreurs);
        return;
      }
      effacer();
      fiche.oublierBrouillon();
      afficher(`Avis de ${r.avis.auteurs} créé, non publié : relisez-le puis publiez-le.`);
      r.retraits.forEach((x) => afficher(messageRetrait(x), "info"));
      if (r.avertissement) afficher(r.avertissement, "erreur");
      onCree(r.avis, r.retraits);
    } catch {
      signaler(ERREUR_RESEAU);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre="Nouvel avis"
      largeur="large"
      aside={fiche.statut === "brouillon" ? <PillStatut statut="brouillon" /> : undefined}
      pied={
        <button type="button" onClick={() => void creer()} disabled={enCours} className={`${classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}>
          {enCours ? "Création…" : "Créer l'avis"}
        </button>
      }
    >
      <p className="mb-6 text-sm text-sable">
        L&apos;avis sera créé <span className="text-ivoire">non publié</span> : vous le publierez ensuite. En attendant, votre saisie est gardée sur cet
        appareil.
      </p>
      {fiche.brouillonRestaure && (
        <p className="mb-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">Brouillon retrouvé sur cet appareil : vous reprenez où vous en étiez.</p>
      )}
      <FicheAvis valeur={fiche.valeur} modifier={fiche.modifier} erreurs={erreurs} liste={liste} />
    </Modale>
  );
}
