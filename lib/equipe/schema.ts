import { z } from "zod";
import { longueur } from "@/lib/avis/constantes";
import { normaliserLien } from "@/lib/avis/schema";
import { CADRAGE_CENTRE, GROUPES, LIMITES_EQUIPE, MOTIF_CADRAGE, estCheminPhotoMembre } from "./constantes";
import type { GroupeEquipe, MembreEquipe } from "./types";

/**
 * Validation des fiches de l’équipe saisies dans le back office (Server
 * Actions), alignée sur les contraintes de la table `equipe` (migration 0012).
 * La sécurité ne dépend jamais du formulaire : tout est revérifié ici, puis
 * par la base.
 */

/** Le formulaire du back office : des chaînes (vide = rien), les styles séparés par des virgules. */
export type FormulaireMembre = {
  groupe: GroupeEquipe;
  nom: string;
  alias: string;
  role_fr: string;
  role_en: string;
  styles_fr: string;
  styles_en: string;
  accroche_fr: string;
  accroche_en: string;
  presentation_fr: string;
  presentation_en: string;
  avis_texte_fr: string;
  avis_texte_en: string;
  avis_auteur_fr: string;
  avis_auteur_en: string;
  lieux_fr: string;
  lieux_en: string;
  lien_url: string;
  lien_libelle_fr: string;
  lien_libelle_en: string;
  /** Vide = pas de photo (monogramme sur la page). */
  photo_chemin: string;
  photo_largeur: number | null;
  photo_hauteur: number | null;
  photo_cadrage: string;
};

export type ChampMembre = keyof FormulaireMembre;

/** Ce qui est écrit en base (colonnes modifiables par le formulaire). */
export type ChampsMembre = Omit<MembreEquipe, "id" | "publie" | "ordre">;

export type ErreursMembre = Partial<Record<ChampMembre, string>>;

export const FORMULAIRE_MEMBRE_VIDE: FormulaireMembre = {
  groupe: "dj",
  nom: "",
  alias: "",
  role_fr: "DJ",
  role_en: "",
  styles_fr: "",
  styles_en: "",
  accroche_fr: "",
  accroche_en: "",
  presentation_fr: "",
  presentation_en: "",
  avis_texte_fr: "",
  avis_texte_en: "",
  avis_auteur_fr: "",
  avis_auteur_en: "",
  lieux_fr: "",
  lieux_en: "",
  lien_url: "",
  lien_libelle_fr: "",
  lien_libelle_en: "",
  photo_chemin: "",
  photo_largeur: null,
  photo_hauteur: null,
  photo_cadrage: CADRAGE_CENTRE,
};

/** « Électro, Funk » ⇄ ["Électro", "Funk"]. */
export function stylesEnTexte(styles: readonly string[]): string {
  return styles.join(", ");
}

export function stylesDepuisTexte(texte: string): string[] {
  return [...new Set(texte.split(/[,;\n]/).map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean))];
}

/** Fiche d’un membre existant, pour la modale d’édition. */
export function formulaireDepuisMembre(m: MembreEquipe): FormulaireMembre {
  return {
    groupe: m.groupe,
    nom: m.nom,
    alias: m.alias ?? "",
    role_fr: m.role_fr,
    role_en: m.role_en ?? "",
    styles_fr: stylesEnTexte(m.styles_fr),
    styles_en: stylesEnTexte(m.styles_en),
    accroche_fr: m.accroche_fr,
    accroche_en: m.accroche_en ?? "",
    presentation_fr: m.presentation_fr,
    presentation_en: m.presentation_en ?? "",
    avis_texte_fr: m.avis_texte_fr ?? "",
    avis_texte_en: m.avis_texte_en ?? "",
    avis_auteur_fr: m.avis_auteur_fr ?? "",
    avis_auteur_en: m.avis_auteur_en ?? "",
    lieux_fr: m.lieux_fr ?? "",
    lieux_en: m.lieux_en ?? "",
    lien_url: m.lien_url ?? "",
    lien_libelle_fr: m.lien_libelle_fr ?? "",
    lien_libelle_en: m.lien_libelle_en ?? "",
    photo_chemin: m.photo_chemin ?? "",
    photo_largeur: m.photo_largeur,
    photo_hauteur: m.photo_hauteur,
    photo_cadrage: m.photo_cadrage,
  };
}

