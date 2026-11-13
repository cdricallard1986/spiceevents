"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EtatMotDePasse } from "@/lib/admin/mot-de-passe";
import { LONGUEUR_MOT_DE_PASSE } from "@/lib/admin/mot-de-passe";
import { classesBouton } from "@/components/ui/Bouton";
import { useToasts } from "./Toasts";
import { CLASSES_LIBELLE } from "./champs";

type Props = { action: (entree: { nouveau: unknown; confirmation: unknown }) => Promise<EtatMotDePasse> };

const CLASSES_CHAMP = "w-full border bg-nuit px-3.5 py-3.5 text-base text-ivoire transition-colors focus:border-or";

/** Choix d'un nouveau mot de passe (deux saisies), décision par la Server Action. */
export function FormulaireMotDePasse({ action }: Props) {
  const [etat, envoyer, enCours] = useActionState(
    (_etat: EtatMotDePasse, f: FormData) => action({ nouveau: f.get("nouveau"), confirmation: f.get("confirmation") }),
    { statut: "initial" },
  );
  const { afficher } = useToasts();
  const formulaire = useRef<HTMLFormElement>(null);
  const erreurs = etat.statut === "erreur" ? etat.erreurs : {};

  useEffect(() => {
    if (etat.statut === "ok") {
      afficher("Mot de passe changé. Il servira dès votre prochaine connexion.");
      formulaire.current?.reset();
    }
    if (etat.statut === "erreur") afficher(etat.message, "erreur");
  }, [etat, afficher]);

  const champ = (nom: "nouveau" | "confirmation", libelle: string, aide?: string) => (
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
        aria-invalid={Boolean(erreurs[nom])}
        aria-describedby={erreurs[nom] ? `mdp-${nom}-erreur` : aide ? `mdp-${nom}-aide` : undefined}
        className={`${CLASSES_CHAMP} ${erreurs[nom] ? "border-erreur" : "border-ligne"}`}
      />
      {aide && !erreurs[nom] && (
        <p id={`mdp-${nom}-aide`} className="text-sm text-sable">
          {aide}
        </p>
      )}
      {erreurs[nom] && (
        <p id={`mdp-${nom}-erreur`} className="text-sm text-erreur">
          {erreurs[nom]}
        </p>
      )}
    </div>
  );

  return (
    <form ref={formulaire} action={envoyer} noValidate className="flex max-w-md flex-col gap-6">
      {champ("nouveau", "Nouveau mot de passe", "12 caractères au moins, avec minuscule, majuscule, chiffre et symbole.")}
      {champ("confirmation", "Confirmez-le")}
      <button type="submit" disabled={enCours} className={`${classesBouton("primaire")} self-start disabled:cursor-wait disabled:opacity-70`}>
        {enCours ? "Enregistrement…" : "Changer mon mot de passe"}
      </button>
    </form>
  );
}
