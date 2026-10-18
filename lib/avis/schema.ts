import { z } from "zod";
import { CATEGORIES, LIMITES_AVIS, SOURCES, estEmplacementConnu, longueur, type Categorie, type Emplacement, type Source } from "./constantes";
import type { Avis } from "./types";

/**
 * Validation des avis saisis dans le back office (Server Actions), alignée sur
 * les contraintes de la table `avis` (migration 0003) : longueurs, catégories,
 * sources, lien en https://, emplacements. La sécurité ne dépend jamais du
 * formulaire : tout est revérifié ici, puis par la base.
 */

/** Le formulaire du back office : des chaînes (vide = rien), et les emplacements cochés. */
export type FormulaireAvis = {
  auteurs: string;
  role_fr: string;
  role_en: string;
  categorie: Categorie;
  texte_fr: string;
  texte_en: string;
  citation_fr: string;
  citation_en: string;
  source: Source;
  /** AAAA-MM-JJ, ou vide. */
  date_avis: string;
  lien_source: string;
  emplacements: string[];
};

export type ChampAvis = keyof FormulaireAvis;

/** Ce qui est écrit en base (colonnes modifiables par le formulaire). */
export type ChampsAvis = Pick<
  Avis,
  "auteurs" | "role_fr" | "role_en" | "categorie" | "texte_fr" | "texte_en" | "citation_fr" | "citation_en" | "source" | "date_avis" | "lien_source"
> & { emplacements: Emplacement[] };

export type ErreursAvis = Partial<Record<ChampAvis, string>>;

export const FORMULAIRE_VIDE: FormulaireAvis = {
  auteurs: "",
  role_fr: "",
  role_en: "",
  categorie: "mariage",
  texte_fr: "",
  texte_en: "",
  citation_fr: "",
  citation_en: "",
  source: "site",
  date_avis: "",
  lien_source: "",
  emplacements: [],
};

/** Fiche d'un avis existant, pour la modale d'édition. */
export function formulaireDepuisAvis(a: Avis): FormulaireAvis {
  return {
    auteurs: a.auteurs,
    role_fr: a.role_fr ?? "",
    role_en: a.role_en ?? "",
    categorie: a.categorie,
    texte_fr: a.texte_fr,
    texte_en: a.texte_en ?? "",
    citation_fr: a.citation_fr ?? "",
    citation_en: a.citation_en ?? "",
    source: a.source,
    date_avis: a.date_avis ?? "",
    lien_source: a.lien_source ?? "",
    emplacements: [...a.emplacements],
  };
}

const maximum = (max: number) => (v: string) => longueur(v) <= max;