const maximum = (max: number) => (v: string) => longueur(v) <= max;

/** Texte obligatoire : espaces retirés aux extrémités, 1 à `max` caractères. */
function obligatoire(max: number, vide: string, trop: string) {
  return z.string(vide).trim().min(1, vide).refine(maximum(max), trop);
}

/** Texte facultatif : vide (ou null) → null. */
function facultatif(max: number, trop: string) {
  return z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine(maximum(max), trop)
    .transform((v) => (v === "" ? null : v));
}

/** Paragraphes : lignes vides multiples ramenées à une, espaces de fin de ligne retirés. */
function nettoyerParagraphes(v: string | null | undefined): string {
  return (v ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function texteLongObligatoire(max: number, vide: string, trop: string) {
  return z.string(vide).nullish().transform(nettoyerParagraphes).refine((v) => v !== "", vide).refine(maximum(max), trop);
}

function texteLongFacultatif(max: number, trop: string) {
  return z
    .string()
    .nullish()
    .transform(nettoyerParagraphes)
    .refine(maximum(max), trop)
    .transform((v) => (v === "" ? null : v));
}

function styles(langue: string) {
  return z
    .string()
    .nullish()
    .transform((v) => stylesDepuisTexte(v ?? ""))
    .refine((l) => l.length <= LIMITES_EQUIPE.styles, `Styles (${langue}) : ${LIMITES_EQUIPE.styles} au maximum.`)
    .refine((l) => l.every((s) => longueur(s) <= LIMITES_EQUIPE.style), `Styles (${langue}) : ${LIMITES_EQUIPE.style} caractères au maximum par style.`);
}

const L = LIMITES_EQUIPE;

export const schemaChampsMembre = z
  .object({
    groupe: z.enum(GROUPES, "Choisissez la section : DJ ou musicien."),
    nom: obligatoire(L.nom, "Indiquez le nom (prénom et initiale du nom, ou nom de scène).", `Nom : ${L.nom} caractères au maximum.`),
    alias: facultatif(L.alias, `Autre nom : ${L.alias} caractères au maximum.`),
    role_fr: obligatoire(L.role, "Indiquez le rôle (DJ, saxophoniste…).", `Rôle (français) : ${L.role} caractères au maximum.`),
    role_en: facultatif(L.role, `Rôle (anglais) : ${L.role} caractères au maximum.`),
    styles_fr: styles("français"),
    styles_en: styles("anglais"),
    accroche_fr: obligatoire(L.accroche, "L’accroche française est obligatoire.", `Accroche (français) : ${L.accroche} caractères au maximum.`),
    accroche_en: facultatif(L.accroche, `Accroche (anglais) : ${L.accroche} caractères au maximum.`),
    presentation_fr: texteLongObligatoire(L.presentation, "La présentation française est obligatoire.", `Présentation (français) : ${L.presentation} caractères au maximum.`),
    presentation_en: texteLongFacultatif(L.presentation, `Présentation (anglais) : ${L.presentation} caractères au maximum.`),
    avis_texte_fr: facultatif(L.avisTexte, `Avis (français) : ${L.avisTexte} caractères au maximum.`),
    avis_texte_en: facultatif(L.avisTexte, `Avis (anglais) : ${L.avisTexte} caractères au maximum.`),
    avis_auteur_fr: facultatif(L.avisAuteur, `Auteur de l’avis (français) : ${L.avisAuteur} caractères au maximum.`),
    avis_auteur_en: facultatif(L.avisAuteur, `Auteur de l’avis (anglais) : ${L.avisAuteur} caractères au maximum.`),
    lieux_fr: facultatif(L.lieux, `Lieux (français) : ${L.lieux} caractères au maximum.`),
    lieux_en: facultatif(L.lieux, `Lieux (anglais) : ${L.lieux} caractères au maximum.`),
    lien_url: z
      .string()
      .nullish()
      .transform((v, ctx) => {
        const r = normaliserLien(v ?? "");
        if (!r.ok) {
          ctx.addIssue({ code: "custom", message: r.message.replace("https://www.mariages.net/…", "https://www.mixcloud.com/…") });
          return z.NEVER;
        }
        return r.lien;
      }),
    lien_libelle_fr: facultatif(L.lienLibelle, `Texte du lien (français) : ${L.lienLibelle} caractères au maximum.`),
    lien_libelle_en: facultatif(L.lienLibelle, `Texte du lien (anglais) : ${L.lienLibelle} caractères au maximum.`),
    photo_chemin: z
      .string()
      .nullish()
      .transform((v) => v?.trim() ?? "")
      .refine((v) => v === "" || estCheminPhotoMembre(v), "Photo invalide : renvoyez-la depuis cette fiche.")
      .transform((v) => (v === "" ? null : v)),
    photo_largeur: z.number().int().min(1).max(20000).nullish().transform((v) => v ?? null),
    photo_hauteur: z.number().int().min(1).max(20000).nullish().transform((v) => v ?? null),
    photo_cadrage: z
      .string()
      .nullish()
      .transform((v) => v?.trim() || CADRAGE_CENTRE)
      .refine((v) => MOTIF_CADRAGE.test(v), "Cadrage invalide : cliquez sur la photo pour le choisir."),
  })
  .superRefine((v, ctx) => {
    if (v.photo_chemin && (v.photo_largeur === null || v.photo_hauteur === null)) {
      ctx.addIssue({ code: "custom", path: ["photo_chemin"], message: "Dimensions de la photo inconnues : renvoyez-la depuis cette fiche." });
    }
    if (v.lien_url && !v.lien_libelle_fr) ctx.addIssue({ code: "custom", path: ["lien_libelle_fr"], message: "Donnez un texte au lien (ex. « Sa page Mixcloud »)." });
    if (!v.lien_url && (v.lien_libelle_fr || v.lien_libelle_en)) ctx.addIssue({ code: "custom", path: ["lien_url"], message: "Indiquez l’adresse du lien, ou videz son texte." });
    if (v.avis_texte_fr && !v.avis_auteur_fr) ctx.addIssue({ code: "custom", path: ["avis_auteur_fr"], message: "Indiquez qui a écrit l’avis (ex. « Roman, mariage de juillet 2026 »)." });
    if (!v.avis_texte_fr && (v.avis_texte_en || v.avis_auteur_fr || v.avis_auteur_en)) {
      ctx.addIssue({ code: "custom", path: ["avis_texte_fr"], message: "Le texte français de l’avis est obligatoire dès qu’un avis est renseigné." });
    }
  })
  .transform(
    (v): ChampsMembre => ({
      ...v,
      // Sans photo, ni dimensions ni cadrage particulier.
      photo_largeur: v.photo_chemin ? v.photo_largeur : null,
      photo_hauteur: v.photo_chemin ? v.photo_hauteur : null,
      photo_cadrage: v.photo_chemin ? v.photo_cadrage : CADRAGE_CENTRE,
    }),
  );

export type ValidationMembre = { ok: true; champs: ChampsMembre } | { ok: false; erreurs: ErreursMembre };

/** Valide une fiche ; en erreur, le premier message de chaque champ (bordure rouge + toast). */
export function validerChampsMembre(brut: unknown): ValidationMembre {
  const r = schemaChampsMembre.safeParse(brut);
  if (r.success) return { ok: true, champs: r.data };
  const erreurs: ErreursMembre = {};
  for (const probleme of r.error.issues) {
    const champ = probleme.path[0];
    if (typeof champ === "string" && champ in FORMULAIRE_MEMBRE_VIDE) {
      const c = champ as ChampMembre;
      if (!erreurs[c]) erreurs[c] = probleme.message;
    }
  }
  if (Object.keys(erreurs).length === 0) erreurs.nom = "Fiche invalide : rechargez la page puis réessayez.";
  return { ok: false, erreurs };
}

/** Premier message d’erreur (pour le toast). */
export function premiereErreurMembre(erreurs: ErreursMembre): string {
  return Object.values(erreurs).find(Boolean) ?? "Fiche invalide.";
}

export const schemaIdMembre = z.uuid("Fiche introuvable.");

export const schemaPublicationMembre = z.object({ id: schemaIdMembre, publie: z.boolean() });

/** Échange de rang entre deux membres (flèches « monter » / « descendre »). */
export const schemaEchangeMembres = z
  .object({ id: schemaIdMembre, avecId: schemaIdMembre, sens: z.enum(["monter", "descendre"]) })
  .refine((v) => v.id !== v.avecId, "Un membre ne s’échange pas avec lui-même.");
