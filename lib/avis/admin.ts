import type { ErreursAvis } from "./schema";
import { estEmplacementUnique, type Categorie, type Source } from "./constantes";
import type { Avis } from "./types";

/**
 * Logique pure de la liste des avis du back office (filtres, ordre,
 * emplacements uniques), testée et partagée avec les Server Actions.
 */

export type FiltresAvis = {
  categorie: Categorie | "toutes";
  statut: "tous" | "publies" | "non_publies";
  source: Source | "toutes";
  recherche: string;
};

export const FILTRES_PAR_DEFAUT: FiltresAvis = { categorie: "toutes", statut: "tous", source: "toutes", recherche: "" };

/** Minuscules sans accents : « clementine » trouve « Clémentine & Kévin ». */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Tri du back office : par `ordre` (celui du site), puis identifiant. */
export function trierAvis(liste: readonly Avis[]): Avis[] {
  return [...liste].sort((a, b) => a.ordre - b.ordre || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function filtrerAvis(liste: readonly Avis[], f: FiltresAvis): Avis[] {
  const recherche = normaliserRecherche(f.recherche);
  return trierAvis(liste).filter(
    (a) =>
      (f.categorie === "toutes" || a.categorie === f.categorie) &&
      (f.statut === "tous" || (f.statut === "publies") === a.publie) &&
      (f.source === "toutes" || a.source === f.source) &&
      (recherche === "" || normaliserRecherche(a.auteurs).includes(recherche)),
  );
}

/** Les filtres sont-ils ceux par défaut ? */
export function filtresActifs(f: FiltresAvis): boolean {
  return f.categorie !== "toutes" || f.statut !== "tous" || f.source !== "toutes" || f.recherche.trim() !== "";
}

/** Rang d'un nouvel avis : à la fin de la liste. */
export function ordreSuivant(ordres: readonly number[]): number {
  return ordres.length === 0 ? 10 : Math.max(...ordres) + 10;
}

/**
 * Nouveaux rangs après un échange entre deux avis. S'ils avaient le même rang
 * (lignes créées hors du back office), celui qui monte passe juste devant.
 */
export function rangsEchanges(a: { ordre: number }, b: { ordre: number }, aMonte: boolean): { a: number; b: number } {
  if (a.ordre !== b.ordre) return { a: b.ordre, b: a.ordre };
  return aMonte ? { a: b.ordre - 1, b: b.ordre } : { a: b.ordre + 1, b: b.ordre };
}

/** Emplacements uniques (grands avis, pages d'option) parmi une liste. */
export function emplacementsUniques(emplacements: readonly string[]): string[] {
  return emplacements.filter(estEmplacementUnique);
}

/** Un emplacement unique retiré d'un autre avis, parce qu'il vient d'être donné à celui-ci. */
export type Retrait = { id: string; auteurs: string; emplacement: string; emplacements: string[] };

/**
 * Pour que l'avis `id` soit seul sur ses emplacements uniques : ce qu'il faut
 * retirer aux autres avis (nouveaux emplacements de chacun).
 */
export function retraitsNecessaires(id: string, emplacements: readonly string[], autres: readonly Pick<Avis, "id" | "auteurs" | "emplacements">[]): Retrait[] {
  const uniques = emplacementsUniques(emplacements);
  const retraits: Retrait[] = [];
  for (const autre of autres) {
    if (autre.id === id) continue;
    const enTrop = autre.emplacements.filter((e) => uniques.includes(e));
    if (enTrop.length === 0) continue;
    const restants = autre.emplacements.filter((e) => !uniques.includes(e));
    for (const emplacement of enTrop) retraits.push({ id: autre.id, auteurs: autre.auteurs, emplacement, emplacements: restants });
  }
  return retraits;
}

/** L'avis qui occupe actuellement un emplacement unique (autre que `saufId`), pour l'indiquer à côté de la case. */
export function titulaire(liste: readonly Avis[], emplacement: string, saufId?: string): Avis | undefined {
  return trierAvis(liste).find((a) => a.id !== saufId && a.emplacements.includes(emplacement));
}

// --- Réponses des Server Actions (app/admin/(espace)/avis/actions.ts) -------

export type ResultatEchec = { ok: false; message: string; erreurs?: ErreursAvis };

/** Enregistrement ou création : l'avis tel qu'en base, et les emplacements retirés à d'autres avis. */
export type ResultatAvis =
  | { ok: true; avis: Avis; retraits: Retrait[]; /** Retrait aux autres avis impossible (l'avis, lui, est enregistré). */ avertissement?: string }
  | ResultatEchec;

export type ResultatPublication = { ok: true; avis: Avis } | ResultatEchec;
export type ResultatSuppression = { ok: true; id: string } | ResultatEchec;
export type ResultatEchange = { ok: true; rangs: { id: string; ordre: number }[] } | ResultatEchec;
