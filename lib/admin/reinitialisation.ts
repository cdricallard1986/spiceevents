import type { Journal } from "@/lib/contact/traitement";
import type { MagasinTentatives } from "./connexion";
import { DUREE_MINIMALE_MS, LIMITE_CONNEXION, debutFenetreConnexion, empreinteTentative } from "./limite";
import { schemaConnexion } from "./schema";

/**
 * « Mot de passe oublié ? » du back office, du formulaire brut à la décision
 * (logique pure ; base, auth, email et horloge injectés). Règles de Cédric :
 *
 * 1. réponse IDENTIQUE que le compte existe ou non, et jamais plus rapide que
 *    1,5 s (le temps de réponse ne révèle rien) ;
 * 2. limite par IP sur toutes les demandes (message explicite, partagé avec la
 *    connexion), et par compte sur les seuls liens réellement envoyés, EN
 *    SILENCE (compter les simples demandes permettrait de bloquer quelqu'un en
 *    ne connaissant que son email) ;
 * 3. lien envoyé seulement à un compte administrateur (rien pour un autre) ;
 * 4. échoue fermé si la base ne répond pas ; sans clé service_role
 *    (développement local), rien ne part.
 */

export const LIENS_PAR_COMPTE = 3;

export const MESSAGES_REINITIALISATION = {
  validation: "Indiquez une adresse email valide.",
  envoye:
    "Si cette adresse correspond au compte du back office, un lien pour choisir un nouveau mot de passe vient d'y être envoyé. Il est valable une heure.",
  limite: "Trop de demandes depuis cette connexion. Réessayez dans 15 minutes.",
  indisponible: "La demande n'a pas pu être traitée. Réessayez dans quelques minutes.",
} as const;

export type EtatReinitialisation =
  | { statut: "initial" }
  | { statut: "envoye"; message: string }
  | { statut: "erreur"; message: string; email: string };

/** Lien de réinitialisation créé par Supabase (`auth.admin.generateLink`), ou null si aucun compte. */
export type LienGenere = { userId: string; jeton: string } | null;

export type DependancesReinitialisation = {
  ip: string | null;
  secret: string | null;
  /** null = pas de clé service_role : rien ne peut être vérifié ni envoyé. */
  tentatives: MagasinTentatives | null;
  genererLien(email: string): Promise<LienGenere>;
  estAdministrateur(userId: string): Promise<boolean>;
  /** Envoie l'email (le lien est construit par l'appelant avec le jeton) ; lève une erreur s'il n'est pas parti. */
  envoyer(email: string, jeton: string): Promise<void>;
  maintenant: () => number;
  attendre: (ms: number) => Promise<void>;
  journal: Journal;
};

/**
 * Adresse du lien de l'email, sur le déploiement qui l'envoie. Jamais déduite
 * de l'en-tête Host de la requête (un en-tête forgé enverrait le jeton vers un
 * autre site) : variables système de Vercel seulement.
 */
export function origineDesLiens(env: Record<string, string | undefined>): string {
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const apercu = env.VERCEL_BRANCH_URL ?? env.VERCEL_URL;
  if (env.VERCEL_ENV && apercu) return `https://${apercu}`;
  return "http://localhost:3000";
}

export function lienReinitialisation(origine: string, jeton: string): string {
  return `${origine}/admin/auth/confirmer?token_hash=${encodeURIComponent(jeton)}&type=recovery`;
}

export async function traiterReinitialisation(brut: { email?: unknown }, d: DependancesReinitialisation): Promise<EtatReinitialisation> {
  const debut = d.maintenant();
  try {
    return await etapes(brut, d);
  } finally {
    const reste = DUREE_MINIMALE_MS - (d.maintenant() - debut);
    if (reste > 0) await d.attendre(reste);
  }
}

async function etapes(brut: { email?: unknown }, d: DependancesReinitialisation): Promise<EtatReinitialisation> {
  const saisi = typeof brut.email === "string" ? brut.email.trim().slice(0, 254) : "";
  const lu = schemaConnexion.shape.email.safeParse(brut.email);
  if (!lu.success) return { statut: "erreur", message: MESSAGES_REINITIALISATION.validation, email: saisi };
  const email = lu.data;
  const envoye: EtatReinitialisation = { statut: "envoye", message: MESSAGES_REINITIALISATION.envoye };

  if (!d.tentatives || !d.secret) {
    d.journal.avertir("[admin] Mot de passe oublié : clé service_role ou secret d'empreinte absent, aucun lien envoyé.");
    return envoye;
  }

  // Limites (échoue fermé si la base ne répond pas).
  const empreinteIp = d.ip ? empreinteTentative("ip", d.ip, d.secret) : null;
  const empreinteCompte = empreinteTentative("reinitialisation", email, d.secret);
  try {
    const depuis = debutFenetreConnexion(d.maintenant());
    const [demandesIp, liensCompte] = await Promise.all([
      empreinteIp ? d.tentatives.compter("ip", empreinteIp, depuis) : Promise.resolve(0),
      d.tentatives.compter("reinitialisation", empreinteCompte, depuis),
    ]);
    if (demandesIp >= LIMITE_CONNEXION.parIp) return { statut: "erreur", message: MESSAGES_REINITIALISATION.limite, email };
    if (empreinteIp) await d.tentatives.enregistrer("ip", empreinteIp);
    if (liensCompte >= LIENS_PAR_COMPTE) {
      d.journal.info("[admin] Mot de passe oublié : limite de liens atteinte pour ce compte (réponse inchangée).");
      return envoye;
    }
  } catch (e) {
    d.journal.erreur("[admin] Mot de passe oublié : limite invérifiable (base indisponible).", e);
    return { statut: "erreur", message: MESSAGES_REINITIALISATION.indisponible, email };
  }

  // Compte administrateur seulement ; sinon, même réponse, rien n'est envoyé.
  try {
    const lien = await d.genererLien(email);
    if (!lien || !(await d.estAdministrateur(lien.userId))) return envoye;
    await d.envoyer(email, lien.jeton);
    await d.tentatives.enregistrer("reinitialisation", empreinteCompte);
  } catch (e) {
    // Même réponse qu'un succès : un message d'erreur ici révélerait que le compte existe.
    d.journal.erreur("[admin] Mot de passe oublié : lien non envoyé.", e);
  }
  return envoye;
}
