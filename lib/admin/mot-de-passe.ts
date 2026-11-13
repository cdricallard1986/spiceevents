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

/** Résultat de Supabase : « ok », même mot de passe qu’avant, mot de passe jugé faible (connu des fuites), connexion trop ancienne, ou refus/indisponibilité. */
export type ResultatMiseAJour = "ok" | "identique" | "faible" | "reconnexion" | "refuse";

/** Les règles affichées sous le champ et cochées pendant la frappe (mêmes que le schéma et Supabase). */
export const CRITERES_MOT_DE_PASSE = [
  { cle: "longueur", libelle: `${LONGUEUR_MOT_DE_PASSE.min} caractères au moins`, test: (v: string) => v.length >= LONGUEUR_MOT_DE_PASSE.min },
  { cle: "minuscule", libelle: "Une minuscule", test: (v: string) => /[a-z]/.test(v) },
  { cle: "majuscule", libelle: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { cle: "chiffre", libelle: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
  { cle: "symbole", libelle: "Un caractère spécial (! ? # % …)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

/** Chaque règle, respectée ou non, pour la saisie en cours. */
export function criteresMotDePasse(saisie: string): { cle: string; libelle: string; ok: boolean }[] {
  return CRITERES_MOT_DE_PASSE.map((c) => ({ cle: c.cle, libelle: c.libelle, ok: c.test(saisie) }));
}

/** Accord des deux saisies : rien tant que la confirmation est vide. */
export function accordSaisies(nouveau: string, confirmation: string): "vide" | "identiques" | "differents" {
  if (confirmation === "") return "vide";
  return nouveau === confirmation ? "identiques" : "differents";
}

/**
 * Changement du mot de passe de Cédric, connecté : validation, puis mise à jour par la
 * session (jamais la clé service_role). La garde `exigerAdmin()` est faite par l’action.
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
  if (resultat === "identique") return { statut: "erreur", message: "C’est déjà votre mot de passe : choisissez-en un autre.", erreurs: { nouveau: "Identique à l’actuel." } };
  if (resultat === "faible") {
    return { statut: "erreur", message: "Ce mot de passe figure dans des fuites de données connues : choisissez-en un autre.", erreurs: { nouveau: "Mot de passe connu des fuites de données." } };
  }
  if (resultat === "reconnexion") return { statut: "erreur", message: "Par sécurité, reconnectez-vous avant de changer votre mot de passe.", erreurs: {} };
  if (resultat === "refuse") return { statut: "erreur", message: "Le changement n’a pas pu être fait. Reconnectez-vous, puis réessayez.", erreurs: {} };
  return { statut: "ok" };
}
