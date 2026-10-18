"use client";

import { useMemo, useRef, useState } from "react";
import { useModalAutosave } from "@/hooks/useModalAutosave";
import { LIBELLES_TYPE } from "@/lib/contact/constantes";
import {
  FILTRES_PAR_DEFAUT,
  FILTRES_STATUT,
  appliquerSuivi,
  compterParStatut,
  filtrerDemandes,
  filtresActifs,
  formaterDateEvenement,
  formaterInvites,
  formaterReceptionCourte,
  paginer,
  sansEmail,
  type FiltresDemandes,
  type ResultatSuivi,
} from "@/lib/demandes/admin";
import { COULEURS_STATUT, LIBELLES_FILTRE, LIBELLES_STATUT, type StatutDemande } from "@/lib/demandes/constantes";
import type { FormulaireSuivi } from "@/lib/demandes/schema";
import type { Demande, SuiviDemande } from "@/lib/demandes/types";
import { CLASSES_CHAMP, CLASSES_LIBELLE } from "./champs";
import { ConfirmDialog } from "./ConfirmDialog";
import { FicheDemande } from "./FicheDemande";
import { Modale } from "./Modale";
import { PillStatut } from "./PillStatut";
import { useToasts } from "./Toasts";

/** Server Action (injectée pour pouvoir tester le composant). */
export type ActionsDemandes = {
  enregistrer: (entree: { id: string } & FormulaireSuivi) => Promise<ResultatSuivi>;
};

const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";
const CLASSES_PASTILLE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs tracking-[0.02em]";
/** Colonnes de la liste sur grand écran (en dessous : une carte par demande). */
const COLONNES = "lg:grid lg:grid-cols-[7.5rem_minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1fr)_5.5rem_8rem] lg:items-baseline lg:gap-x-4";
export const AVERTISSEMENT_EMAIL = "Email non reçu — à traiter à la main";

/** Pastille colorée du statut commercial d'une demande. */
export function PastilleStatutDemande({ statut }: { statut: StatutDemande }) {
  return <span className={`${CLASSES_PASTILLE} ${COULEURS_STATUT[statut]}`}>{LIBELLES_STATUT[statut]}</span>;
}

/** Nom affiché d'une demande. */
export function nomComplet(d: Pick<Demande, "prenoms" | "nom">): string {
  return `${d.prenoms} ${d.nom}`.trim();
}

/**
 * Liste des demandes de contact du back office : filtres par statut (avec
 * compteurs), recherche, pagination, avertissement si l'email de notification
 * n'est pas parti, et fiche en modale auto-enregistrée (statut, note interne).
 */
