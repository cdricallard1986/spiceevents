import { SITE } from "@/contenu/site";
import { emailAccuse, emailNotification, type ConfigEmail, type EmailPrepare } from "./email";
import { debutFenetre, empreinteIp, verifierLimite } from "./limite";
import { estRobot, validerDemande, type Champ, type Demande, type ErreursChamps, type Langue } from "./schema";

/**
 * Traitement d'une demande de contact, du formulaire brut à la réponse au
 * couple. La base et l'envoi d'emails sont injectés : la Server Action fournit
 * les vrais (Supabase, Resend), les tests des faux. Ordre :
 *
 * 1. validation Zod (erreurs par champ) ;
 * 2. robot (champ piège, envoi en moins de 3 s) → « succès » silencieux ;
 * 3. limitation par IP (empreinte HMAC) ;
 * 4. insertion en base ;
 * 5. email à Cédric ;
 * 6. accusé de réception au couple ;
 * 7. mise à jour des booléens `email_envoye` / `accuse_envoye`.
 *
 * Aucune demande perdue : la base OU l'email à Cédric suffit pour répondre
 * « succès ». Si les deux échouent, le couple est invité à téléphoner.
 */

export type EtatFormulaire =
  | { statut: "initial" }
  | { statut: "succes" }
  | {
      statut: "erreur";
      message: string;
      erreurs: ErreursChamps;
      /** Valeurs saisies, pour remplir à nouveau le formulaire. */
      valeurs: Partial<Record<Champ, string>>;
    };

/** Ligne de la table `demandes_contact` (voir supabase/migrations/0001_demandes_contact.sql). */
export type LigneDemande = {
  langue: Langue;
  prenoms: string;
  nom: string;
  email: string;
  telephone: string;
  type_evenement: Demande["type"];
  date_evenement: string | null;
  lieu: string | null;
  invites: number | null;
  message: string;
  ip_empreinte: string | null;
};

export type Base = {
  compterRecentes(ipEmpreinte: string, depuis: Date): Promise<number>;
  /** Renvoie l'identifiant de la ligne créée ; lève une erreur en cas d'échec. */
  inserer(ligne: LigneDemande): Promise<string>;
  marquer(id: string, etat: { email_envoye: boolean; accuse_envoye: boolean }): Promise<void>;
};

export type Envoi = {
  config: ConfigEmail;
  /** Lève une erreur si l'email n'est pas parti. */
  envoyer(email: EmailPrepare): Promise<void>;
};

export type Journal = {
  info(message: string, details?: unknown): void;
  avertir(message: string, details?: unknown): void;
  erreur(message: string, details?: unknown): void;
};

export type Dependances = {
  maintenant: Date;
  production: boolean;
  /** IP du visiteur (null si inconnue). Utilisée seulement pour calculer son empreinte. */
  ip: string | null;
  secretIp: string | null;
  /** null = Supabase non configuré. */
  base: Base | null;
  /** null = Resend non configuré. */
  envoi: Envoi | null;
  journal: Journal;
};

const MESSAGES = {
  fr: {
    validation: "Certains champs sont à vérifier.",
    limite: `Vous nous avez déjà envoyé plusieurs demandes. Pour aller plus vite, appelez Cédric au ${SITE.telephoneAffiche}.`,
    panne: `Votre demande n'a pas pu être envoyée. Appelez Cédric au ${SITE.telephoneAffiche} ou écrivez à ${SITE.email}.`,
  },
  en: {
    validation: "Please check the highlighted fields.",
    limite: "You have already sent us several requests. For a quicker answer, call Cédric on +33 6 76 40 37 76.",
    panne: `Your request could not be sent. Please call Cédric on +33 6 76 40 37 76 or email ${SITE.email}.`,
  },
} as const;

/** Champs renvoyés au formulaire après une erreur (jamais le piège ni les horodatages). */
function valeursAffichables(brut: Record<string, string>): Partial<Record<Champ, string>> {
  const valeurs: Partial<Record<Champ, string>> = { ...brut };
  delete valeurs.site_web;
  delete valeurs.ouvert_le;
  delete valeurs.envoye_le;
  return valeurs;
}

