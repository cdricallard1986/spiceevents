"use client";

import { useId, type ReactNode } from "react";
import { LIBELLES_TYPE } from "@/lib/contact/constantes";
import {
  formaterDateEvenement,
  formaterInvites,
  formaterReception,
  lienAppel,
  lienEcrire,
  lienWhatsApp,
  noteTropLongue,
  telephoneAffiche,
} from "@/lib/demandes/admin";
import { LIBELLES_LANGUE, LIBELLES_STATUT, LIMITE_NOTE, STATUTS, type StatutDemande } from "@/lib/demandes/constantes";
import type { FormulaireSuivi } from "@/lib/demandes/schema";
import type { Demande } from "@/lib/demandes/types";
import { classesBouton } from "@/components/ui/Bouton";
import { CLASSES_AIDE, CLASSES_CHAMP, CLASSES_CHAMP_ERREUR, CLASSES_LIBELLE } from "./champs";

type Props = {
  demande: Demande;
  /** Statut et note, contrôlés par `useModalAutosave` (toujours éditables). */
  valeur: FormulaireSuivi;
  modifier: (maj: Partial<FormulaireSuivi>) => void;
};

/**
 * Fiche d'une demande de contact : coordonnées et liens (appeler, écrire,
 * WhatsApp), détails de l'événement, message tel qu'il a été saisi (texte
 * brut, jamais interprété en HTML), puis le suivi : statut et note interne.
 */
export function FicheDemande({ demande: d, valeur, modifier }: Props) {
  const id = useId();
  const appel = lienAppel(d.telephone);
  const ecrire = lienEcrire(d.email, d.langue);
  const whatsapp = lienWhatsApp(d.telephone);
  const n = Array.from(valeur.note_interne.trim()).length;
  const depasse = noteTropLongue(valeur.note_interne);

  return (
    <div className="flex flex-col gap-8">
      {!d.email_envoye && (
        <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          <strong className="font-semibold text-erreur">Email non reçu — à traiter à la main.</strong> L&apos;email de notification de cette demande
          n&apos;est pas parti : elle n&apos;existe qu&apos;ici.
          {!d.accuse_envoye && " Le client n'a pas non plus reçu d'accusé de réception."}
        </p>
      )}

      <section aria-labelledby={`${id}-contact`}>
        <h3 id={`${id}-contact`} className="sr-only">
          Contacter
        </h3>
        <div className="flex flex-wrap gap-3">
          {appel && (
            <a href={appel} className={classesBouton("primaire")}>
              Appeler
            </a>
          )}
          {ecrire && (
            <a href={ecrire} className={classesBouton("contour")}>
              Écrire
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={classesBouton("contour")}>
              WhatsApp
            </a>
          )}
        </div>
        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Info libelle="Téléphone">
            <span className="tabular-nums">{telephoneAffiche(d.telephone)}</span>
          </Info>
          <Info libelle="Email">
            <span className="break-all">{d.email}</span>
          </Info>
        </dl>
      </section>

      <section aria-labelledby={`${id}-evenement`} className="border-t border-ligne pt-6">
        <h3 id={`${id}-evenement`} className="mb-5 text-lg font-semibold text-ivoire">
          La demande
        </h3>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Info libelle="Reçue le">{formaterReception(d.created_at)}</Info>
          <Info libelle="Langue de la demande">{LIBELLES_LANGUE[d.langue]}</Info>
          <Info libelle="Type d'événement">{LIBELLES_TYPE.fr[d.type_evenement]}</Info>
          <Info libelle="Date de l'événement">{formaterDateEvenement(d.date_evenement) ?? <Vide>Non précisée</Vide>}</Info>
          <Info libelle="Lieu">{d.lieu ?? <Vide>Non précisé</Vide>}</Info>
          <Info libelle="Invités">{formaterInvites(d.invites) ?? <Vide>Non précisé</Vide>}</Info>
          {d.email_envoye && (
            <Info libelle="Accusé de réception">{d.accuse_envoye ? "Envoyé au client" : <span className="text-erreur">Non envoyé au client</span>}</Info>
          )}
        </dl>
        <p className={`${CLASSES_LIBELLE} mt-6 mb-2`}>Message</p>
        {/* Texte brut : React l'échappe, les retours à la ligne sont conservés. */}
        <p lang={d.langue} className="whitespace-pre-wrap break-words border-l-2 border-or bg-nuit-3 px-4 py-3 text-ivoire">
          {d.message}
        </p>
      </section>

      <fieldset className="border-t border-ligne pt-6">
        <legend className="pr-3 text-lg font-semibold text-ivoire">Suivi</legend>
        <p className={`${CLASSES_AIDE} -mt-1 mb-5`}>Enregistré automatiquement, visible seulement dans le back office.</p>
        <div className="grid gap-6">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <label htmlFor={`${id}-statut`} className={CLASSES_LIBELLE}>
              Statut
            </label>
            <select
              id={`${id}-statut`}
              value={valeur.statut}
              onChange={(e) => modifier({ statut: e.target.value as StatutDemande })}
              className={CLASSES_CHAMP}
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-note`} className={CLASSES_LIBELLE}>
                Note interne
              </label>
              <span id={`${id}-compteur`} className={`text-xs tabular-nums ${depasse ? "text-erreur" : "text-sable/70"}`}>
                {n.toLocaleString("fr-FR")} / {LIMITE_NOTE.toLocaleString("fr-FR")}
                <span className="sr-only"> caractères</span>
              </span>
            </div>
            <textarea
              id={`${id}-note`}
              rows={6}
              value={valeur.note_interne}
              onChange={(e) => modifier({ note_interne: e.target.value })}
              aria-describedby={`${id}-compteur ${id}-aide`}
              {...(depasse ? { "aria-invalid": true as const } : {})}
              placeholder="Rappelée le…, budget, prochaine étape…"
              className={depasse ? CLASSES_CHAMP_ERREUR : CLASSES_CHAMP}
            />
            <p id={`${id}-aide`} className={CLASSES_AIDE}>
              Pour vous seulement : jamais envoyée au client.
            </p>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

function Info({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className={CLASSES_LIBELLE}>{libelle}</dt>
      <dd className="text-ivoire">{children}</dd>
    </div>
  );
}

function Vide({ children }: { children: ReactNode }) {
  return <span className="text-sable/70">{children}</span>;
}
