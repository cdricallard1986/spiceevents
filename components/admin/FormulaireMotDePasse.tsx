"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EtatMotDePasse } from "@/lib/admin/mot-de-passe";
import { LONGUEUR_MOT_DE_PASSE, accordSaisies, criteresMotDePasse } from "@/lib/admin/mot-de-passe";
import { classesBouton } from "@/components/ui/Bouton";
import { useToasts } from "./Toasts";
import { CLASSES_LIBELLE } from "./champs";

type Props = { action: (entree: { nouveau: unknown; confirmation: unknown }) => Promise<EtatMotDePasse> };

const CLASSES_CHAMP = "w-full border bg-nuit px-3.5 py-3.5 text-base text-ivoire transition-colors focus:border-or";

/**
 * Choix d'un nouveau mot de passe (deux saisies), décision par la Server Action.
 * Règle de Cédric : les critères se cochent pendant la frappe, et une ligne dit
 * si les deux saisies sont identiques dès qu'on commence la confirmation.
 */
export function FormulaireMotDePasse({ action }: Props) {
  const [etat, envoyer, enCours] = useActionState(
    (_etat: EtatMotDePasse, f: FormData) => action({ nouveau: f.get("nouveau"), confirmation: f.get("confirmation") }),
    { statut: "initial" },
  );
  const { afficher } = useToasts();
  const formulaire = useRef<HTMLFormElement>(null);
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const erreurs = etat.statut === "erreur" ? etat.erreurs : {};
  const criteres = criteresMotDePasse(nouveau);
  const accord = accordSaisies(nouveau, confirmation);

  useEffect(() => {
    if (etat.statut === "ok") {
      afficher("Mot de passe changé. Vos autres appareils sont déconnectés ; celui-ci reste connecté.");
      formulaire.current?.reset();
      setNouveau("");
      setConfirmation("");
    }
    if (etat.statut === "erreur") afficher(etat.message, "erreur");
  }, [etat, afficher]);

  const champ = (nom: "nouveau" | "confirmation", libelle: string, valeur: string, changer: (v: string) => void, suivi: React.ReactNode) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`mdp-${nom}`} className={CLASSES_LIBELLE}>
        {libelle}
      </label>
      <input
        id={`mdp-${nom}`}
        name={nom}
        type="password"
        required
        minLength={LONGUEUR_MOT_DE_PASSE.min}
        maxLength={LONGUEUR_MOT_DE_PASSE.max}
        autoComplete="new-password"
        value={valeur}
        onChange={(e) => changer(e.target.value)}
        aria-invalid={Boolean(erreurs[nom])}
        aria-describedby={`mdp-${nom}-suivi${erreurs[nom] ? ` mdp-${nom}-erreur` : ""}`}
        className={`${CLASSES_CHAMP} ${erreurs[nom] ? "border-erreur" : "border-ligne"}`}
      />
      <div id={`mdp-${nom}-suivi`} aria-live="polite">
        {suivi}
      </div>
      {erreurs[nom] && (
        <p id={`mdp-${nom}-erreur`} className="text-sm text-erreur">
          {erreurs[nom]}
        </p>
      )}
    </div>
  );

  return (
    <form ref={formulaire} action={envoyer} noValidate className="flex max-w-md flex-col gap-6">
      {champ(
        "nouveau",
        "Nouveau mot de passe",
        nouveau,
        setNouveau,
        <ul className="flex flex-col gap-1 text-sm" aria-label="Règles du mot de passe">
          {criteres.map((c) => (
            <li key={c.cle} className={`flex items-center gap-2 transition-colors ${c.ok ? "text-succes" : "text-sable"}`}>
              <span aria-hidden="true" className="inline-flex w-4 justify-center">
                {c.ok ? "✓" : "·"}
              </span>
              {c.libelle}
              <span className="sr-only">{c.ok ? " : respecté" : " : manquant"}</span>
            </li>
          ))}
        </ul>,
      )}
      {champ(
        "confirmation",
        "Confirmez-le",
        confirmation,
        setConfirmation,
        accord === "vide" ? null : (
          <p className={`text-sm ${accord === "identiques" ? "text-succes" : "text-erreur"}`}>
            {accord === "identiques" ? "✓ Les mots de passe sont identiques" : "Les mots de passe ne sont pas identiques"}
          </p>
        ),
      )}
      <button type="submit" disabled={enCours} className={`${classesBouton("primaire")} self-start disabled:cursor-wait disabled:opacity-70`}>
        {enCours ? "Enregistrement…" : "Changer mon mot de passe"}
      </button>
    </form>
  );
}
