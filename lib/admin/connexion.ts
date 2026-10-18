import type { Journal } from "@/lib/contact/traitement";
import { LIMITES_CONNEXION } from "./constantes";
import {
  DUREE_MINIMALE_MS,
  debutFenetreConnexion,
  empreinteTentative,
  tentativeAutorisee,
  type TypeTentative,
} from "./limite";
import { RAISONS } from "./messages";
import { validerConnexion, type ErreursConnexion } from "./schema";

/**
 * Connexion au back office, du formulaire brut à la décision. La base, l'auth
 * Supabase et l'horloge sont injectées : la Server Action fournit les vraies,
 * les tests des fausses. Ordre :
 *
 * 1. validation Zod ;
 * 2. limite par IP (toutes les tentatives) et par compte (échecs) ;
 * 3. mot de passe (Supabase Auth) — un échec est compté pour le compte ;
 * 4. droit d'accès (`est_admin()`) : un compte sans droit est aussitôt
 *    déconnecté de cet appareil ;
 * 5. réponse jamais plus rapide que 1,5 s, quelle que soit l'issue.
 */

export const MESSAGES_CONNEXION = {
  validation: "Vérifiez les champs signalés.",
  identifiants: "Email ou mot de passe incorrect.",
  limite: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  indisponible: "La connexion est momentanément impossible. Réessayez dans quelques minutes.",
  accesRefuse: RAISONS.acces_refuse,
} as const;

export type EtatConnexion =
  | { statut: "initial" }
  | { statut: "connecte" }
  | {
      statut: "erreur";
      message: string;
      erreurs: ErreursConnexion;
      /** Email saisi, pour remplir à nouveau le champ (jamais le mot de passe). */
      email: string;
    };

/** Accès à `tentatives_connexion` (clé service_role). Les deux méthodes lèvent une erreur en cas d'échec. */
export type MagasinTentatives = {
  compter(type: TypeTentative, empreinte: string, depuis: Date): Promise<number>;
  enregistrer(type: TypeTentative, empreinte: string): Promise<void>;
};

export type ResultatMotDePasse = "ok" | "refuse" | "indisponible";

export type AuthConnexion = {
  verifierMotDePasse(email: string, motDePasse: string): Promise<ResultatMotDePasse>;
  /** `est_admin()` pour la session qui vient de s'ouvrir ; lève une erreur si la base ne répond pas. */
  estAdmin(): Promise<boolean>;
  /** Ferme la session sur CET appareil seulement (`scope: "local"`). */
  deconnecterLocalement(): Promise<void>;
};

export type DependancesConnexion = {
  production: boolean;
  /** IP du visiteur (null si inconnue). */
  ip: string | null;
  secret: string | null;
  /** null = pas de clé service_role (développement local) : limite non appliquée. */
  tentatives: MagasinTentatives | null;
  auth: AuthConnexion;
  maintenant: () => number;
  attendre: (ms: number) => Promise<void>;
  journal: Journal;
};

function erreur(cle: keyof typeof MESSAGES_CONNEXION, email: string, erreurs: ErreursConnexion = {}): EtatConnexion {
  return { statut: "erreur", message: MESSAGES_CONNEXION[cle], erreurs, email };
}

export async function traiterConnexion(brut: Record<string, string>, d: DependancesConnexion): Promise<EtatConnexion> {
  const debut = d.maintenant();
  try {
    return await etapes(brut, d);
  } finally {
    // Même durée minimale pour toutes les issues (succès, échec, blocage).
    const reste = DUREE_MINIMALE_MS - (d.maintenant() - debut);
    if (reste > 0) await d.attendre(reste);
  }
}

async function etapes(brut: Record<string, string>, d: DependancesConnexion): Promise<EtatConnexion> {
  const saisi = (brut.email ?? "").trim().slice(0, LIMITES_CONNEXION.email);

  // 1. Validation.
  const validation = validerConnexion(brut);
  if (!validation.ok) return erreur("validation", saisi, validation.erreurs);
  const { email, motDePasse } = validation.identifiants;

  // 2. Limite des tentatives.
  let empreinteCompte: string | null = null;
  if (!d.tentatives) {
    if (d.production) d.journal.avertir("[admin] Clé service_role absente : limite des connexions non appliquée.");
  } else {
    if (!d.secret) {
      d.journal.erreur("[admin] Secret d'empreinte (contact_secret_ip) absent : connexion refusée par prudence.");
      return erreur("indisponible", email);
    }
    const empreinteIp = d.ip ? empreinteTentative("ip", d.ip, d.secret) : null;
    empreinteCompte = empreinteTentative("compte", email, d.secret);
    if (!empreinteIp && d.production) d.journal.avertir("[admin] IP inconnue : limite par IP non appliquée.");
    try {
      const depuis = debutFenetreConnexion(d.maintenant());
      const [tentativesIp, echecsCompte] = await Promise.all([
        empreinteIp ? d.tentatives.compter("ip", empreinteIp, depuis) : Promise.resolve(0),
        d.tentatives.compter("compte", empreinteCompte, depuis),
      ]);
      if (!tentativeAutorisee(tentativesIp, echecsCompte)) {
        d.journal.info("[admin] Limite des tentatives de connexion atteinte.");
        return erreur("limite", email);
      }
      if (empreinteIp) await d.tentatives.enregistrer("ip", empreinteIp);
    } catch (e) {
      // Échoue fermé : sans compteur fiable, pas d'essai de mot de passe.
      d.journal.erreur("[admin] Limite des connexions invérifiable (base indisponible) : connexion refusée.", e);
      return erreur("indisponible", email);
    }
  }

  // 3. Mot de passe.
  const resultat = await d.auth.verifierMotDePasse(email, motDePasse);
  if (resultat === "indisponible") {
    d.journal.erreur("[admin] Supabase Auth ne répond pas.");
    return erreur("indisponible", email);
  }
  if (resultat === "refuse") {
    if (d.tentatives && empreinteCompte) {
      try {
        await d.tentatives.enregistrer("compte", empreinteCompte);
      } catch (e) {
        d.journal.avertir("[admin] Échec de connexion non compté (base indisponible).", e);
      }
    }
    return erreur("identifiants", email);
  }

  // 4. Droit d'accès au back office.
  let admin: boolean | null;
  try {
    admin = await d.auth.estAdmin();
  } catch (e) {
    d.journal.erreur("[admin] est_admin() invérifiable.", e);
    admin = null;
  }
  if (admin !== true) {
    try {
      await d.auth.deconnecterLocalement();
    } catch (e) {
      d.journal.avertir("[admin] Déconnexion locale impossible après refus d'accès.", e);
    }
    return erreur(admin === false ? "accesRefuse" : "indisponible", email);
  }

  return { statut: "connecte" };
}
