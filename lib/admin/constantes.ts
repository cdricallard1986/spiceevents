// Constantes partagées avec le formulaire de connexion (côté navigateur) :
// fichier séparé pour ne pas embarquer Zod dans le JavaScript de la page.

/** Longueurs maximales acceptées (au-delà, c'est une saisie anormale). */
export const LIMITES_CONNEXION = { email: 254, motDePasse: 200 } as const;

export type ChampConnexion = "email" | "motDePasse";
