/**
 * Règles d'accès au back office appliquées par le middleware (logique pure,
 * testée, sans dépendance Node : le middleware tourne sur le runtime Edge).
 */

export const CHEMIN_ADMIN = "/admin";
export const CHEMIN_CONNEXION = "/admin/connexion";

/** `/admin` et tout ce qui est dessous (mais pas `/administration`). */
export function estCheminAdmin(chemin: string): boolean {
  return chemin === CHEMIN_ADMIN || chemin.startsWith(`${CHEMIN_ADMIN}/`);
}

/** La page de connexion, et elle seule, reste ouverte sans session. */
export function estCheminConnexion(chemin: string): boolean {
  return chemin === CHEMIN_CONNEXION;
}

/**
 * Un cookie de session Supabase est-il présent ? Le jeton peut être découpé en
 * plusieurs cookies : `sb-<ref>-auth-token.0`, `.1`…
 */
export function aCookieSession(noms: readonly string[], nomCookie: string): boolean {
  return noms.some((nom) => nom === nomCookie || (nom.startsWith(`${nomCookie}.`) && /^\d+$/.test(nom.slice(nomCookie.length + 1))));
}

/**
 * Adresse où revenir après la connexion (`?suite=`). N'accepte qu'un chemin du
 * back office : jamais une autre origine (`//exemple.com`, `/\exemple.com`),
 * sinon la page de connexion deviendrait une redirection ouverte.
 */
export function cheminDeRetour(valeur: unknown): string {
  if (typeof valeur !== "string" || valeur.length > 300) return CHEMIN_ADMIN;
  if (!/^\/admin(\/[A-Za-z0-9\-_/]*)?(\?[A-Za-z0-9\-_=&%.]*)?$/.test(valeur)) return CHEMIN_ADMIN;
  if (valeur.includes("//") || estCheminConnexion(valeur.split("?")[0])) return CHEMIN_ADMIN;
  return valeur;
}

export type EtatAcces = {
  chemin: string;
  /** Partie `?…` de l'adresse demandée (vide ou commençant par `?`). */
  recherche: string;
  connecte: boolean;
  avaitSession: boolean;
  indisponible: boolean;
};

export type DecisionAcces = { type: "continuer" } | { type: "rediriger"; vers: string };

/**
 * Décision du middleware pour une adresse `/admin…` :
 * - la connexion est toujours accessible ;
 * - connecté (`getUser()` validé) → on continue ; la garde serveur
 *   (`exigerAdmin`) vérifie ensuite que le compte est bien administrateur ;
 * - sinon → connexion, avec la raison si un cookie de session a été refusé
 *   (session expirée, fermée depuis un autre appareil, mot de passe changé).
 */
export function decisionAcces(etat: EtatAcces): DecisionAcces {
  if (estCheminConnexion(etat.chemin) || etat.connecte) return { type: "continuer" };
  const parametres = new URLSearchParams();
  if (etat.indisponible) parametres.set("raison", "indisponible");
  else if (etat.avaitSession) parametres.set("raison", "session_expiree");
  const suite = cheminDeRetour(`${etat.chemin}${etat.recherche}`);
  if (suite !== CHEMIN_ADMIN) parametres.set("suite", suite);
  const requete = parametres.toString();
  return { type: "rediriger", vers: requete ? `${CHEMIN_CONNEXION}?${requete}` : CHEMIN_CONNEXION };
}
