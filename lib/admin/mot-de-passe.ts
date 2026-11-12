import { z } from "zod";

/** Règles de Supabase (Authentication → Policies) : 12 caractères, minuscule, majuscule, chiffre, symbole. */
export const LONGUEUR_MOT_DE_PASSE = { min: 12, max: 72 } as const;

const schema = z
  .object({
    nouveau: z
      .string()
      .min(LONGUEUR_MOT_DE_PASSE.min, `Au moins ${LONGUEUR_MOT_DE_PASSE.min} caractères.`)
      .max(LONGUEUR_MOT_DE_PASSE.max, `${LONGUEUR_MOT_DE_PASSE.max} caractères au plus.`)
      .regex(/[a-z]/, "Au moins une minuscule.")
      .regex(/[A-Z]/, "Au moins une majuscule.")
      .regex(/[0-9]/, "Au moins un chiffre.")
      .regex(/[^A-Za-z0-9]/, "Au moins un symbole (! ? # % …)."),
    confirmation: z.string(),
  })
  .refine((v) => v.nouveau === v.confirmation, { path: ["confirmation"], message: "Les deux mots de passe ne sont pas identiques." });

export type EtatMotDePasse =
  | { statut: "initial" }
  | { statut: "ok" }
  | { statut: "erreur"; message: string; erreurs: Partial<Record<"nouveau" | "confirmation", string>> };

/** Résultat de Supabase : « ok », même mot de passe qu'avant, ou refus/indisponibilité. */
export type ResultatMiseAJour = "ok" | "identique" | "refuse";

/**
 * Changement du mot de passe de Cédric, connecté : validation, puis mise à jour par la
 * session (jamais la clé service_role). La garde `exigerAdmin()` est faite par l'action.
 */
export async function traiterChangement(
  formulaire: { nouveau: unknown; confirmation: unknown },
  mettreAJour: (motDePasse: string) => Promise<ResultatMiseAJour>,
): Promise<EtatMotDePasse> {
  const lu = schema.safeParse(formulaire);
  if (!lu.success) {
    const erreurs: Partial<Record<"nouveau" | "confirmation", string>> = {};
    for (const p of lu.error.issues) {
      const champ = p.path[0] as "nouveau" | "confirmation";
      erreurs[champ] ??= p.message;
    }
    return { statut: "erreur", message: "Le mot de passe ne convient pas.", erreurs };
  }
  const resultat = await mettreAJour(lu.data.nouveau);
  if (resultat === "identique") return { statut: "erreur", message: "C'est déjà votre mot de passe : choisissez-en un autre.", erreurs: { nouveau: "Identique à l'actuel." } };
  if (resultat === "refuse") return { statut: "erreur", message: "Le changement n'a pas pu être fait. Reconnectez-vous, puis réessayez.", erreurs: {} };
  return { statut: "ok" };
}
