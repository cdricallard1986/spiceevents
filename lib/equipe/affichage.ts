import type { Locale } from "@/i18n/routing";
import { urlPublique } from "@/lib/photos/constantes";
import type { PhotoAffichee } from "@/lib/photos/types";
import { typographier } from "@/lib/typographie";
import type { GroupeEquipe, MembreEquipe } from "./types";

/**
 * Carte d'un membre sur la page Nos DJ, dans une langue : projection en liste
 * blanche (chaque champ affiché est recopié explicitement, rien d'autre ne
 * sort de la base). Champ anglais vide : le texte français.
 */
export type CarteEquipe = {
  id: string;
  groupe: GroupeEquipe;
  nom: string;
  alias?: string;
  role: string;
  styles: string[];
  accroche: string;
  paragraphes: string[];
  avis?: { texte: string; auteur: string };
  lieux?: string;
  lien?: { libelle: string; href: string };
  photo?: PhotoAffichee;
  cadrage?: string;
};

/** Paragraphes d'une présentation (séparés par une ligne vide). */
export function paragraphes(texte: string): string[] {
  return texte
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** Adresse d'une photo de membre : fichier du site tel quel, sinon l'URL publique du bucket. */
export function srcPhotoMembre(chemin: string): string {
  return chemin.startsWith("/") ? chemin : urlPublique(chemin);
}

export function carteEquipe(membre: MembreEquipe, locale: Locale): CarteEquipe {
  // Textes saisis dans le back office : typographie française (espaces fines insécables).
  const m = typographier(membre);
  const en = locale === "en";
  const choisir = (fr: string | null, anglais: string | null) => (en && anglais ? anglais : fr);
  const role = choisir(m.role_fr, m.role_en) ?? m.role_fr;
  const styles = en && m.styles_en.length > 0 ? m.styles_en : m.styles_fr;
  const avisTexte = choisir(m.avis_texte_fr, m.avis_texte_en);
  const avisAuteur = choisir(m.avis_auteur_fr, m.avis_auteur_en);
  const lieux = choisir(m.lieux_fr, m.lieux_en);
  const lienLibelle = choisir(m.lien_libelle_fr, m.lien_libelle_en);
  const carte: CarteEquipe = {
    id: m.id,
    groupe: m.groupe,
    nom: m.nom,
    role,
    styles: [...styles],
    accroche: choisir(m.accroche_fr, m.accroche_en) ?? m.accroche_fr,
    paragraphes: paragraphes(choisir(m.presentation_fr, m.presentation_en) ?? m.presentation_fr),
  };
  if (m.alias) carte.alias = m.alias;
  if (avisTexte && avisAuteur) carte.avis = { texte: avisTexte, auteur: avisAuteur };
  if (lieux) carte.lieux = lieux;
  if (m.lien_url && /^https:\/\//.test(m.lien_url) && lienLibelle) carte.lien = { libelle: lienLibelle, href: m.lien_url };
  if (m.photo_chemin && m.photo_largeur && m.photo_hauteur) {
    carte.photo = {
      src: srcPhotoMembre(m.photo_chemin),
      width: m.photo_largeur,
      height: m.photo_hauteur,
      alt: en ? `${m.nom}, ${role} of the Spice Events team` : `${m.nom}, ${role} de l'équipe Spice Events`,
    };
    carte.cadrage = m.photo_cadrage;
  }
  return carte;
}

/** Initiales d'un nom, pour le monogramme sans photo (« David G. » → « DG », « DJ Pan's » → « P »). */
export function initiales(nom: string): string {
  const mots = nom.replace(/^DJ\s+/i, "").split(/\s+/).filter(Boolean);
  return mots.map((m) => m[0]).join("").slice(0, 2).toUpperCase();
}
