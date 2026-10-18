"use client";

import { useState, useTransition } from "react";
import type { EntreeEnvoiTest, EtatEnvoiTest, Modele } from "@/lib/admin/emails-test";
import type { Langue } from "@/lib/contact/constantes";
import { classesBouton } from "@/components/ui/Bouton";
import { useToasts } from "./Toasts";

export type Apercu = { subject: string; from: string; to: string; replyTo: string; html: string };

type Props = {
  /** Server Action `envoyerEmailTest` (injectée pour pouvoir tester le composant). */
  action: (entree: EntreeEnvoiTest) => Promise<EtatEnvoiTest>;
  /** Adresse du compte connecté : seul destinataire possible. */
  destinataire: string;
  /** `resend_api_key` présente dans cet environnement. */
  resendConfigure: boolean;
  modeles: { valeur: Modele; libelle: string }[];
  /** Aperçus calculés par le serveur, par `${modele}-${langue}`. */
  apercus: Record<string, Apercu>;
};

const LANGUES: { valeur: Langue; libelle: string }[] = [
  { valeur: "fr", libelle: "Français" },
  { valeur: "en", libelle: "Anglais" },
];

// Mêmes champs que les formulaires du site et de la connexion.
const CLASSES_CHAMP = "w-full border border-ligne bg-nuit px-3.5 py-3.5 text-base text-ivoire transition-colors focus:border-or";
const CLASSES_LIBELLE = "text-[0.8125rem] tracking-[0.08em] text-sable";

/**
 * Choix du modèle et de la langue, aperçu du rendu (sans envoyer), puis envoi
 * réel par Resend au compte connecté.
 */
export function EnvoiEmailsTest({ action, destinataire, resendConfigure, modeles, apercus }: Props) {
  const [modele, setModele] = useState<Modele>(modeles[0].valeur);
  const [langue, setLangue] = useState<Langue>("fr");
  const [etat, setEtat] = useState<EtatEnvoiTest>({ statut: "initial" });
  const [enCours, demarrer] = useTransition();
  const { afficher } = useToasts();

  const apercu = apercus[`${modele}-${langue}`];

  function envoyer() {
    demarrer(async () => {
      try {
        const resultat = await action({ modele, langue });
        setEtat(resultat);
        if (resultat.statut !== "initial") afficher(resultat.message, resultat.statut === "succes" ? "succes" : "erreur");
      } catch {
        const message = "L'envoi n'a pas pu être lancé. Rechargez la page (la session a peut-être expiré) puis réessayez.";
        setEtat({ statut: "erreur", message });
        afficher(message, "erreur");
      }
    });
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="email-test-modele" className={CLASSES_LIBELLE}>
            Modèle
          </label>
          <select id="email-test-modele" value={modele} onChange={(e) => setModele(e.target.value as Modele)} className={CLASSES_CHAMP}>
            {modeles.map((m) => (
              <option key={m.valeur} value={m.valeur}>
                {m.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email-test-langue" className={CLASSES_LIBELLE}>
            Langue de la demande
          </label>
          <select id="email-test-langue" value={langue} onChange={(e) => setLangue(e.target.value as Langue)} className={CLASSES_CHAMP}>
            {LANGUES.map((l) => (
              <option key={l.valeur} value={l.valeur}>
                {l.libelle}
              </option>
            ))}
          </select>
          {modele === "notification" && (
            <p className="text-xs text-sable/80">La notification est toujours en français ; elle indique la langue dans laquelle répondre.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className={CLASSES_LIBELLE}>Destinataire</p>
          <p className="border border-ligne bg-nuit-2 px-3.5 py-3.5 text-ivoire" aria-describedby="email-test-destinataire-aide">
            {destinataire || "aucune adresse sur ce compte"}
          </p>
          <p id="email-test-destinataire-aide" className="text-xs text-sable/80">
            Toujours l&apos;adresse du compte connecté : un test ne part jamais ailleurs.
          </p>
        </div>

        {!resendConfigure && (
          <p className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            La variable <code className="font-mono">resend_api_key</code> est absente de cet environnement Vercel : l&apos;aperçu fonctionne, l&apos;envoi
            échouera.
          </p>
        )}

        <button type="button" onClick={envoyer} disabled={enCours} className={`${classesBouton("primaire")} w-full disabled:cursor-wait disabled:opacity-70`}>
          {enCours ? "Envoi…" : "Envoyer le test"}
        </button>

        {etat.statut !== "initial" && (
          <p
            role={etat.statut === "erreur" ? "alert" : "status"}
            className={`border-l-2 bg-nuit-3 px-4 py-3 text-sm text-ivoire ${etat.statut === "erreur" ? "border-erreur" : "border-succes"}`}
          >
            {etat.message}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="surtitre mb-3">Aperçu</p>
        {apercu && (
          <>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              <dt className="text-sable">Objet</dt>
              <dd className="break-words text-ivoire">{apercu.subject}</dd>
              <dt className="text-sable">De</dt>
              <dd className="break-words text-ivoire">{apercu.from}</dd>
              <dt className="text-sable">À</dt>
              <dd className="break-words text-ivoire">{apercu.to}</dd>
              <dt className="text-sable">Répondre à</dt>
              <dd className="break-words text-ivoire">{apercu.replyTo}</dd>
            </dl>
            {/* Cadre sans script ni accès à la page (sandbox vide) : on voit le rendu, rien ne s'exécute. */}
            <iframe
              key={`${modele}-${langue}`}
              title={`Aperçu de l'email : ${modeles.find((m) => m.valeur === modele)?.libelle ?? modele}, ${langue === "fr" ? "français" : "anglais"}`}
              srcDoc={apercu.html}
              sandbox=""
              className="mt-4 h-[44rem] w-full border border-ligne bg-white"
            />
          </>
        )}
      </div>
    </div>
  );
}