/** Texte obligatoire : espaces retirés aux extrémités, 1 à `max` caractères. */
function obligatoire(max: number, vide: string, trop: string) {
  return z
    .string(vide)
    .trim()
    .min(1, vide)
    .refine(maximum(max), trop);
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

/**
 * Lien vers l'avis d'origine : https seulement. Un domaine saisi sans schéma est
 * complété en https:// ; tout autre schéma (http:, javascript:…) est refusé.
 */
export function normaliserLien(saisie: string): { ok: true; lien: string | null } | { ok: false; message: string } {
  const v = saisie.trim();
  if (v === "") return { ok: true, lien: null };
  let lien: string;
  if (/^https:\/\//i.test(v)) lien = `https://${v.slice(8)}`;
  else if (/^http:\/\//i.test(v)) return { ok: false, message: "Lien refusé : l'adresse doit commencer par https:// (connexion sécurisée)." };
  // Un autre schéma (javascript:, mailto:…) — mais « domaine:port » n'en est pas un.
  else if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^[^/:]+:\d+(\/|$)/.test(v)) {
    return { ok: false, message: "Lien refusé : seules les adresses https:// sont acceptées." };
  } else lien = `https://${v.replace(/^\/+/, "")}`;
  if (!/^https:\/\/[^\s]+$/.test(lien)) return { ok: false, message: "Lien invalide : une adresse ne contient pas d'espace." };
  if (longueur(lien) > LIMITES_AVIS.lien) return { ok: false, message: `Lien trop long (${LIMITES_AVIS.lien} caractères au maximum).` };
  try {
    const url = new URL(lien);
    if (!url.hostname.includes(".")) throw new Error();
  } catch {
    return { ok: false, message: "Lien invalide : vérifiez l'adresse (ex. https://www.mariages.net/…)." };
  }
  return { ok: true, lien };
}

function estDateValide(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export const schemaChampsAvis = z.object({
  auteurs: obligatoire(LIMITES_AVIS.auteurs, "Indiquez les auteurs de l'avis.", `Auteurs : ${LIMITES_AVIS.auteurs} caractères au maximum.`),
  role_fr: facultatif(LIMITES_AVIS.role, `Rôle (français) : ${LIMITES_AVIS.role} caractères au maximum.`),
  role_en: facultatif(LIMITES_AVIS.role, `Rôle (anglais) : ${LIMITES_AVIS.role} caractères au maximum.`),
  categorie: z.enum(CATEGORIES, "Choisissez la catégorie : mariage ou événementiel."),
  texte_fr: obligatoire(LIMITES_AVIS.texte, "Le texte français de l'avis est obligatoire.", `Texte (français) : ${LIMITES_AVIS.texte} caractères au maximum.`),
  texte_en: facultatif(LIMITES_AVIS.texte, `Texte (anglais) : ${LIMITES_AVIS.texte} caractères au maximum.`),
  citation_fr: facultatif(LIMITES_AVIS.citation, `Citation (français) : ${LIMITES_AVIS.citation} caractères au maximum.`),
  citation_en: facultatif(LIMITES_AVIS.citation, `Citation (anglais) : ${LIMITES_AVIS.citation} caractères au maximum.`),
  source: z.enum(SOURCES, "Choisissez la source de l'avis."),
  date_avis: z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine((v) => v === "" || estDateValide(v), "Date invalide.")
    .transform((v) => (v === "" ? null : v)),
  lien_source: z
    .string()
    .nullish()
    .transform((v, ctx) => {
      const r = normaliserLien(v ?? "");
      if (!r.ok) {
        ctx.addIssue({ code: "custom", message: r.message });
        return z.NEVER;
      }
      return r.lien;
    }),
  emplacements: z
    .array(z.string(), "Emplacements invalides.")
    .max(30, "Trop d'emplacements.")
    .transform((liste) => [...new Set(liste)])
    .superRefine((liste, ctx) => {
      const inconnu = liste.find((e) => !estEmplacementConnu(e));
      if (inconnu) ctx.addIssue({ code: "custom", message: `Emplacement inconnu : « ${inconnu} » — décochez-le.` });
    })
    .transform((liste) => liste as Emplacement[]),
});

export type ValidationAvis = { ok: true; champs: ChampsAvis } | { ok: false; erreurs: ErreursAvis };

/** Valide une fiche ; en erreur, le premier message de chaque champ (bordure rouge + toast). */
export function validerChampsAvis(brut: unknown): ValidationAvis {
  const r = schemaChampsAvis.safeParse(brut);
  if (r.success) return { ok: true, champs: r.data };
  const erreurs: ErreursAvis = {};
  for (const probleme of r.error.issues) {
    const champ = probleme.path[0];
    if (typeof champ === "string" && champ in FORMULAIRE_VIDE) {
      const c = champ as ChampAvis;
      if (!erreurs[c]) erreurs[c] = probleme.message;
    }
  }
  if (Object.keys(erreurs).length === 0) erreurs.auteurs = "Fiche invalide : rechargez la page puis réessayez.";
  return { ok: false, erreurs };
}

/** Premier message d'erreur (pour le toast). */
export function premiereErreur(erreurs: ErreursAvis): string {
  return Object.values(erreurs).find(Boolean) ?? "Fiche invalide.";
}

export const schemaIdAvis = z.uuid("Avis introuvable.");

export const schemaPublication = z.object({ id: schemaIdAvis, publie: z.boolean() });

/** Échange de rang entre deux avis (flèches « monter » / « descendre »). */
export const schemaEchange = z
  .object({ id: schemaIdAvis, avecId: schemaIdAvis, sens: z.enum(["monter", "descendre"]) })
  .refine((v) => v.id !== v.avecId, "Un avis ne s'échange pas avec lui-même.");
