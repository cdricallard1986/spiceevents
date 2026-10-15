"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import type { TextesFormulaire } from "@/contenu/pages/contact";
import type { Locale } from "@/i18n/routing";
import { LIBELLES_TYPE, LIMITES, TYPES_EVENEMENT, type Champ } from "@/lib/contact/constantes";
import type { EtatFormulaire } from "@/lib/contact/traitement";
import { Accent } from "@/components/common/Accent";
import { classesBouton } from "@/components/ui/Bouton";

type Props = {
  /** Server Action `envoyerDemande` (injectée pour pouvoir tester le composant). */
  action: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>;
  locale: Locale;
  textes: TextesFormulaire;
};

/** Types qu'on peut pré-sélectionner par l'adresse (`/contact?type=mariage`). */
const TYPES_PRESELECTION = ["mariage", "prive", "entreprise"];

const DUREE_TOAST_MS = 8000;

const CLASSES_CHAMP =
  "w-full border bg-nuit-2 px-3.5 py-3.5 text-base text-ivoire placeholder:text-sable/50 transition-colors focus:border-or";

/**
 * Formulaire de demande de devis. Toute la validation est faite par la Server
 * Action ; ici on se contente d'afficher ses erreurs (bordure rouge, message
 * sous le champ, toast en haut de l'écran). Les champs ne sont jamais
 * désactivés pendant l'envoi : seul le bouton indique qu'il est en cours.
 */
