import { estCategorie, type Categorie } from "./constantes";
import { tempsDeLecture, validerDocument } from "./document";
import type { Article, LigneArticle } from "./types";

/**
 * Articles du journal (français seulement) pour les pages publiques : mise en
 * forme d'une ligne de la table `articles` et outils de présentation. Les
 * lignes viennent de Supabase ou, sans Supabase, des fichiers MDX convertis
 * (voir `lecture.ts`).
 */

/**
 * Ligne publiée → article des pages. Un article publié est complet (contrainte
 * de la table) et son contenu doit passer le validateur du document : sinon
 * l'erreur nomme l'article et la génération de la page échoue — on ne publie
 * jamais un contenu que le rendu ne connaît pas.
 */
export function articleDepuisLigne(l: LigneArticle): Article {
  const manque = (champ: string) => new Error(`[articles] Article « ${l.slug} » publié sans ${champ}.`);
  if (!l.description) throw manque("description");
  if (!l.categorie || !estCategorie(l.categorie)) throw manque("catégorie connue");
  if (!l.date_publication) throw manque("date de publication");
  if (!l.couverture || !l.couverture_alt) throw manque("couverture");
  const v = validerDocument(l.contenu);
  if (!v.ok) throw new Error(`[articles] Article « ${l.slug} » : ${v.message}`);
  return {
    id: l.id,
    slug: l.slug,
    titre: l.titre,
    ...(l.sous_titre ? { sousTitre: l.sous_titre } : {}),
    description: l.description,
    categorie: l.categorie,
    date: l.date_publication,
    couverture: l.couverture,
    couvertureAlt: l.couverture_alt,
    contenu: v.document,
    lecture: tempsDeLecture(v.document),
  };
}

/** Du plus récent au plus ancien ; à date égale, ordre alphabétique du titre. */
export function trierParDate<T extends { date: string; titre: string }>(liste: T[]): T[] {
  return [...liste].sort((a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre, "fr"));
}

/** Ancre d'une catégorie dans la page du journal : « Musique & ambiance » → `musique-ambiance`. */
export function ancreCategorie(categorie: Categorie): string {
  return categorie
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** « 2026-02-03 » → « 3 février 2026 ». */
export function formaterDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** Les `nombre` articles les plus récents, éventuellement limités à certaines catégories. */
export function derniersArticles<T extends { categorie: string; date: string; titre: string }>(
  tous: readonly T[],
  categories?: readonly string[],
  nombre = 5,
): T[] {
  return trierParDate(tous.filter((a) => !categories || categories.includes(a.categorie))).slice(0, nombre);
}

/** Articles liés : même catégorie d'abord (les plus récents), complétés par les plus récents. */
export function articlesLies<T extends { slug: string; categorie: string; date: string; titre: string }>(
  tous: T[],
  courant: T,
  nombre = 3,
): T[] {
  const autres = trierParDate(tous.filter((a) => a.slug !== courant.slug));
  const memeCategorie = autres.filter((a) => a.categorie === courant.categorie);
  const reste = autres.filter((a) => a.categorie !== courant.categorie);
  return [...memeCategorie, ...reste].slice(0, nombre);
}
