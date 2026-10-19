"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useModalAutosave } from "@/hooks/useModalAutosave";
import {
  adressePublique,
  formulaireDepuisLigne,
  manquesPublication,
  slugPropose,
  type FormulaireEditeur,
  type LigneArticleAdmin,
  type ResultatArticle,
  type ResultatCopiePhoto,
  type ResultatSuppressionArticle,
} from "@/lib/journal/admin";
import { CATEGORIES, LIMITES_ARTICLES } from "@/lib/journal/constantes";
import { OUTILS_ENVOI_ARTICLE, type DemandeEnvoi, type OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import type { ErreursArticle } from "@/lib/journal/schema";
import { slugDepuisTitre } from "@/lib/journal/slug";
import type { Photo } from "@/lib/photos/types";
import { classesBouton } from "@/components/ui/Bouton";
import { Champ } from "./Champ";
import { CLASSES_AIDE, CLASSES_LIBELLE } from "./champs";
import { CLASSES_DANGER, ConfirmDialog } from "./ConfirmDialog";
import { CouvertureArticle } from "./CouvertureArticle";
import { PillArticle } from "./PillArticle";
import { PillStatut } from "./PillStatut";
import { useToasts } from "./Toasts";

// L'éditeur visuel (Tiptap, le plus gros morceau) n'est chargé que sur cette page, après le reste.
const EditeurTexte = dynamic(() => import("./EditeurTexte"), {
  ssr: false,
  loading: () => <p className="border border-ligne bg-nuit-2 px-4 py-6 text-sable sm:px-8">Chargement de l&apos;éditeur…</p>,
});

/** Server Actions (injectées pour pouvoir tester le composant). */
export type ActionsArticle = {
  enregistrer: (id: string, champs: FormulaireEditeur) => Promise<ResultatArticle>;
  publier: (id: string) => Promise<ResultatArticle>;
  retirer: (id: string) => Promise<ResultatArticle>;
  supprimer: (id: string) => Promise<ResultatSuppressionArticle>;
  creerUrlEnvoi: DemandeEnvoi;
  copierPhoto: (photoId: string) => Promise<ResultatCopiePhoto>;
};

const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";
const LISTE = "/admin/journal";

type Confirmation = "publier" | "retirer" | "supprimer" | "quitter" | null;

/** Toast d'erreur sans répétition (même règle que les autres fiches du back office). */
function useErreurs() {
  const { afficher } = useToasts();
  const [erreurs, setErreurs] = useState<ErreursArticle>({});
  const dernier = useRef("");
  return {
    erreurs,
    signaler(message: string, champs: ErreursArticle = {}) {
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

/**
 * Éditeur d'un article (page plein écran : un article est long). Même
 * mécanique que les modales du back office : enregistrement automatique
 * (`useModalAutosave`, mode `edition` — la ligne brouillon existe déjà),
 * pill de statut, enregistrement immédiat au départ de la page ;
 * avertissement seulement si la dernière sauvegarde a échoué. Publier,
 * retirer du site et supprimer passent par une confirmation.
 */
export function EditeurArticle({
  ligne: ligneInitiale,
  photos,
  actions,
  outils = OUTILS_ENVOI_ARTICLE,
}: {
  ligne: LigneArticleAdmin;
  photos: readonly Photo[];
  actions: ActionsArticle;
  outils?: OutilsEnvoiArticle;
}) {
  const id = ligneInitiale.id;
  const idChamps = useId();
  const champ = (nom: string) => `${idChamps}-${nom}`;
  const router = useRouter();
  const { afficher } = useToasts();
  const { erreurs, signaler, effacer } = useErreurs();
  // État en base (statut, adresse retenue…), mis à jour par chaque réponse du serveur.
  const [ligne, setLigne] = useState(ligneInitiale);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [enCours, setEnCours] = useState(false);
  // Valeur d'ouverture figée : les réponses du serveur ne réécrivent pas la saisie en cours.
  const [initiale] = useState(() => formulaireDepuisLigne(ligneInitiale));

  const fiche = useModalAutosave<FormulaireEditeur>({
    mode: "edition",
    cle: `article:${id}`,
    valeurInitiale: initiale,
    enregistrer: async (valeur) => {
      let r: ResultatArticle;
      try {
        r = await actions.enregistrer(id, valeur);
      } catch (e) {
        signaler(ERREUR_RESEAU);
        throw e;
      }
      if (!r.ok) {
        signaler(r.message, r.erreurs);
        throw new Error(r.message);
      }
      effacer();
      setLigne(r.article);
      return r;
    },
  });
  const v = fiche.valeur;
  const dejaPublie = ligne.publie_le !== null;
  const publie = ligne.statut === "publie";

  // Départ vers une autre application (téléphone) ou un autre onglet : on enregistre tout de suite.
  const enregistrerMaintenant = fiche.enregistrerMaintenant;
  useEffect(() => {
    const surVisibilite = () => {
      if (document.visibilityState === "hidden") void enregistrerMaintenant();
    };
    document.addEventListener("visibilitychange", surVisibilite);
    return () => document.removeEventListener("visibilitychange", surVisibilite);
  }, [enregistrerMaintenant]);

  function modifierTitre(titre: string) {
    fiche.modifier((p) => ({ ...p, titre, slug: p.slugAuto ? slugPropose(titre, p.slug) : p.slug }));
  }

  async function quitter() {
    if (await fiche.fermer()) router.push(LISTE);
    else setConfirmation("quitter");
  }

  /** Aperçu dans un nouvel onglet, après l'enregistrement de ce qui attend (sinon l'aperçu serait en retard). */
  async function apercu() {
    const fenetre = window.open("about:blank", "_blank");
    const ok = await fiche.enregistrerMaintenant();
    if (!ok) afficher("La dernière modification n'est pas enregistrée (pastille rouge) : l'aperçu montre la version précédente.", "erreur");
    const adresse = `/admin/journal/${id}/apercu`;
    if (fenetre) {
      fenetre.opener = null;
      fenetre.location.href = adresse;
    } else window.location.href = adresse;
  }

  async function changerStatut(action: "publier" | "retirer") {
    setEnCours(true);
    try {
      // D'abord ce qui attend : on publie l'article tel qu'il est à l'écran.
      if (!(await fiche.enregistrerMaintenant())) {
        afficher("L'article n'est pas enregistré (pastille rouge) : corrigez-le avant de le publier ou de le retirer du site.", "erreur");
        return;
      }
      const r = await (action === "publier" ? actions.publier(id) : actions.retirer(id));
      if (!r.ok) {
        signaler(r.message, r.erreurs);
        return;
      }
      effacer();
      setLigne(r.article);
      afficher(
        action === "publier"
          ? `Article publié : il apparaît sur le site (${adressePublique(r.article.slug)}) à la visite suivante.`
          : "Article retiré du site : il reste ici en brouillon.",
      );
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
      const r = await actions.supprimer(id);
      if (!r.ok) {
        afficher(r.message, "erreur");
        return;
      }
      fiche.oublierBrouillon();
      afficher("Brouillon supprimé définitivement.");
      router.push(LISTE);
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
    } finally {
      setEnCours(false);
      setConfirmation(null);
    }
  }

  const manques = manquesPublication(v);
  const adresseAffichee = v.slugAuto && ligne.slug.startsWith(v.slug) ? ligne.slug : v.slug;

  return (
    <>
      <Link
        href={LISTE}
        onClick={(e) => {
          e.preventDefault();
          void quitter();
        }}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
      >
        ← Tous les articles
      </Link>

      <div className="mt-6 flex flex-col gap-5 border-b border-ligne pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="surtitre mb-3">Journal</p>
          <h1 className={`font-display text-3xl leading-tight md:text-4xl ${v.titre.trim() ? "" : "italic text-sable"}`}>{v.titre.trim() || "Article sans titre"}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PillStatut statut={fiche.statut} onReessayer={() => void fiche.reessayer()} />
            <PillArticle statut={ligne.statut} dejaPublie={dejaPublie} />
            {publie && (
              <a href={adressePublique(ligne.slug)} target="_blank" rel="noopener" className="text-sm text-sable underline underline-offset-4 hover:text-or">
                Voir sur le site ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 lg:shrink-0 lg:flex-nowrap">
          <button type="button" onClick={() => void apercu()} className={classesBouton("contour")}>
            Aperçu
          </button>
          {publie ? (
            <button type="button" onClick={() => setConfirmation("retirer")} className={classesBouton("contour")}>
              Retirer du site
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmation("publier")} className={classesBouton("primaire")}>
              {dejaPublie ? "Republier" : "Publier"}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-sable">
        Chaque modification est enregistrée automatiquement{publie ? " ; l'article en ligne se met à jour à la visite suivante d'une page" : " ; l'article n'est pas sur le site tant qu'il n'est pas publié"}.
      </p>
      {fiche.brouillonRestaure && (
        <p className="mt-4 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Une saisie non enregistrée a été retrouvée sur cet appareil : elle est reprise et enregistrée.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <Champ id={champ("titre")} libelle="Titre" erreur={erreurs.titre} max={LIMITES_ARTICLES.titre} valeur={v.titre} className="sm:col-span-2">
            {(attributs) => <input {...attributs} type="text" value={v.titre} onChange={(e) => modifierTitre(e.target.value)} placeholder="Comment choisir l'ambiance de votre mariage ?" />}
          </Champ>
          <Champ id={champ("sous_titre")} libelle="Sous-titre" erreur={erreurs.sous_titre} max={LIMITES_ARTICLES.sousTitre} valeur={v.sous_titre} aide="Facultatif : affiché sous le titre." className="sm:col-span-2">
            {(attributs) => <textarea {...attributs} rows={2} value={v.sous_titre} onChange={(e) => fiche.modifier({ sous_titre: e.target.value })} />}
          </Champ>
          <Champ
            id={champ("description")}
            libelle="Description"
            erreur={erreurs.description}
            max={LIMITES_ARTICLES.description}
            valeur={v.description}
            aide="C'est le texte affiché par Google sous le titre de l'article (et lors d'un partage) : une ou deux phrases qui donnent envie de lire."
            className="sm:col-span-2"
          >
            {(attributs) => <textarea {...attributs} rows={3} value={v.description} onChange={(e) => fiche.modifier({ description: e.target.value })} />}
          </Champ>
          <Champ id={champ("categorie")} libelle="Catégorie" erreur={erreurs.categorie}>
            {(attributs) => (
              <select {...attributs} value={v.categorie} onChange={(e) => fiche.modifier({ categorie: e.target.value })}>
                <option value="">— Choisir —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </Champ>
          <Champ id={champ("date_publication")} libelle="Date de publication" erreur={erreurs.date_publication} aide="La date affichée sur l'article et qui le classe dans le journal.">
            {(attributs) => <input {...attributs} type="date" value={v.date_publication} onChange={(e) => fiche.modifier({ date_publication: e.target.value })} />}
          </Champ>

          <Adresse
            id={champ("slug")}
            valeur={v}
            adresseAffichee={adresseAffichee}
            dejaPublie={dejaPublie}
            erreur={erreurs.slug}
            modifier={fiche.modifier}
          />
        </div>

        <div className="border-t border-ligne pt-8">
          <CouvertureArticle
            idChamp={champ("couverture")}
            couverture={v.couverture}
            alt={v.couverture_alt}
            erreurs={{ couverture: erreurs.couverture, couverture_alt: erreurs.couverture_alt }}
            onChange={(maj) => fiche.modifier(maj)}
            photos={photos}
            creerUrlEnvoi={actions.creerUrlEnvoi}
            copierPhoto={actions.copierPhoto}
            outils={outils}
          />
        </div>

        <div className="border-t border-ligne pt-8">
          <p className={`${CLASSES_LIBELLE} mb-2`}>Texte de l&apos;article</p>
          <p className={`${CLASSES_AIDE} mb-4`}>
            Intertitres, gras, italique, listes, citations, liens et photos. Un texte collé depuis Word, Google Docs ou une page web garde sa mise en forme
            simple ; les images collées depuis un autre site ne sont pas reprises : ajoutez-les avec le bouton « Photo ».
          </p>
          <EditeurTexte
            // Une saisie reprise de cet appareil remplace le contenu d'ouverture : l'éditeur repart de celle-ci.
            key={fiche.brouillonRestaure ? "repris" : "ouverture"}
            contenuInitial={v.contenu}
            onChange={(contenu) => fiche.modifier({ contenu })}
            creerUrlEnvoi={actions.creerUrlEnvoi}
            outils={outils}
            erreur={erreurs.contenu}
            idErreur={champ("contenu-erreur")}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-ligne pt-8 sm:flex-row sm:items-center sm:justify-between">
          {dejaPublie ? (
            <p className="max-w-xl text-sm text-sable">
              Cet article a déjà été publié : il ne peut plus être supprimé (son adresse est connue de Google et des liens qui pointent vers lui).
              {publie ? " Pour qu'il n'apparaisse plus, retirez-le du site : il restera ici en brouillon." : " Il n'est plus sur le site et reste ici en brouillon."}
            </p>
          ) : (
            <button type="button" onClick={() => setConfirmation("supprimer")} className={`${CLASSES_DANGER} self-start`}>
              Supprimer le brouillon
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        ouverte={confirmation === "publier"}
        titre={manques.length ? "Pas encore prêt à publier" : dejaPublie ? "Republier l'article ?" : "Publier l'article ?"}
        message={
          manques.length ? (
            <>
              <p>Pour publier, il manque encore :</p>
              <ul className="mt-3 list-disc pl-5 text-ivoire">
                {manques.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              L&apos;article apparaîtra dans le journal à l&apos;adresse <span className="text-ivoire">{adressePublique(adresseAffichee)}</span> dès la visite
              suivante d&apos;une page.{" "}
              {!dejaPublie && <strong className="font-semibold text-ivoire">Cette adresse ne pourra plus changer ensuite.</strong>}
            </p>
          )
        }
        libelleConfirmer={manques.length ? "Compris" : dejaPublie ? "Republier" : "Publier"}
        enCours={enCours}
        onConfirmer={() => (manques.length ? setConfirmation(null) : void changerStatut("publier"))}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "retirer"}
        titre="Retirer l'article du site ?"
        message={
          <p>
            L&apos;article n&apos;apparaîtra plus dans le journal, et son adresse <span className="text-ivoire">{adressePublique(ligne.slug)}</span> renverra une
            page introuvable (les liens et Google qui pointent dessus tomberont sur une erreur). Il reste ici en brouillon : vous pourrez le republier à la même
            adresse.
          </p>
        }
        libelleConfirmer="Retirer du site"
        danger
        enCours={enCours}
        onConfirmer={() => void changerStatut("retirer")}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "supprimer"}
        titre="Supprimer le brouillon ?"
        message={
          <p>
            Le brouillon « {v.titre.trim() || "sans titre"} » sera supprimé.{" "}
            <strong className="font-semibold text-erreur">C&apos;est définitif : il ne pourra pas être récupéré.</strong>
          </p>
        }
        libelleConfirmer="Supprimer définitivement"
        danger
        enCours={enCours}
        onConfirmer={() => void supprimer()}
        onAnnuler={() => setConfirmation(null)}
      />
      <ConfirmDialog
        ouverte={confirmation === "quitter"}
        titre="Modification non enregistrée"
        message={<p>La dernière modification n&apos;a pas pu être enregistrée. Elle reste gardée sur cet appareil : vous la retrouverez en rouvrant cet article.</p>}
        libelleConfirmer="Quitter quand même"
        libelleAnnuler="Rester"
        danger
        onConfirmer={() => {
          setConfirmation(null);
          router.push(LISTE);
        }}
        onAnnuler={() => setConfirmation(null)}
      />
    </>
  );
}

/**
 * Adresse de l'article : proposée d'après le titre tant que l'article n'a
 * jamais été publié et qu'elle n'a pas été modifiée à la main ; verrouillée
 * après la première publication.
 */
function Adresse({
  id,
  valeur: v,
  adresseAffichee,
  dejaPublie,
  erreur,
  modifier,
}: {
  id: string;
  valeur: FormulaireEditeur;
  adresseAffichee: string;
  dejaPublie: boolean;
  erreur?: string;
  modifier: (maj: Partial<FormulaireEditeur> | ((p: FormulaireEditeur) => FormulaireEditeur)) => void;
}) {
  const lien = "text-sm text-or underline underline-offset-4 hover:text-or-clair";
  if (dejaPublie) {
    return (
      <div className="flex flex-col gap-2 sm:col-span-2">
        <p className={CLASSES_LIBELLE}>Adresse</p>
        <p className="break-all border border-ligne bg-nuit-3/60 px-3.5 py-3.5 text-ivoire">
          <span className="text-sable">spiceevents.fr</span>
          {adressePublique(adresseAffichee)}
        </p>
        <p className={CLASSES_AIDE}>Verrouillée : l&apos;adresse d&apos;un article publié ne change plus (Google et les liens vers l&apos;article pointent dessus).</p>
      </div>
    );
  }
  if (v.slugAuto) {
    return (
      <div className="flex flex-col gap-2 sm:col-span-2">
        <p className={CLASSES_LIBELLE}>Adresse</p>
        <p className={`break-all border bg-nuit-3/60 px-3.5 py-3.5 text-ivoire ${erreur ? "border-erreur" : "border-ligne"}`}>
          <span className="text-sable">spiceevents.fr</span>
          {adressePublique(adresseAffichee)}
        </p>
        <p className={CLASSES_AIDE}>
          Proposée d&apos;après le titre. Elle sera figée à la première publication.{" "}
          <button type="button" onClick={() => modifier({ slugAuto: false, slug: adresseAffichee })} className={lien}>
            Modifier l&apos;adresse
          </button>
        </p>
        {erreur && <p className="text-sm text-erreur">{erreur}</p>}
      </div>
    );
  }
  return (
    <Champ
      id={id}
      libelle="Adresse"
      erreur={erreur}
      max={LIMITES_ARTICLES.slug}
      valeur={v.slug}
      aide="Minuscules sans accents, chiffres et tirets (ex. se-marier-en-hiver). Elle sera figée à la première publication."
      className="sm:col-span-2"
    >
      {(attributs) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch">
            <span className="flex items-center border border-r-0 border-ligne bg-nuit-3/60 px-3 text-sm text-sable">/journal/</span>
            <input
              {...attributs}
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              value={v.slug}
              onChange={(e) => modifier({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              onBlur={(e) => {
                const propre = slugDepuisTitre(e.target.value);
                if (propre && propre !== v.slug) modifier({ slug: propre });
              }}
            />
          </div>
          {slugDepuisTitre(v.titre) && (
            <button type="button" onClick={() => modifier((p) => ({ ...p, slugAuto: true, slug: slugPropose(p.titre, p.slug) }))} className={`${lien} self-start`}>
              Reprendre l&apos;adresse proposée d&apos;après le titre
            </button>
          )}
        </div>
      )}
    </Champ>
  );
}