export function FormulaireContact({ action, locale, textes }: Props) {
  // Moment d'ouverture du formulaire : un envoi en moins de 3 s est un robot.
  const ouvertLe = useRef(0);
  const refType = useRef<HTMLSelectElement>(null);
  const refDate = useRef<HTMLInputElement>(null);
  const refConfirmation = useRef<HTMLDivElement>(null);
  const refFormulaire = useRef<HTMLFormElement>(null);

  const [etat, envoyer, enCours] = useActionState(action, { statut: "initial" });
  // Le toast se ferme (bouton ou minuterie) sans effacer les erreurs des champs.
  const [toastFerme, setToastFerme] = useState<EtatFormulaire | null>(null);

  const erreurs = etat.statut === "erreur" ? etat.erreurs : {};
  const valeur = (champ: Champ) => (etat.statut === "erreur" ? (etat.valeurs[champ] ?? "") : "");

  useEffect(() => {
    ouvertLe.current = Date.now();
    // Date minimale = aujourd'hui (posée ici : la page est générée à l'avance).
    if (refDate.current) {
      const d = new Date();
      refDate.current.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    const type = new URLSearchParams(window.location.search).get("type");
    if (type && TYPES_PRESELECTION.includes(type) && refType.current && !refType.current.value) {
      refType.current.value = type;
    }
  }, []);

  useEffect(() => {
    if (etat.statut === "succes") {
      refConfirmation.current?.focus();
      refConfirmation.current?.scrollIntoView?.({ block: "center" });
    }
    if (etat.statut === "erreur") {
      // Place le curseur sur le premier champ fautif.
      const premier = refFormulaire.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      premier?.focus();
      const minuterie = window.setTimeout(() => setToastFerme(etat), DUREE_TOAST_MS);
      return () => window.clearTimeout(minuterie);
    }
  }, [etat]);

  if (etat.statut === "succes") {
    return (
      <div ref={refConfirmation} tabIndex={-1} role="status" className="border border-ligne bg-nuit-2 p-8 outline-none md:p-12">
        <p className="font-display text-3xl leading-[1.15] md:text-4xl">
          <Accent texte={textes.succesTitre} />
        </p>
        <p className="mt-6 text-lg text-sable">{textes.succesTexte}</p>
        <p className="mt-4 text-sm text-sable">{textes.succesSpam}</p>
      </div>
    );
  }

  /** Ajoute les horodatages au moment de l'envoi, puis appelle la Server Action. */
  function soumettre(formulaire: FormData) {
    formulaire.set("ouvert_le", String(ouvertLe.current));
    formulaire.set("envoye_le", String(Date.now()));
    envoyer(formulaire);
  }

  const attributs = (champ: Champ) => ({
    id: `contact-${champ}`,
    name: champ,
    "aria-invalid": Boolean(erreurs[champ]),
    "aria-describedby": erreurs[champ] ? `contact-${champ}-erreur` : undefined,
    className: `${CLASSES_CHAMP} ${erreurs[champ] ? "border-erreur" : "border-ligne"}`,
  });

  return (
    <>
      {etat.statut === "erreur" && toastFerme !== etat && (
        <div
          role="alert"
          className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-start gap-4 rounded-2xl border border-erreur sm:rounded-full bg-nuit-2 px-5 py-2.5 text-sm text-ivoire shadow-lg"
        >
          <p className="flex-1">{etat.message}</p>
          <button
            type="button"
            onClick={() => setToastFerme(etat)}
            aria-label={textes.fermer}
            className="text-lg leading-none text-sable hover:text-or"
          >
            ×
          </button>
        </div>
      )}

      <form ref={refFormulaire} action={soumettre} noValidate className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
        <input type="hidden" name="langue" value={locale} />

        <Champ champ="prenoms" libelle={textes.prenoms} erreur={erreurs.prenoms}>
          <input
            {...attributs("prenoms")}
            type="text"
            required
            maxLength={LIMITES.nom}
            autoComplete="given-name"
            placeholder={textes.prenomsExemple}
            defaultValue={valeur("prenoms")}
          />
        </Champ>

        <Champ champ="nom" libelle={textes.nom} erreur={erreurs.nom}>
          <input {...attributs("nom")} type="text" required maxLength={LIMITES.nom} autoComplete="family-name" defaultValue={valeur("nom")} />
        </Champ>

        <Champ champ="email" libelle={textes.email} erreur={erreurs.email}>
          <input
            {...attributs("email")}
            type="email"
            required
            maxLength={LIMITES.email}
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            defaultValue={valeur("email")}
          />
        </Champ>

        <Champ champ="telephone" libelle={textes.telephone} erreur={erreurs.telephone}>
          <input {...attributs("telephone")} type="tel" required autoComplete="tel" inputMode="tel" defaultValue={valeur("telephone")} />
        </Champ>

        <Champ champ="type" libelle={textes.type} erreur={erreurs.type}>
          <select {...attributs("type")} ref={refType} required defaultValue={valeur("type")}>
            <option value="" disabled>
              {textes.typeChoisir}
            </option>
            {TYPES_EVENEMENT.map((t) => (
              <option key={t} value={t}>
                {LIBELLES_TYPE[locale][t]}
              </option>
            ))}
          </select>
        </Champ>

        <Champ champ="date" libelle={textes.date} facultatif={textes.facultatif} erreur={erreurs.date}>
          <input {...attributs("date")} ref={refDate} type="date" autoComplete="off" defaultValue={valeur("date")} />
        </Champ>

        <Champ champ="lieu" libelle={textes.lieu} facultatif={textes.facultatif} erreur={erreurs.lieu}>
          <input
            {...attributs("lieu")}
            type="text"
            maxLength={LIMITES.lieu}
            autoComplete="off"
            placeholder={textes.lieuExemple}
            defaultValue={valeur("lieu")}
          />
        </Champ>

        <Champ champ="invites" libelle={textes.invites} facultatif={textes.facultatif} erreur={erreurs.invites}>
          <input
            {...attributs("invites")}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            defaultValue={valeur("invites")}
          />
        </Champ>

        <Champ champ="message" libelle={textes.message} erreur={erreurs.message} large>
          <textarea
            {...attributs("message")}
            required
            rows={6}
            maxLength={LIMITES.message}
            placeholder={textes.messageExemple}
            defaultValue={valeur("message")}
          />
        </Champ>

        {/* Champ piège : invisible et hors du parcours clavier ; un robot le remplit. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-site_web">{textes.piege}</label>
          <input id="contact-site_web" type="text" name="site_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        {erreurs.formulaire && (
          <p role="alert" className="text-sm text-erreur sm:col-span-2">
            {erreurs.formulaire}
          </p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className={`${classesBouton("primaire")} w-full disabled:cursor-wait disabled:opacity-70 sm:col-span-2`}
        >
          {enCours ? textes.envoiEnCours : textes.envoyer}
        </button>
      </form>
    </>
  );
}

/** Libellé + champ + message d'erreur sous le champ. */
function Champ({
  champ,
  libelle,
  facultatif,
  erreur,
  large = false,
  children,
}: {
  champ: Champ;
  libelle: string;
  facultatif?: string;
  erreur?: string;
  large?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${large ? "sm:col-span-2" : ""}`}>
      <label htmlFor={`contact-${champ}`} className="text-[0.8125rem] tracking-[0.08em] text-sable">
        {libelle}
        {facultatif && <span className="text-sable/60"> · {facultatif}</span>}
      </label>
      {children}
      {erreur && (
        <p id={`contact-${champ}-erreur`} className="text-sm text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}