function erreur(langue: Langue, cle: keyof (typeof MESSAGES)["fr"], brut: Record<string, string>, erreurs: ErreursChamps = {}): EtatFormulaire {
  return { statut: "erreur", message: MESSAGES[langue][cle], erreurs, valeurs: valeursAffichables(brut) };
}

function ligne(demande: Demande, ipEmpreinte: string | null): LigneDemande {
  return {
    langue: demande.langue,
    prenoms: demande.prenoms,
    nom: demande.nom,
    email: demande.email,
    telephone: demande.telephone,
    type_evenement: demande.type,
    date_evenement: demande.date,
    lieu: demande.lieu,
    invites: demande.invites,
    message: demande.message,
    ip_empreinte: ipEmpreinte,
  };
}

export async function traiterDemande(brut: Record<string, string>, d: Dependances): Promise<EtatFormulaire> {
  // 1. Validation.
  const validation = validerDemande(brut, d.maintenant);
  if (!validation.ok) return erreur(validation.langue, "validation", brut, validation.erreurs);
  const { demande, langue } = validation;

  // 2. Robot : on répond « succès » pour ne pas lui apprendre à contourner le filtre.
  if (estRobot(demande)) {
    d.journal.info("[contact] Envoi automatique ignoré (champ piège ou envoi trop rapide).");
    return { statut: "succes" };
  }

  // Rien de configuré : en développement on montre la demande dans la console ;
  // en production, jamais de faux succès.
  if (!d.base && !d.envoi) {
    if (!d.production) {
      d.journal.info("[contact] Mode développement (ni Supabase ni Resend configurés) — demande reçue :", demande);
      return { statut: "succes" };
    }
    d.journal.erreur("[contact] Ni Supabase ni Resend ne sont configurés : demande impossible à transmettre.", demande);
    return erreur(langue, "panne", brut);
  }

  // 3. Limitation par IP.
  let ipEmpreinte: string | null = null;
  if (d.ip && d.secretIp) ipEmpreinte = empreinteIp(d.ip, d.secretIp);
  else if (d.production) d.journal.avertir("[contact] IP ou secret d'empreinte absent : limite par IP non appliquée.");

  if (d.base && ipEmpreinte) {
    const base = d.base;
    const empreinte = ipEmpreinte;
    const decision = await verifierLimite(() => base.compterRecentes(empreinte, debutFenetre(d.maintenant)), d.journal.avertir);
    if (!decision.autorise) {
      d.journal.info("[contact] Limite par IP atteinte.");
      return erreur(langue, "limite", brut);
    }
  }

  // 4. Insertion en base.
  let id: string | null = null;
  if (d.base) {
    try {
      id = await d.base.inserer(ligne(demande, ipEmpreinte));
    } catch (e) {
      d.journal.erreur("[contact] Insertion en base impossible, on tente l'email.", e);
    }
  }

  // 5. Email à Cédric.
  let emailEnvoye = false;
  if (d.envoi) {
    try {
      await d.envoi.envoyer(emailNotification(demande, d.envoi.config));
      emailEnvoye = true;
    } catch (e) {
      d.journal.erreur("[contact] Email à Cédric non envoyé.", e);
    }
  } else {
    d.journal.erreur("[contact] Resend non configuré : la demande n'est qu'en base.");
  }

  if (!id && !emailEnvoye) {
    // Dernier recours : la demande reste au moins dans les logs du serveur.
    d.journal.erreur("[contact] Demande perdue (ni base ni email) :", demande);
    return erreur(langue, "panne", brut);
  }

  // 6. Accusé de réception (seulement si la demande a bien été transmise).
  let accuseEnvoye = false;
  if (d.envoi) {
    try {
      await d.envoi.envoyer(emailAccuse(demande, d.envoi.config));
      accuseEnvoye = true;
    } catch (e) {
      d.journal.avertir("[contact] Accusé de réception non envoyé.", e);
    }
  }

  // 7. Trace des envois, pour repérer en base les demandes à reprendre à la main.
  if (d.base && id) {
    try {
      await d.base.marquer(id, { email_envoye: emailEnvoye, accuse_envoye: accuseEnvoye });
    } catch (e) {
      d.journal.avertir("[contact] Mise à jour des indicateurs d'envoi impossible.", e);
    }
  }

  return { statut: "succes" };
}
