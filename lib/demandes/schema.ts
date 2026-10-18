import { z } from "zod";
import { LIMITE_NOTE, STATUTS } from "./constantes";

/**
 * Validation du suivi d'une demande (Server Action du back office), alignée sur
 * la migration 0005 : statut parmi cinq valeurs, note interne de 5 000
 * caractères au plus. Seules ces deux colonnes peuvent être écrites — la base
 * le garantit aussi (droit `update` limité à ces colonnes).
 */

/** Le formulaire de la fiche : le statut et la note (vide = pas de note). */
export type FormulaireSuivi = { statut: (typeof STATUTS)[number]; note_interne: string };

const longueur = (v: string) => Array.from(v).length;

export const schemaSuivi = z
  .strictObject(
    {
      id: z.uuid("Demande introuvable."),
      statut: z.enum(STATUTS, "Statut inconnu.").optional(),
      note_interne: z
        .union([z.string(), z.null()], "Note invalide.")
        .optional()
        // Espaces retirés aux extrémités ; une note vide est effacée (null).
        .transform((v) => (v === undefined ? undefined : v === null || v.trim() === "" ? null : v.trim()))
        .refine((v) => v == null || longueur(v) <= LIMITE_NOTE, "Note interne : 5 000 caractères au maximum."),
    },
    "Demande invalide : rechargez la page puis réessayez.",
  )
  .refine((v) => v.statut !== undefined || v.note_interne !== undefined, "Rien à enregistrer : indiquez un statut ou une note.");

export type EntreeSuivi = z.infer<typeof schemaSuivi>;

/** Les colonnes à écrire : seulement celles fournies. */
export function champsAEcrire(v: EntreeSuivi): { statut?: EntreeSuivi["statut"]; note_interne?: string | null } {
  return {
    ...(v.statut !== undefined ? { statut: v.statut } : {}),
    ...(v.note_interne !== undefined ? { note_interne: v.note_interne } : {}),
  };
}

export type ValidationSuivi = { ok: true; id: string; champs: ReturnType<typeof champsAEcrire> } | { ok: false; message: string };

export function validerSuivi(brut: unknown): ValidationSuivi {
  const r = schemaSuivi.safeParse(brut);
  if (!r.success) return { ok: false, message: r.error.issues[0]?.message ?? "Demande invalide." };
  return { ok: true, id: r.data.id, champs: champsAEcrire(r.data) };
}
