"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { clientAdmin } from "@/lib/supabase/admin";
import { ipDepuisEntetes } from "@/lib/contact/limite";
import { lireFormulaire } from "@/lib/contact/schema";
import { traiterDemande, type Base, type EtatFormulaire, type Envoi, type Journal } from "@/lib/contact/traitement";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public.
// Il n'exporte donc QUE l'action du formulaire ; toute la logique (validation,
// anti-robot, limitation, emails) vit dans lib/contact/, testée.

const TABLE = "demandes_contact";

/** Accès à la table via la clé service_role (null si Supabase n'est pas configuré). */
function base(): Base | null {
  const supabase = clientAdmin();
  if (!supabase) return null;
  return {
    async compterRecentes(ipEmpreinte, depuis) {
      const { count, error } = await supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("ip_empreinte", ipEmpreinte)
        .gte("created_at", depuis.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    async inserer(ligne) {
      const { data, error } = await supabase.from(TABLE).insert(ligne).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    async marquer(id, etat) {
      const { error } = await supabase.from(TABLE).update(etat).eq("id", id);
      if (error) throw error;
    },
  };
}

/** Envoi par Resend (null si la clé d'API manque). */
function envoi(): Envoi | null {
  const cle = process.env.resend_api_key;
  if (!cle) return null;
  const resend = new Resend(cle);
  return {
    config: {
      destinataire: process.env.contact_destinataire || "cedric@spiceevents.fr",
      expediteur: process.env.contact_expediteur || "Spice Events <contact@spiceevents.fr>",
    },
    async envoyer(email) {
      const { error } = await resend.emails.send(email);
      if (error) throw new Error(`${error.name} : ${error.message}`);
    },
  };
}

const journal: Journal = {
  info: (message, details) => (details === undefined ? console.info(message) : console.info(message, details)),
  avertir: (message, details) => (details === undefined ? console.warn(message) : console.warn(message, details)),
  erreur: (message, details) => (details === undefined ? console.error(message) : console.error(message, details)),
};

/** Action du formulaire de contact (utilisée avec `useActionState`). */
export async function envoyerDemande(_etat: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const entetes = await headers();
  return traiterDemande(lireFormulaire(formulaire), {
    maintenant: new Date(),
    production: process.env.NODE_ENV === "production",
    ip: ipDepuisEntetes(entetes.get("x-forwarded-for")),
    secretIp: process.env.contact_secret_ip || null,
    base: base(),
    envoi: envoi(),
    journal,
  });
}
