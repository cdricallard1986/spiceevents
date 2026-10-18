import { z } from "zod";
import { LIMITES_CONNEXION, type ChampConnexion } from "./constantes";

export { LIMITES_CONNEXION, type ChampConnexion };

export const schemaConnexion = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(LIMITES_CONNEXION.email, "Adresse email trop longue.")
    .pipe(z.email("Indiquez une adresse email valide.")),
  motDePasse: z.string().min(1, "Indiquez votre mot de passe.").max(LIMITES_CONNEXION.motDePasse, "Mot de passe trop long."),
});

export type Identifiants = z.infer<typeof schemaConnexion>;
export type ErreursConnexion = Partial<Record<ChampConnexion, string>>;

export type ValidationConnexion = { ok: true; identifiants: Identifiants } | { ok: false; erreurs: ErreursConnexion };

/** Lit les champs du formulaire (FormData → chaînes ; tout autre type devient vide). */
export function lireConnexion(formulaire: FormData): Record<ChampConnexion, string> {
  const texte = (nom: string) => {
    const valeur = formulaire.get(nom);
    return typeof valeur === "string" ? valeur : "";
  };
  return { email: texte("email"), motDePasse: texte("motDePasse") };
}

export function validerConnexion(brut: unknown): ValidationConnexion {
  const resultat = schemaConnexion.safeParse(brut);
  if (resultat.success) return { ok: true, identifiants: resultat.data };
  const erreurs: ErreursConnexion = {};
  for (const probleme of resultat.error.issues) {
    const champ = probleme.path[0];
    if ((champ === "email" || champ === "motDePasse") && !erreurs[champ]) erreurs[champ] = probleme.message;
  }
  if (!erreurs.email && !erreurs.motDePasse) erreurs.email = "Indiquez une adresse email valide.";
  return { ok: false, erreurs };
}
