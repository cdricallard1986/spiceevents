import type { Langue, TypeEvenement } from "@/lib/contact/constantes";
import type { StatutDemande } from "./constantes";

/**
 * Une demande de contact telle que le back office la lit dans
 * `public.demandes_contact` — sans l'empreinte de l'IP, qui ne sert qu'à la
 * limite d'envoi du formulaire (minimisation des données).
 */
export type Demande = {
  id: string;
  /** Horodatage ISO de réception. */
  created_at: string;
  updated_at: string;
  langue: Langue;
  prenoms: string;
  nom: string;
  email: string;
  /** Format international (+33…), tel que le formulaire l'a normalisé. */
  telephone: string;
  type_evenement: TypeEvenement;
  /** AAAA-MM-JJ. */
  date_evenement: string | null;
  lieu: string | null;
  invites: number | null;
  message: string;
  /** false : l'email de notification n'est pas parti — demande à traiter à la main. */
  email_envoye: boolean;
  accuse_envoye: boolean;
  statut: StatutDemande;
  note_interne: string | null;
};

/** Colonnes lues par la liste, dans l'ordre du type. */
export const COLONNES_DEMANDE =
  "id, created_at, updated_at, langue, prenoms, nom, email, telephone, type_evenement, date_evenement, lieu, invites, message, email_envoye, accuse_envoye, statut, note_interne";

/** Ce que la fiche peut modifier, et ce que l'action renvoie après l'écriture. */
export type SuiviDemande = Pick<Demande, "id" | "statut" | "note_interne" | "updated_at">;

export const COLONNES_SUIVI = "id, statut, note_interne, updated_at";
