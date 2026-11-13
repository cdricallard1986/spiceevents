"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useModalAutosave } from "@/hooks/useModalAutosave";
import { trierEquipe, type ResultatEchangeMembres, type ResultatMembre, type ResultatSuppressionMembre } from "@/lib/equipe/admin";
import { initiales, paragraphes, srcPhotoMembre } from "@/lib/equipe/affichage";
import { LIBELLES_GROUPE } from "@/lib/equipe/constantes";
import { FORMULAIRE_MEMBRE_VIDE, formulaireDepuisMembre, type ErreursMembre, type FormulaireMembre } from "@/lib/equipe/schema";
import type { GroupeEquipe, MembreEquipe } from "@/lib/equipe/types";
import { OUTILS_ENVOI_ARTICLE, type DemandeEnvoi, type OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { classesBouton } from "@/components/ui/Bouton";
import { CLASSES_PASTILLE } from "./champs";
import { CLASSES_DANGER, ConfirmDialog } from "./ConfirmDialog";
import { FicheMembre } from "./FicheMembre";
import { PillPublication } from "./GestionAvis";
import { Modale } from "./Modale";
import { PillStatut } from "./PillStatut";
import { useToasts } from "./Toasts";

/** Server Actions (injectées pour pouvoir tester le composant). */
export type ActionsEquipe = {
  enregistrer: (id: string, champs: FormulaireMembre) => Promise<ResultatMembre>;
  creer: (champs: FormulaireMembre) => Promise<ResultatMembre>;
  changerPublication: (entree: { id: string; publie: boolean }) => Promise<ResultatMembre>;
  supprimer: (id: string) => Promise<ResultatSuppressionMembre>;
  echanger: (entree: { id: string; avecId: string; sens: "monter" | "descendre" }) => Promise<ResultatEchangeMembres>;
  creerUrlEnvoi: DemandeEnvoi;
};

const AIDE_MISE_A_JOUR = "Chaque modification est enregistrée automatiquement ; la page Nos DJ se met à jour à la visite suivante.";
const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";

const TITRES_GROUPE: Record<GroupeEquipe, string> = { dj: "Les DJ", musicien: "Musiciens en live" };

type Ouverte = { type: "edition"; id: string } | { type: "creation" } | null;

/**
 * Équipe de la page Nos DJ : les DJ puis les musiciens, dans l'ordre de la
 * page (flèches), modale d'édition auto-enregistrée, création (non publiée).
 */
export function GestionEquipe({
  membresInitiaux,
  actions,
  outils = OUTILS_ENVOI_ARTICLE,
}: {
  membresInitiaux: MembreEquipe[];
  actions: ActionsEquipe;
  /** Préparation et envoi des photos (remplacés dans les tests). */
  outils?: OutilsEnvoiArticle;
}) {
  const [liste, setListe] = useState<MembreEquipe[]>(membresInitiaux);
  const [ouverte, setOuverte] = useState<Ouverte>(null);
  const [deplacement, setDeplacement] = useState<string | null>(null);
  const { afficher } = useToasts();

  const triee = trierEquipe(liste);
  const nbPublies = liste.filter((m) => m.publie).length;
  const membreOuvert = ouverte?.type === "edition" ? liste.find((m) => m.id === ouverte.id) : undefined;

  function integrer(membre: MembreEquipe) {
    setListe((l) => (l.some((m) => m.id === membre.id) ? l.map((m) => (m.id === membre.id ? membre : m)) : [...l, membre]));
  }

  async function deplacer(membre: MembreEquipe, sens: "monter" | "descendre") {
    const groupe = triee.filter((m) => m.groupe === membre.groupe);
    const i = groupe.findIndex((m) => m.id === membre.id);
    const voisin = groupe[sens === "monter" ? i - 1 : i + 1];
    if (!voisin || deplacement) return;
    setDeplacement(membre.id);
    try {
      const r = await actions.echanger({ id: membre.id, avecId: voisin.id, sens });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      setListe((l) => l.map((m) => ({ ...m, ordre: r.rangs.find((x) => x.id === m.id)?.ordre ?? m.ordre })));
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setDeplacement(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border border-ligne bg-nuit-2 p-5 sm:p-6">
        <p role="status" className="text-sm text-sable">
          {liste.length} membre{liste.length > 1 ? "s" : ""} · {nbPublies} publié{nbPublies > 1 ? "s" : ""} sur la page Nos DJ
        </p>
        <button type="button" onClick={() => setOuverte({ type: "creation" })} className={classesBouton("primaire")}>
          Nouveau DJ ou musicien
        </button>
      </div>

      <p className="mt-6 text-xs text-sable/80">
        Les flèches changent l&apos;ordre des cartes sur la page Nos DJ. Le fondateur (Cédric) a sa propre section, en haut de la page : il ne se gère
        pas ici.
      </p>

      {triee.length === 0 ? (
        <p className="mt-4 border border-ligne bg-nuit-2 px-5 py-8 text-center text-sable">
          Personne pour l&apos;instant : ajoutez le premier DJ avec « Nouveau DJ ou musicien ».
        </p>
      ) : (
        (["dj", "musicien"] as const).map((g) => {
          const membres = triee.filter((m) => m.groupe === g);
          if (membres.length === 0) return null;
          return (
            <section key={g} className="mt-8">
              <h2 className="mb-3 font-display text-2xl uppercase tracking-[0.04em] text-ivoire">{TITRES_GROUPE[g]}</h2>
              <ul className="border border-ligne bg-nuit-2">
                {membres.map((m, i) => (
                  <LigneMembre
                    key={m.id}
                    membre={m}
                    premier={i === 0}
                    dernier={i === membres.length - 1}
                    enDeplacement={deplacement !== null}
                    onOuvrir={() => setOuverte({ type: "edition", id: m.id })}
                    onDeplacer={(sens) => void deplacer(m, sens)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {membreOuvert && (
        <ModaleEdition
          key={membreOuvert.id}
          membre={membreOuvert}
          actions={actions}
          outils={outils}
          onMaj={integrer}
          onSupprime={(id) => {
            setListe((l) => l.filter((m) => m.id !== id));
            setOuverte(null);
          }}
          onFermer={() => setOuverte(null)}
        />
      )}
      {ouverte?.type === "creation" && (
        <ModaleCreation
          actions={actions}
          outils={outils}
          onCree={(m) => {
            integrer(m);
            // On enchaîne sur la fiche : relecture, puis publication.
            setOuverte({ type: "edition", id: m.id });
          }}
          onFermer={() => setOuverte(null)}
        />
      )}
    </div>
  );
}

/** Vignette de la liste : la photo telle que cadrée sur la page, ou le monogramme. */
function Vignette({ membre: m }: { membre: MembreEquipe }) {
  return (
    <span className="relative block aspect-[3/2] w-24 shrink-0 overflow-hidden border border-ligne bg-nuit-3 sm:w-36">
      {m.photo_chemin ? (
        <Image
          src={srcPhotoMembre(m.photo_chemin)}
          alt=""
          fill
          sizes="9rem"
          quality={70}
          className="object-cover"
          style={{ objectPosition: m.photo_cadrage }}
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-3xl text-or/30">
          {initiales(m.nom)}
        </span>
      )}
    </span>
  );
}

function LigneMembre({
  membre: m,
  premier,
  dernier,
  enDeplacement,
  onOuvrir,
  onDeplacer,
}: {
  membre: MembreEquipe;
  premier: boolean;
  dernier: boolean;
  enDeplacement: boolean;
  onOuvrir: () => void;
  onDeplacer: (sens: "monter" | "descendre") => void;
}) {
  const classesFleche =
    "flex size-10 items-center justify-center border border-ligne text-lg text-sable transition-colors hover:border-or hover:text-or disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ligne disabled:hover:text-sable";
  const manques = [!m.photo_chemin && "sans photo", !m.accroche_en && !m.presentation_en && "sans traduction anglaise"].filter(Boolean);
  return (
    <li className={`flex gap-4 border-t border-ligne px-4 py-4 first:border-t-0 sm:px-5 ${m.publie ? "" : "bg-nuit-3/60"}`}>
      <button type="button" onClick={onOuvrir} tabIndex={-1} aria-hidden="true" className="self-start">
        <Vignette membre={m} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onClick={onOuvrir} className="min-w-0 truncate text-left font-display text-xl leading-tight text-ivoire hover:text-or">
            {m.nom}
          </button>
          <PillPublication publie={m.publie} />
        </div>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-or">
          {m.role_fr}
          {m.alias ? <span className="ml-2 normal-case tracking-normal text-sable">· {m.alias}</span> : null}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-sable sm:line-clamp-1">{m.accroche_fr}</p>
        <p className="mt-1 text-xs text-sable/80">
          {paragraphes(m.presentation_fr).length} paragraphe{paragraphes(m.presentation_fr).length > 1 ? "s" : ""}
          {m.avis_texte_fr && " · avec un avis"}
          {m.lien_url && " · avec un lien"}
          {manques.length > 0 && ` · ${manques.join(", ")}`}
        </p>
        {m.styles_fr.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Styles">
            {m.styles_fr.map((s) => (
              <li key={s} className={`${CLASSES_PASTILLE} border-ligne text-sable`}>
                {s}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onOuvrir}
          aria-label={`Modifier la fiche de ${m.nom}`}
          className="mt-3 inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
        >
          Modifier →
        </button>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button type="button" onClick={() => onDeplacer("monter")} disabled={premier || enDeplacement} aria-label={`Monter ${m.nom}`} className={classesFleche}>
          ↑
        </button>
        <button type="button" onClick={() => onDeplacer("descendre")} disabled={dernier || enDeplacement} aria-label={`Descendre ${m.nom}`} className={classesFleche}>
          ↓
        </button>
      </div>
    </li>
  );
}

/** Toast d'erreur sans répétition : la même erreur, à chaque nouvel essai d'enregistrement, ne s'affiche qu'une fois. */
function useErreurs() {
  const { afficher } = useToasts();
  const [erreurs, setErreurs] = useState<ErreursMembre>({});
  const dernier = useRef("");
  return {
    erreurs,
    signaler(message: string, champs: ErreursMembre = {}) {
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
  membre,
  actions,
  outils,
  onMaj,
  onSupprime,
  onFermer,
}: {
  membre: MembreEquipe;
  actions: ActionsEquipe;
  outils: OutilsEnvoiArticle;
  onMaj: (membre: MembreEquipe) => void;
  onSupprime: (id: string) => void;
  onFermer: () => void;
}) {
  const { afficher } = useToasts();
  const { erreurs, signaler, effacer } = useErreurs();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [enCours, setEnCours] = useState(false);
  // Valeur d'ouverture figée : la liste se met à jour après chaque enregistrement, la fiche ouverte non.
  const [initiale] = useState(() => formulaireDepuisMembre(membre));

  const fiche = useModalAutosave<FormulaireMembre>({
    mode: "edition",
    cle: `equipe:${membre.id}`,
    valeurInitiale: initiale,
    enregistrer: async (valeur) => {
      let r: ResultatMembre;
      try {
        r = await actions.enregistrer(membre.id, valeur);
      } catch (e) {
        signaler(ERREUR_RESEAU);
        throw e;
      }
      if (!r.ok) {
        signaler(r.message, r.erreurs);
        throw new Error(r.message);
      }
      effacer();
      onMaj(r.membre);
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
      if (!(await fiche.enregistrerMaintenant())) {
        afficher("La fiche n'est pas enregistrée (pastille rouge) : corrigez-la avant de la publier ou de la retirer.", "erreur");
        return;
      }
      const r = await actions.changerPublication({ id: membre.id, publie });
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      onMaj(r.membre);
      afficher(publie ? `${membre.nom} est publié : sa carte apparaît sur la page Nos DJ à la visite suivante.` : `${membre.nom} est retiré de la page Nos DJ.`);
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
      const r = await actions.supprimer(membre.id);
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      fiche.oublierBrouillon();
      afficher(`Fiche de ${membre.nom} supprimée définitivement.`);
      onSupprime(membre.id);
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
        titre={fiche.valeur.nom.trim() || membre.nom}
        largeur="large"
        aside={
          <>
            <PillStatut statut={fiche.statut} onReessayer={() => void fiche.reessayer()} />
            <PillPublication publie={membre.publie} />
          </>
        }
        pied={
          <>
            <button type="button" onClick={() => setConfirmation("supprimer")} className={`${CLASSES_DANGER} sm:mr-auto`}>
              Supprimer
            </button>
            {membre.publie ? (
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
        <FicheMembre valeur={fiche.valeur} modifier={fiche.modifier} erreurs={erreurs} creerUrlEnvoi={actions.creerUrlEnvoi} outils={outils} />
      </Modale>

      <ConfirmDialog
        ouverte={confirmation === "publier"}
        titre="Publier sur la page Nos DJ ?"
        message={
          <p>
            La carte de <span className="text-ivoire">{membre.nom}</span> apparaîtra dans la section « {LIBELLES_GROUPE[membre.groupe]} » de la page Nos
            DJ dès la visite suivante.
          </p>
        }
        libelleConfirmer="Publier"
        enCours={enCours}
        onConfirmer={() => void publier(true)}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "retirer"}
        titre="Retirer de la page Nos DJ ?"
        message={
          <p>
            La carte de <span className="text-ivoire">{membre.nom}</span> n&apos;apparaîtra plus sur le site. La fiche reste ici, non publiée : vous pourrez
            la republier.
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
            La fiche de <span className="text-ivoire">{membre.nom}</span> sera supprimée du site et du back office.{" "}
            <strong className="font-semibold text-erreur">C&apos;est définitif : elle ne pourra pas être récupérée.</strong> Pour la cacher sans la
            perdre (DJ qui ne travaille plus avec vous), utilisez plutôt « Retirer du site ».
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
        message={<p>La dernière modification n&apos;a pas pu être enregistrée. Elle reste gardée sur cet appareil : vous la retrouverez en rouvrant cette fiche.</p>}
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
  actions,
  outils,
  onCree,
  onFermer,
}: {
  actions: ActionsEquipe;
  outils: OutilsEnvoiArticle;
  onCree: (membre: MembreEquipe) => void;
  onFermer: () => void;
}) {
  const { afficher } = useToasts();
  const { erreurs, signaler, effacer } = useErreurs();
  const [enCours, setEnCours] = useState(false);
  const fiche = useModalAutosave<FormulaireMembre>({ mode: "creation-locale", cle: "equipe:nouveau", valeurInitiale: FORMULAIRE_MEMBRE_VIDE });

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
      afficher(`Fiche de ${r.membre.nom} créée, non publiée : relisez-la puis publiez-la.`);
      onCree(r.membre);
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
      titre="Nouveau DJ ou musicien"
      largeur="large"
      aside={fiche.statut === "brouillon" ? <PillStatut statut="brouillon" /> : undefined}
      pied={
        <button type="button" onClick={() => void creer()} disabled={enCours} className={`${classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}>
          {enCours ? "Création…" : "Créer la fiche"}
        </button>
      }
    >
      <p className="mb-6 text-sm text-sable">
        La fiche sera créée <span className="text-ivoire">non publiée</span> : vous la publierez ensuite. En attendant, votre saisie est gardée sur cet
        appareil. Rappel : le nom de famille s&apos;écrit avec sa seule initiale (« Kevin R. »).
      </p>
      {fiche.brouillonRestaure && (
        <p className="mb-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">Brouillon retrouvé sur cet appareil : vous reprenez où vous en étiez.</p>
      )}
      <FicheMembre valeur={fiche.valeur} modifier={fiche.modifier} erreurs={erreurs} creerUrlEnvoi={actions.creerUrlEnvoi} outils={outils} />
    </Modale>
  );
}
