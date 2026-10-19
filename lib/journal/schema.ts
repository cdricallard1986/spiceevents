import { z } from "zod";
import { CATEGORIES, LIMITES_ARTICLES, estCheminImage, longueur, type Categorie } from "./constantes";
import { validerDocument, type DocumentArticle } from "./document";
import { estSlugValide } from "./slug";
import type { LigneArticle } from "./types";

/**
 * Validation des champs d'un article saisis dans le back office (Server
 * Actions de l'éditeur), alignée sur les contraintes de la table `articles`
 * (migration 0008) : adresse, longueurs, catégorie, date, couverture,
 * document de l'éditeur. La sécurité ne dépend jamais du formulaire : tout est
 * revérifié ici, puis par la base.
 *
 * Deux niveaux, comme la table :
 * - `validerChampsArticle` : ce qu'un brouillon peut contenir (tout est
 *   facultatif, sauf l'adresse) — l'enregistrement automatique ;
 * - `verifierPublication` : en plus, ce qu'exige un article publié
 *   (contrainte `articles_publie_complet` : titre, description, catégorie,
 *   date, couverture et son texte alternatif).
 */

/** Le formulaire de l'éditeur : des chaînes (vide = rien) et le document de l'éditeur. */
export type FormulaireArticle = {
  slug: string;
  titre: string;
  sous_titre: string;
  description: string;
  /** Une catégorie, ou vide. */
  categorie: string;
  /** AAAA-MM-JJ, ou vide. */
  date_publication: string;
  /** `/journal/…` ou `journal/…`, ou vide. */
  couverture: string;
  couverture_alt: string;
  contenu: unknown;
};

export type ChampArticle = keyof FormulaireArticle;

/** Ce qui est écrit en base (colonnes modifiables par l'éditeur). */
export type ChampsArticle = Pick<
  LigneArticle,
  "slug" | "titre" | "sous_titre" | "description" | "categorie" | "date_publication" | "couverture" | "couverture_alt"
> & { contenu: DocumentArticle };

export type ErreursArticle = Partial<Record<ChampArticle, string>>;

export const FORMULAIRE_VIDE: Omit<FormulaireArticle, "slug"> = {
  titre: "",
  sous_titre: "",
  description: "",
  categorie: "",
  date_publication: "",
  couverture: "",
  couverture_alt: "",
  contenu: { type: "doc", content: [] },
};

const maximum = (max: number) => (v: string) => longueur(v) <= max;

/** Texte : espaces retirés aux extrémités, `max` caractères au plus ; null → "" (puis `versNull` pour les colonnes facultatives). */
function texte(max: number, trop: string) {
  return z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine(maximum(max), trop);
}

const versNull = (v: string) => (v === "" ? null : v);

export function estDateValide(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export const schemaChampsArticle = z.object({
  slug: z
    .string("Indiquez l'adresse de l'article.")
    .trim()
    .min(1, "Indiquez l'adresse de l'article.")
    .refine((v) => v.length <= LIMITES_ARTICLES.slug, `Adresse : ${LIMITES_ARTICLES.slug} caractères au maximum.`)
    .refine(estSlugValide, "Adresse : minuscules sans accents, chiffres et tirets seulement (ex. se-marier-en-hiver)."),
  titre: texte(LIMITES_ARTICLES.titre, `Titre : ${LIMITES_ARTICLES.titre} caractères au maximum.`),
  sous_titre: texte(LIMITES_ARTICLES.sousTitre, `Sous-titre : ${LIMITES_ARTICLES.sousTitre} caractères au maximum.`).transform(versNull),
  description: texte(LIMITES_ARTICLES.description, `Description : ${LIMITES_ARTICLES.description} caractères au maximum (résultat Google).`).transform(versNull),
  categorie: z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine((v) => v === "" || (CATEGORIES as readonly string[]).includes(v), "Catégorie inconnue.")
    .transform((v) => (v === "" ? null : (v as Categorie))),
  date_publication: z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine((v) => v === "" || estDateValide(v), "Date invalide.")
    .transform(versNull),
  couverture: z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine((v) => v === "" || estCheminImage(v), "Couverture : photo du site (/journal/…) ou du stockage (journal/…) seulement.")
    .transform(versNull),
  couverture_alt: texte(LIMITES_ARTICLES.couvertureAlt, `Texte alternatif de la couverture : ${LIMITES_ARTICLES.couvertureAlt} caractères au maximum.`).transform(versNull),
  contenu: z.unknown().transform((v, ctx) => {
    const r = validerDocument(v);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: r.message });
      return z.NEVER;
    }
    return r.document;
  }),
});

export type ValidationArticle = { ok: true; champs: ChampsArticle } | { ok: false; erreurs: ErreursArticle };

const CHAMPS: readonly ChampArticle[] = ["slug", "titre", "sous_titre", "description", "categorie", "date_publication", "couverture", "couverture_alt", "contenu"];

/** Valide les champs d'un brouillon ; en erreur, le premier message de chaque champ. */
export function validerChampsArticle(brut: unknown): ValidationArticle {
  const r = schemaChampsArticle.safeParse(brut);
  if (r.success) return { ok: true, champs: r.data };
  const erreurs: ErreursArticle = {};
  for (const probleme of r.error.issues) {
    const champ = probleme.path[0];
    if (typeof champ === "string" && (CHAMPS as readonly string[]).includes(champ)) {
      const c = champ as ChampArticle;
      if (!erreurs[c]) erreurs[c] = probleme.message;
    }
  }
  if (Object.keys(erreurs).length === 0) erreurs.titre = "Article invalide : rechargez la page puis réessayez.";
  return { ok: false, erreurs };
}

/**
 * Ce qui manque pour publier (contrainte `articles_publie_complet`) ; vide :
 * l'article peut être publié. Les messages sont ceux de la fiche de l'éditeur.
 */
export function verifierPublication(c: ChampsArticle): ErreursArticle {
  const erreurs: ErreursArticle = {};
  if (!c.titre) erreurs.titre = "Donnez un titre à l'article avant de le publier.";
  if (!c.description) erreurs.description = "Écrivez la description (résultat Google) avant de publier.";
  if (!c.categorie) erreurs.categorie = "Choisissez la catégorie avant de publier.";
  if (!c.date_publication) erreurs.date_publication = "Indiquez la date de l'article avant de le publier.";
  if (!c.couverture) erreurs.couverture = "Choisissez la photo de couverture avant de publier.";
  if (!c.couverture_alt) erreurs.couverture_alt = "Décrivez la photo de couverture (texte alternatif) avant de publier.";
  return erreurs;
}

/** Premier message d'erreur (pour le toast). */
export function premiereErreur(erreurs: ErreursArticle): string {
  return Object.values(erreurs).find(Boolean) ?? "Article invalide.";
}

export const schemaIdArticle = z.uuid("Article introuvable.");
