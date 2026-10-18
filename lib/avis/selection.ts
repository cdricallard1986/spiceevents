import type { Locale } from "@/i18n/routing";
import type { Categorie, Emplacement } from "./constantes";
import type { Avis, AvisAffiche } from "./types";

/**
 * Choix et mise en forme des avis pour les pages publiques (logique pure et
 * testée). Les pages ne choisissent plus leurs avis dans le code : chacun porte
 * ses emplacements (`accueil_grand`, `mariages`, `option:photobooth`…) et son
 * rang (`ordre`), réglés depuis le back office.
 */

/** Extrait court (citation) d'un texte : les phrases entières jusqu'à ~longueur caractères. */
export function extrait(texte: string, longueur = 220): string {
  if (texte.length <= longueur) return texte;
  const phrases = texte.match(/[^.!?…]+[.!?…]+/g) ?? [texte];
  let out = "";
  for (const p of phrases) {
    if ((out + p).length > longueur && out) break;
    out += p;
  }
  return out.trim();
}

/** Avis publiés, par `ordre` croissant (puis identifiant, pour un ordre stable). */
export function publies(liste: readonly Avis[]): Avis[] {
  return liste
    .filter((a) => a.publie)
    .sort((a, b) => a.ordre - b.ordre || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Avis d'une grille : les avis publiés qui portent l'emplacement, dans l'ordre. */
export function avisDeLEmplacement(liste: readonly Avis[], emplacement: Emplacement): Avis[] {
  return publies(liste).filter((a) => a.emplacements.includes(emplacement));
}

/** Grand avis (accueil, mariages, page d'option) : le premier avis publié qui porte l'emplacement. */
export function avisUnique(liste: readonly Avis[], emplacement: Emplacement): Avis | undefined {
  return avisDeLEmplacement(liste, emplacement)[0];
}

/** Avis publiés d'une catégorie (page Avis, page Événementiel), dans l'ordre. */
export function avisDeCategorie(liste: readonly Avis[], categorie: Categorie): Avis[] {
  return publies(liste).filter((a) => a.categorie === categorie);
}

/** Un avis dans une langue : texte, rôle et citation. */
export type AvisEnLangue = {
  id: string;
  auteurs: string;
  role?: string;
  texte: string;
  citation: string | null;
  /** Renseignée seulement si le texte n'est pas dans la langue demandée (anglais non traduit). */
  langue?: "fr";
};

/**
 * Mise en forme par langue. En anglais : le texte anglais, ou à défaut le
 * français — et dans ce cas, la citation française aussi (jamais une citation
 * d'une langue sur le texte d'une autre), avec `langue: "fr"`. Le rôle anglais,
 * à défaut le français.
 */
export function enLangue(avis: Avis, locale: Locale): AvisEnLangue {
  const role = (locale === "en" ? (avis.role_en ?? avis.role_fr) : avis.role_fr) ?? undefined;
  const base = { id: avis.id, auteurs: avis.auteurs, ...(role ? { role } : {}) };
  if (locale === "en" && avis.texte_en) return { ...base, texte: avis.texte_en, citation: avis.citation_en };
  return { ...base, texte: avis.texte_fr, citation: avis.citation_fr, ...(locale === "en" ? { langue: "fr" as const } : {}) };
}

/** Citation affichée : celle choisie dans le back office, sinon le début du texte. */
export function citationAffichee(avis: AvisEnLangue, longueurExtrait: number): string {
  return avis.citation ?? extrait(avis.texte, longueurExtrait);
}

function affiche(a: AvisEnLangue, texte: string): AvisAffiche {
  return { cle: a.id, auteurs: a.auteurs, ...(a.role ? { role: a.role } : {}), texte, ...(a.langue ? { langue: a.langue } : {}) };
}

/** Grille de citations (accueil, mariages, événementiel). */
export function grilleCitations(liste: readonly Avis[], locale: Locale, longueurExtrait = 260): AvisAffiche[] {
  return liste.map((a) => {
    const l = enLangue(a, locale);
    return affiche(l, citationAffichee(l, longueurExtrait));
  });
}

/** Grille des textes complets (page Avis). */
export function grilleTextes(liste: readonly Avis[], locale: Locale): AvisAffiche[] {
  return liste.map((a) => {
    const l = enLangue(a, locale);
    return affiche(l, l.texte);
  });
}

/** Grand avis sur photo : sa citation, ou rien si aucun avis ne porte l'emplacement. */
export function grandAvis(liste: readonly Avis[], emplacement: Emplacement, locale: Locale, longueurExtrait: number): AvisAffiche | undefined {
  const a = avisUnique(liste, emplacement);
  if (!a) return undefined;
  const l = enLangue(a, locale);
  return affiche(l, citationAffichee(l, longueurExtrait));
}
