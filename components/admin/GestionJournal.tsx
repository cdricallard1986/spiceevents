"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FILTRES_ARTICLES_PAR_DEFAUT,
  adressePublique,
  filtrerArticles,
  filtresArticlesActifs,
  type ArticleListe,
  type FiltresArticles,
  type ResultatCreationArticle,
} from "@/lib/journal/admin";
import { CATEGORIES, type Categorie } from "@/lib/journal/constantes";
import { classesBouton } from "@/components/ui/Bouton";
import { CLASSES_CHAMP, CLASSES_LIBELLE } from "./champs";
import { PillArticle } from "./PillArticle";
import { useToasts } from "./Toasts";

const ERREUR_RESEAU = "Le serveur ne répond pas (connexion perdue ou session expirée). Rechargez la page puis réessayez.";

const ONGLETS: { valeur: FiltresArticles["statut"]; libelle: string }[] = [
  { valeur: "brouillons", libelle: "Brouillons" },
  { valeur: "publies", libelle: "Publiés" },
  { valeur: "tous", libelle: "Tous" },
];

const CLASSES_ONGLET = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors";

function formaterDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Liste des articles du back office : brouillons en tête, puis publiés du
 * plus récent au plus ancien ; filtres par statut, catégorie, recherche dans
 * le titre. « Nouvel article » crée aussitôt un brouillon en base et ouvre
 * l'éditeur (/admin/journal/[id]).
 */
export function GestionJournal({ articles, creer }: { articles: ArticleListe[]; creer: () => Promise<ResultatCreationArticle> }) {
  const [filtres, setFiltres] = useState<FiltresArticles>(FILTRES_ARTICLES_PAR_DEFAUT);
  const [creation, setCreation] = useState(false);
  const { afficher } = useToasts();
  const router = useRouter();

  const visibles = useMemo(() => filtrerArticles(articles, filtres), [articles, filtres]);
  const nombres = {
    brouillons: articles.filter((a) => a.statut === "brouillon").length,
    publies: articles.filter((a) => a.statut === "publie").length,
    tous: articles.length,
  };

  function modifierFiltre<K extends keyof FiltresArticles>(cle: K, valeur: FiltresArticles[K]) {
    setFiltres((f) => ({ ...f, [cle]: valeur }));
  }

  async function nouvelArticle() {
    if (creation) return;
    setCreation(true);
    try {
      const r = await creer();
      if (!r.ok) {
        afficher(r.message, "erreur");
        setCreation(false);
        return;
      }
      router.push(`/admin/journal/${r.id}`);
    } catch {
      afficher(ERREUR_RESEAU, "erreur");
      setCreation(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 border border-ligne bg-nuit-2 p-5 sm:p-6">
        <ul className="flex flex-wrap gap-2" aria-label="Statut des articles">
          {ONGLETS.map((o) => {
            const actif = filtres.statut === o.valeur;
            return (
              <li key={o.valeur}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => modifierFiltre("statut", o.valeur)}
                  className={`${CLASSES_ONGLET} ${actif ? "border-or bg-or text-nuit" : "border-ligne text-sable hover:border-or hover:text-or"}`}
                >
                  {o.libelle}
                  <span className={`tabular-nums ${actif ? "text-nuit/70" : "text-sable/70"}`}>{nombres[o.valeur]}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <label htmlFor="journal-recherche" className={CLASSES_LIBELLE}>
              Rechercher (titre)
            </label>
            <input
              id="journal-recherche"
              type="search"
              value={filtres.recherche}
              onChange={(e) => modifierFiltre("recherche", e.target.value)}
              placeholder="Mariage, éclairage…"
              className={CLASSES_CHAMP}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="journal-categorie" className={CLASSES_LIBELLE}>
              Catégorie
            </label>
            <select
              id="journal-categorie"
              value={filtres.categorie}
              onChange={(e) => modifierFiltre("categorie", e.target.value as Categorie | "toutes")}
              className={CLASSES_CHAMP}
            >
              <option value="toutes">Toutes</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p role="status" className="text-sm text-sable">
            {filtresArticlesActifs(filtres)
              ? `${visibles.length} article${visibles.length > 1 ? "s" : ""} affiché${visibles.length > 1 ? "s" : ""} sur ${articles.length}`
              : `${articles.length} article${articles.length > 1 ? "s" : ""}`}{" "}
            · {nombres.publies} publié{nombres.publies > 1 ? "s" : ""}
            {filtresArticlesActifs(filtres) && (
              <button type="button" onClick={() => setFiltres(FILTRES_ARTICLES_PAR_DEFAUT)} className="ml-3 text-or underline underline-offset-4 hover:text-or-clair">
                Effacer les filtres
              </button>
            )}
          </p>
          <button type="button" onClick={() => void nouvelArticle()} disabled={creation} className={`${classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}>
            {creation ? "Création…" : "Nouvel article"}
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="mt-6 border border-ligne bg-nuit-2 px-5 py-8 text-center text-sable">
          {articles.length === 0 ? "Aucun article pour l'instant : écrivez le premier avec « Nouvel article »." : "Aucun article ne correspond à ces filtres."}
        </p>
      ) : (
        <ul className="mt-6 border border-ligne bg-nuit-2">
          {visibles.map((a) => (
            <LigneArticle key={a.id} article={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LigneArticle({ article: a }: { article: ArticleListe }) {
  const date = formaterDate(a.date_publication);
  const titre = a.titre.trim() || "Article sans titre";
  return (
    <li className={`flex flex-col gap-3 border-t border-ligne px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-6 sm:px-5 ${a.statut === "brouillon" ? "bg-nuit-3/60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={`/admin/journal/${a.id}`} className={`text-left font-display text-xl leading-tight hover:text-or ${a.titre.trim() ? "text-ivoire" : "italic text-sable"}`}>
            {titre}
          </Link>
          <PillArticle statut={a.statut} dejaPublie={a.publie_le !== null} />
        </div>
        <p className="mt-1 text-xs text-sable/80">
          {a.categorie ?? "Sans catégorie"}
          {date && ` · ${date}`}
          {a.statut === "publie" && ` · ${adressePublique(a.slug)}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2">
        {a.statut === "publie" && (
          <a
            href={adressePublique(a.slug)}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-sable hover:text-or"
          >
            Voir sur le site ↗
          </a>
        )}
        <Link
          href={`/admin/journal/${a.id}`}
          aria-label={`Modifier l'article « ${titre} »`}
          className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
        >
          Modifier →
        </Link>
      </div>
    </li>
  );
}
