import { aujourdhuiParis } from "./admin";
import { tempsDeLecture, validerDocument } from "./document";
import type { Categorie } from "./constantes";
import type { Article, LigneArticle } from "./types";

/**
 * Article prêt pour l'aperçu du back office (/admin/journal/[id]/apercu) :
 * le même rendu que la page publique (`EnTeteArticle` + `ContenuArticle`),
 * y compris pour un brouillon incomplet. Ce qui manque est remplacé à
 * l'écran (titre, date, couverture provisoire…) et listé dans `manques`
 * pour le bandeau de l'aperçu. Un contenu invalide n'est jamais rendu.
 */

/** Couverture affichée tant que l'article n'en a pas (un fichier du site). */
export const COUVERTURE_PROVISOIRE = "/images/hero-premiere-danse.jpg";

export type Apercu = { ok: true; article: Article; manques: string[] } | { ok: false; message: string };

export function apercuDepuisLigne(l: LigneArticle, maintenant: Date = new Date()): Apercu {
  const v = validerDocument(l.contenu);
  if (!v.ok) return { ok: false, message: v.message };
  const manques: string[] = [];
  if (!l.titre.trim()) manques.push("titre");
  if (!l.description?.trim()) manques.push("description");
  if (!l.categorie) manques.push("catégorie");
  if (!l.date_publication) manques.push("date (celle du jour est affichée)");
  if (!l.couverture) manques.push("photo de couverture (une photo provisoire est affichée)");
  else if (!l.couverture_alt?.trim()) manques.push("texte alternatif de la couverture");
  return {
    ok: true,
    manques,
    article: {
      id: l.id,
      slug: l.slug,
      titre: l.titre.trim() || "Article sans titre",
      ...(l.sous_titre ? { sousTitre: l.sous_titre } : {}),
      description: l.description ?? "",
      // Affiché tel quel dans l'en-tête : « Sans catégorie » plutôt qu'une catégorie inventée.
      categorie: (l.categorie ?? "Sans catégorie") as Categorie,
      date: l.date_publication ?? aujourdhuiParis(maintenant),
      couverture: l.couverture ?? COUVERTURE_PROVISOIRE,
      couvertureAlt: l.couverture_alt ?? "",
      contenu: v.document,
      lecture: tempsDeLecture(v.document),
    },
  };
}