export function GestionDemandes({ demandesInitiales, actions }: { demandesInitiales: Demande[]; actions: ActionsDemandes }) {
  const [liste, setListe] = useState<Demande[]>(demandesInitiales);
  const [filtres, setFiltres] = useState<FiltresDemandes>(FILTRES_PAR_DEFAUT);
  const [page, setPage] = useState(1);
  const [ouverte, setOuverte] = useState<string | null>(null);

  const visibles = useMemo(() => filtrerDemandes(liste, filtres), [liste, filtres]);
  const compteurs = useMemo(() => compterParStatut(liste, filtres.recherche), [liste, filtres.recherche]);
  const pagination = paginer(visibles, page);
  const nbSansEmail = sansEmail(liste).length;
  const demandeOuverte = ouverte ? liste.find((d) => d.id === ouverte) : undefined;

  function modifierFiltres(maj: Partial<FiltresDemandes>) {
    setFiltres((f) => ({ ...f, ...maj }));
    setPage(1);
  }

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-col gap-6 border border-ligne bg-nuit-2 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="demandes-recherche" className={CLASSES_LIBELLE}>
            Rechercher (nom, prénoms, email, lieu)
          </label>
          <input
            id="demandes-recherche"
            type="search"
            value={filtres.recherche}
            onChange={(e) => modifierFiltres({ recherche: e.target.value })}
            placeholder="Martin, juliette@…, Chantilly…"
            className={CLASSES_CHAMP}
          />
        </div>
        <div>
          <p id="demandes-filtre-statut" className={`${CLASSES_LIBELLE} mb-3`}>
            Statut
          </p>
          <ul className="flex flex-wrap gap-2" aria-labelledby="demandes-filtre-statut">
            {FILTRES_STATUT.map((s) => {
              const actif = filtres.statut === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={actif}
                    onClick={() => modifierFiltres({ statut: s })}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                      actif ? "border-or bg-or text-nuit" : "border-ligne text-sable hover:border-or hover:text-or"
                    }`}
                  >
                    {LIBELLES_FILTRE[s]}{" "}
                    <span className={`tabular-nums ${actif ? "text-nuit/70" : "text-sable/70"}`}>{compteurs[s]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <p role="status" className="text-sm text-sable">
          {filtresActifs(filtres)
            ? `${visibles.length} demande${visibles.length > 1 ? "s" : ""} affichée${visibles.length > 1 ? "s" : ""} sur ${liste.length}`
            : `${liste.length} demande${liste.length > 1 ? "s" : ""}`}
          {nbSansEmail > 0 && (
            <span className="text-erreur">
              {" "}
              · {nbSansEmail} sans email reçu
            </span>
          )}
          {filtresActifs(filtres) && (
            <button type="button" onClick={() => modifierFiltres(FILTRES_PAR_DEFAUT)} className="ml-3 text-or underline underline-offset-4 hover:text-or-clair">
              Effacer les filtres
            </button>
          )}
        </p>
      </div>

      {/* Liste */}
      {visibles.length === 0 ? (
        <p className="mt-6 border border-ligne bg-nuit-2 px-5 py-8 text-center text-sable">
          {liste.length === 0 ? "Aucune demande reçue pour l'instant." : "Aucune demande ne correspond à ces filtres."}
        </p>
      ) : (
        <div className="mt-6 lg:border lg:border-ligne lg:bg-nuit-2">
          <div aria-hidden="true" className={`hidden border-b border-ligne px-5 py-3 ${COLONNES} ${CLASSES_LIBELLE}`}>
            <span>Reçue le</span>
            <span>Client</span>
            <span>Événement</span>
            <span>Lieu</span>
            <span>Invités</span>
            <span>Statut</span>
          </div>
          <ul className="flex flex-col gap-3 lg:gap-0">
            {pagination.elements.map((d) => (
              <LigneDemande key={d.id} demande={d} onOuvrir={() => setOuverte(d.id)} />
            ))}
          </ul>
        </div>
      )}

      {pagination.pages > 1 && (
        <nav aria-label="Pages de la liste" className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Plus récentes
          </button>
          <p className="text-sm text-sable">
            Page {pagination.page} sur {pagination.pages}
          </p>
          <button
            type="button"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair disabled:cursor-not-allowed disabled:opacity-30"
          >
            Plus anciennes →
          </button>
        </nav>
      )}

      {demandeOuverte && (
        <ModaleDemande
          key={demandeOuverte.id}
          demande={demandeOuverte}
          actions={actions}
          onMaj={(suivi) => setListe((l) => appliquerSuivi(l, suivi))}
          onFermer={() => setOuverte(null)}
        />
      )}
    </div>
  );
}

function LigneDemande({ demande: d, onOuvrir }: { demande: Demande; onOuvrir: () => void }) {
  const nom = nomComplet(d);
  const dateEvenement = formaterDateEvenement(d.date_evenement, false);
  const invites = formaterInvites(d.invites);
  return (
    <li
      onClick={onOuvrir}
      className={`cursor-pointer border border-ligne bg-nuit-2 px-4 py-4 transition-colors hover:bg-nuit-3/60 sm:px-5 lg:border-0 lg:border-t lg:bg-transparent lg:first:border-t-0 ${COLONNES} ${
        d.statut === "nouvelle" ? "lg:bg-nuit-3/40" : ""
      }`}
    >
      <p className="text-xs text-sable/80 lg:text-sm lg:text-sable">
        <span className="lg:hidden">Reçue le </span>
        {formaterReceptionCourte(d.created_at)}
      </p>
      <div className="mt-1 min-w-0 lg:mt-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOuvrir();
            }}
            aria-label={`Ouvrir la demande de ${nom}`}
            className="text-left font-display text-xl leading-tight text-ivoire hover:text-or"
          >
            {nom}
          </button>
          <span className="lg:hidden">
            <PastilleStatutDemande statut={d.statut} />
          </span>
        </div>
        <p className="mt-1 text-sm text-sable">{LIBELLES_TYPE.fr[d.type_evenement]}</p>
      </div>
      <p className="mt-1 text-sm text-sable lg:mt-0">
        {dateEvenement ? (
          <>
            <span className="lg:hidden">Le </span>
            {dateEvenement}
          </>
        ) : (
          <span className="text-sable/60">Date non précisée</span>
        )}
      </p>
      <p className="mt-1 text-sm text-sable lg:mt-0">{d.lieu ? d.lieu : <span className="text-sable/60 max-lg:hidden">—</span>}</p>
      <p className="mt-1 text-sm text-sable lg:mt-0">{invites ?? <span className="text-sable/60 max-lg:hidden">—</span>}</p>
      <p className="hidden lg:block">
        <PastilleStatutDemande statut={d.statut} />
      </p>
      {!d.email_envoye && (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-erreur lg:col-span-6 lg:mt-2">
          <span aria-hidden="true">⚠</span>
          {AVERTISSEMENT_EMAIL}
        </p>
      )}
    </li>
  );
}

/** Toast d'erreur sans répétition : la même erreur, à chaque nouvel essai d'enregistrement, ne s'affiche qu'une fois. */
function useErreur() {
  const { afficher } = useToasts();
  const dernier = useRef("");
  return {
    signaler(message: string) {
      if (message !== dernier.current) afficher(message, "erreur");
      dernier.current = message;
    },
    effacer() {
      dernier.current = "";
    },
  };
}

function ModaleDemande({
  demande,
  actions,
  onMaj,
  onFermer,
}: {
  demande: Demande;
  actions: ActionsDemandes;
  onMaj: (suivi: SuiviDemande) => void;
  onFermer: () => void;
}) {
  const { signaler, effacer } = useErreur();
  const [confirmerFermeture, setConfirmerFermeture] = useState(false);
  // Valeur d'ouverture figée : la liste se met à jour après chaque enregistrement, la fiche ouverte non.
  const [initiale] = useState<FormulaireSuivi>(() => ({ statut: demande.statut, note_interne: demande.note_interne ?? "" }));

  // Le miroir localStorage du hook ne contient que { statut, note_interne }
  // (aucune coordonnée), et il est effacé dès que l'enregistrement réussit.
  const fiche = useModalAutosave<FormulaireSuivi>({
    mode: "edition",
    cle: `demande:${demande.id}`,
    valeurInitiale: initiale,
    enregistrer: async (valeur) => {
      let r: ResultatSuivi;
      try {
        r = await actions.enregistrer({ id: demande.id, ...valeur });
      } catch (e) {
        signaler(ERREUR_RESEAU);
        throw e;
      }
      if (!r.ok) {
        signaler(r.message);
        throw new Error(r.message);
      }
      effacer();
      onMaj(r.suivi);
      return r;
    },
  });

  async function fermer() {
    if (await fiche.fermer()) onFermer();
    else setConfirmerFermeture(true);
  }

  return (
    <>
      <Modale
        ouverte
        onFermer={() => void fermer()}
        titre={nomComplet(demande)}
        largeur="large"
        aside={
          <>
            <PillStatut statut={fiche.statut} onReessayer={() => void fiche.reessayer()} />
            <PastilleStatutDemande statut={fiche.valeur.statut} />
          </>
        }
      >
        {fiche.brouillonRestaure && (
          <p className="mb-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            Une saisie non enregistrée a été retrouvée sur cet appareil : elle est reprise et enregistrée.
          </p>
        )}
        <FicheDemande demande={demande} valeur={fiche.valeur} modifier={fiche.modifier} />
      </Modale>

      <ConfirmDialog
        ouverte={confirmerFermeture}
        titre="Modification non enregistrée"
        message={
          <p>
            La dernière modification n&apos;a pas pu être enregistrée. Elle reste gardée sur cet appareil : vous la retrouverez en rouvrant cette
            demande.
          </p>
        }
        libelleConfirmer="Fermer quand même"
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
