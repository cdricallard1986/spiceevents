import "server-only";
import { Resend } from "resend";
import { configEmail } from "./config-email";
import type { ConfigEmail, EmailPrepare } from "./email";
import type { Envoi } from "./traitement";

/**
 * Envoi des emails par Resend, partagé par le formulaire de contact et la page
 * de test des emails du back office. Clé lue dans la variable Vercel
 * `resend_api_key` ; null si elle manque.
 */

export type ResultatEnvoi = { ok: true; id: string | null } | { ok: false; nom: string; message: string };

export type ExpediteurResend = {
  config: ConfigEmail;
  /** Ne lève jamais : renvoie l'erreur de Resend (`name` + `message`) telle quelle. */
  envoyer(email: EmailPrepare): Promise<ResultatEnvoi>;
};

export function expediteurResend(): ExpediteurResend | null {
  const cle = process.env.resend_api_key;
  if (!cle) return null;
  const resend = new Resend(cle);
  return {
    config: configEmail(process.env),
    async envoyer(email) {
      try {
        const { data, error } = await resend.emails.send(email);
        if (error) return { ok: false, nom: error.name, message: error.message };
        return { ok: true, id: data?.id ?? null };
      } catch (e) {
        return { ok: false, nom: e instanceof Error ? e.name : "erreur", message: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}

/** Envoi du formulaire de contact (null si la clé d'API manque) : lève une erreur si l'email n'est pas parti. */
export function envoi(): Envoi | null {
  const expediteur = expediteurResend();
  if (!expediteur) return null;
  return {
    config: expediteur.config,
    async envoyer(email) {
      const resultat = await expediteur.envoyer(email);
      if (!resultat.ok) throw new Error(`${resultat.nom} : ${resultat.message}`);
    },
  };
}
