import { z } from "zod";
import { longueur } from "@/lib/avis/constantes";
import { LIMITES_PHOTOS, estGalerieConnue, type Galerie } from "./constantes";
import { LISTE_TYPES_IMAGE, TAILLE_MAX_OCTETS, estCheminStockage, formaterTaille } from "./envoi";
import type { Photo } from "./types";

/**
 * Validation des Server Actions des photos, alignée sur les contraintes des
 * tables `photos` et `galeries_photos` (migration 0006). La sécurité ne dépend
 * jamais du formulaire : tout est revérifié ici, puis par la base.
 */

/** La fiche d'une photo dans le back office : des chaînes (vide = rien). */
export type FormulairePhoto = { alt_fr: string; alt_en: string; credit: string };
export type ChampPhoto = keyof FormulairePhoto;
export type ChampsPhoto = Pick<Photo, "alt_fr" | "alt_en" | "credit">;
export type ErreursPhoto = Partial<Record<ChampPhoto, string>>;

export const FORMULAIRE_PHOTO_VIDE: FormulairePhoto = { alt_fr: "", alt_en: "", credit: "" };

export function formulaireDepuisPhoto(p: Photo): FormulairePhoto {
  return { alt_fr: p.alt_fr, alt_en: p.alt_en ?? "", credit: p.credit ?? "" };
}

const maximum = (max: number) => (v: string) => longueur(v) <= max;

const altFr = z
  .string("Décrivez la photo en français (texte alternatif).")
  .trim()
  .min(1, "Décrivez la photo en français (texte alternatif) : c'est obligatoire.")
  .refine(maximum(LIMITES_PHOTOS.alt), `Texte alternatif (français) : ${LIMITES_PHOTOS.alt} caractères au maximum.`);

function facultatif(max: number, trop: string) {
  return z
    .string()
    .nullish()
    .transform((v) => v?.trim() ?? "")
    .refine(maximum(max), trop)
    .transform((v) => (v === "" ? null : v));
}

export const schemaChampsPhoto = z.object({
  alt_fr: altFr,
  alt_en: facultatif(LIMITES_PHOTOS.alt, `Texte alternatif (anglais) : ${LIMITES_PHOTOS.alt} caractères au maximum.`),
  credit: facultatif(LIMITES_PHOTOS.credit, `Crédit : ${LIMITES_PHOTOS.credit} caractères au maximum.`),
});

export type ValidationPhoto = { ok: true; champs: ChampsPhoto } | { ok: false; erreurs: ErreursPhoto };

/** Valide une fiche ; en erreur, le premier message de chaque champ. */
export function validerChampsPhoto(brut: unknown): ValidationPhoto {
  const r = schemaChampsPhoto.safeParse(brut);
  if (r.success) return { ok: true, champs: r.data };
  const erreurs: ErreursPhoto = {};
  for (const probleme of r.error.issues) {
    const champ = probleme.path[0];
    if (typeof champ === "string" && champ in FORMULAIRE_PHOTO_VIDE) {
      const c = champ as ChampPhoto;
      if (!erreurs[c]) erreurs[c] = probleme.message;
    }
  }
  if (Object.keys(erreurs).length === 0) erreurs.alt_fr = "Fiche invalide : rechargez la page puis réessayez.";
  return { ok: false, erreurs };
}

export function premiereErreurPhoto(erreurs: ErreursPhoto): string {
  return Object.values(erreurs).find(Boolean) ?? "Fiche invalide.";
}

export const schemaIdPhoto = z.uuid("Photo introuvable.");

export const schemaGalerie = z.string("Galerie inconnue.").refine(estGalerieConnue, "Galerie inconnue.").transform((g) => g as Galerie);

/** Demande d'URL d'envoi : le type et la taille annoncés par le navigateur (le bucket les revérifie). */
export const schemaDemandeEnvoi = z.object({
  nomFichier: z.string("Fichier invalide.").min(1, "Fichier sans nom.").max(255, "Nom de fichier trop long."),
  type: z.enum(LISTE_TYPES_IMAGE, "Format refusé : envoyez une photo JPEG, PNG, WebP ou AVIF."),
  taille: z
    .number("Fichier invalide.")
    .int("Fichier invalide.")
    .positive("Fichier vide.")
    .max(TAILLE_MAX_OCTETS, `Fichier trop lourd : ${formaterTaille(TAILLE_MAX_OCTETS)} au maximum.`),
});

const dimension = z
  .number("Dimensions de la photo inconnues.")
  .int("Dimensions de la photo invalides.")
  .min(1, "Dimensions de la photo invalides.")
  .max(LIMITES_PHOTOS.dimension, "Photo trop grande (20 000 pixels de côté au maximum).");

/** Enregistrement d'une photo envoyée : son chemin dans le bucket, ses dimensions, sa fiche, et sa galerie éventuelle. */
export const schemaEnregistrement = schemaChampsPhoto.extend({
  chemin: z.string("Fichier introuvable.").refine(estCheminStockage, "Chemin de fichier refusé : il doit être un envoi du back office (galeries/…)."),
  largeur: dimension,
  hauteur: dimension,
  galerie: schemaGalerie.nullish().transform((g) => g ?? null),
});

/** Une photo dans une galerie (retrait). */
export const schemaPhotoDansGalerie = z.object({ galerie: schemaGalerie, photoId: schemaIdPhoto });

/** Ajout de photos de la photothèque à une galerie. */
export const schemaAjoutGalerie = z.object({
  galerie: schemaGalerie,
  photoIds: z
    .array(schemaIdPhoto, "Photos invalides.")
    .min(1, "Choisissez au moins une photo.")
    .max(100, "Trop de photos à la fois (100 au maximum).")
    .transform((ids) => [...new Set(ids)]),
});

/** Échange de rang entre deux photos voisines d'une galerie. */
export const schemaEchangePhotos = z
  .object({ galerie: schemaGalerie, photoId: schemaIdPhoto, avecId: schemaIdPhoto, sens: z.enum(["monter", "descendre"]) })
  .refine((v) => v.photoId !== v.avecId, "Une photo ne s'échange pas avec elle-même.");
