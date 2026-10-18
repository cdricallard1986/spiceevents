import { z } from "zod";
import { emailAccuse, emailNotification, type ConfigEmail, type EmailPrepare } from "@/lib/contact/email";
import type { ExpediteurResend } from "@/lib/contact/resend";
import type { Demande, Langue } from "@/lib/contact/schema";

/**
 * Page de test des emails du back office (logique pure, testée) : les VRAIS
 * modèles du formulaire (lib/contact/email.ts), remplis avec une demande
 * fictive clairement marquée, objet préfixé « [TEST] », et adressés
 * UNIQUEMENT au compte connecté.
 */

export const MODELES = ["notification", "accuse"] as const;
export type Modele = (typeof MODELES)[number];

export const LIBELLES_MODELE: Record<Modele, string> = {
  notification: "Notification à Cédric",
  accuse: "Accusé de réception au couple",
};

export const PREFIXE_TEST = "[TEST] ";

/** Délai minimal entre deux envois de test. */
export const INTERVALLE_ENVOIS_MS = 10_000;

/** Entrée de la Server Action : rien d'autre (surtout pas d'adresse). */
export const schemaEnvoiTest = z.object({ modele: z.enum(MODELES), langue: z.enum(["fr", "en"]) }).strict();

export type EntreeEnvoiTest = z.infer<typeof schemaEnvoiTest>;

/** Date de l'événement fictif : dans un an, au format AAAA-MM-JJ. */
function dansUnAn(maintenant: Date): string {
  const d = new Date(Date.UTC(maintenant.getUTCFullYear() + 1, maintenant.getUTCMonth(), Math.min(maintenant.getUTCDate(), 28)));
  return d.toISOString().slice(0, 10);
}

/** Demande fictive, marquée « test » partout où un texte libre apparaît. */
export function demandeFictive(langue: Langue, maintenant: Date): Demande {
  return {
    prenoms: langue === "fr" ? "Camille et Alex (test)" : "Camille and Alex (test)",
    nom: "Exemple",
    email: "couple.test@example.com",
    telephone: "+33600000000",
    type: "mariage",
    date: dansUnAn(maintenant),
    lieu: "Lieu fictif (test), Île-de-France",
    invites: 120,
    message:
      "DEMANDE FICTIVE — email de test envoyé depuis le back office (page Emails).\nAucune suite à donner : ce couple n'existe pas.",
    langue,
    site_web: "",
    ouvert_le: 0,
    envoye_le: 0,
  };
}

/**
 * Email de test prêt à partir : le modèle réel, puis
 * - destinataire remplacé par l'adresse du compte connecté (jamais une saisie) ;
 * - « Répondre » de la notification vers cette même adresse (pas vers le couple fictif) ;
 * - objet préfixé « [TEST] ».
 */
export function emailDeTest(entree: EntreeEnvoiTest, destinataire: string, config: ConfigEmail, maintenant: Date): EmailPrepare {
  const demande = demandeFictive(entree.langue, maintenant);
  const email = entree.modele === "notification" ? emailNotification(demande, config) : emailAccuse(demande, config);
  return {
    ...email,
    to: destinataire,
    replyTo: entree.modele === "notification" ? destinataire : email.replyTo,
    subject: `${PREFIXE_TEST}${email.subject}`,
  };
}

// --- Limite des envois ---------------------------------------------------------

export type Limiteur = {
  /** Réserve un envoi pour `cle` ; sinon indique le temps d'attente restant. */
  reserver(cle: string, maintenant: number): { autorise: true } | { autorise: false; attenteMs: number };
};

/**
 * Un envoi toutes les `intervalleMs` par clé (le compte connecté). En mémoire :
 * propre à chaque instance du serveur, ce qui suffit contre un double clic ou
 * une boucle accidentelle — ce n'est pas une limite de sécurité.
 */
export function creerLimiteur(intervalleMs: number = INTERVALLE_ENVOIS_MS): Limiteur {
  const derniers = new Map<string, number>();
  return {
    reserver(cle, maintenant) {
      const dernier = derniers.get(cle);
      if (dernier !== undefined && maintenant - dernier < intervalleMs) {
        return { autorise: false, attenteMs: intervalleMs - (maintenant - dernier) };
      }
      // Ménage : on ne garde que les envois récents.
      for (const [c, t] of derniers) if (maintenant - t >= intervalleMs) derniers.delete(c);
      derniers.set(cle, maintenant);
      return { autorise: true };
    },
  };
}

// --- Réponse affichée -------------------------------------------------------------

export type EtatEnvoiTest =
  | { statut: "initial" }
  | { statut: "succes"; message: string }
  | { statut: "erreur"; message: string };

export const MESSAGES_ENVOI = {
  invalide: "Choix invalide : rechargez la page puis réessayez.",
  sansEmail: "Le compte connecté n'a pas d'adresse email : envoi impossible.",
  nonConfigure: "La variable resend_api_key est absente de cet environnement Vercel : aucun email ne peut partir.",
  attente: (ms: number) => `Un envoi toutes les 10 secondes au plus : réessayez dans ${Math.ceil(ms / 1000)} s.`,
  refuse: (nom: string, message: string) => `Resend a refusé l'envoi — ${nom} : ${message}`,
  envoye: (destinataire: string, id: string | null) => `Email de test envoyé à ${destinataire}${id ? ` (identifiant Resend : ${id})` : ""}.`,
} as const;

export type DependancesEnvoiTest = {
  /** Adresse du compte connecté (`utilisateur.email`). */
  destinataire: string | null | undefined;
  /** Clé de la limite (identifiant du compte). */
  cle: string;
  /** null = `resend_api_key` absente. */
  expediteur: Pick<ExpediteurResend, "config" | "envoyer"> | null;
  limiteur: Limiteur;
  maintenant: Date;
};

/** Validation, limite, envoi : la Server Action n'y ajoute que la garde. */
export async function traiterEnvoiTest(brut: unknown, d: DependancesEnvoiTest): Promise<EtatEnvoiTest> {
  const entree = schemaEnvoiTest.safeParse(brut);
  if (!entree.success) return { statut: "erreur", message: MESSAGES_ENVOI.invalide };
  if (!d.destinataire) return { statut: "erreur", message: MESSAGES_ENVOI.sansEmail };
  if (!d.expediteur) return { statut: "erreur", message: MESSAGES_ENVOI.nonConfigure };

  const reservation = d.limiteur.reserver(d.cle, d.maintenant.getTime());
  if (!reservation.autorise) return { statut: "erreur", message: MESSAGES_ENVOI.attente(reservation.attenteMs) };

  const resultat = await d.expediteur.envoyer(emailDeTest(entree.data, d.destinataire, d.expediteur.config, d.maintenant));
  if (!resultat.ok) return { statut: "erreur", message: MESSAGES_ENVOI.refuse(resultat.nom, resultat.message) };
  return { statut: "succes", message: MESSAGES_ENVOI.envoye(d.destinataire, resultat.id) };
}
