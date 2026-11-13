"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import type { EtatReinitialisation } from "@/lib/admin/reinitialisation";
import { LIMITES_CONNEXION } from "@/lib/admin/constantes";
import { CHEMIN_CONNEXION } from "@/lib/admin/session";
import { classesBouton } from "@/components/ui/Bouton";
import { useToasts } from "./Toasts";
import { CLASSES_BANDEAU, CLASSES_LIBELLE } from "./champs";

type Props = { action: (etat: EtatReinitialisation, formulaire: FormData) => Promise<EtatReinitialisation> };

const CLASSES_CHAMP =
  "w-full border bg-nuit px-3.5 py-3.5 text-base text-ivoire placeholder:text-sable/50 transition-colors focus:border-or";

/**
 * Demande d'un lien de nouveau mot de passe. La réponse est la même que
 * l'adresse corresponde au compte ou non (rien n'est révélé) ; toute la
 * décision est prise par la Server Action.
 */
export function FormulaireOubli({ action }: Props) {
  const [etat, envoyer, enCours] = useActionState(action, { statut: "initial" });
  const { afficher } = useToasts();
  const erreur = etat.statut === "erreur" ? etat.message : null;

  useEffect(() => {
    if (etat.statut === "erreur") afficher(etat.message, "erreur");
  }, [etat, afficher]);

  if (etat.statut === "envoye") {
    return (
      <div className="flex flex-col gap-6">
        <p role="status" className={CLASSES_BANDEAU}>
          {etat.message}
        </p>
        <p className="text-sm text-sable">Pensez à regarder dans les indésirables. Rien reçu après quelques minutes ? Refaites la demande.</p>
        <Link href={CHEMIN_CONNEXION} className={`${classesBouton("contour")} self-start`}>
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={envoyer} noValidate className="flex flex-col gap-6">
      <p className="text-sable">Indiquez l&apos;adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
      <div className="flex flex-col gap-2">
        <label htmlFor="oubli-email" className={CLASSES_LIBELLE}>
          Email
        </label>
        <input
          id="oubli-email"
          name="email"
          type="email"
          required
          maxLength={LIMITES_CONNEXION.email}
          autoComplete="username"
          inputMode="email"
          spellCheck={false}
          autoFocus
          defaultValue={etat.statut === "erreur" ? etat.email : ""}
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur ? "oubli-email-erreur" : undefined}
          className={`${CLASSES_CHAMP} ${erreur ? "border-erreur" : "border-ligne"}`}
        />
        {erreur && (
          <p id="oubli-email-erreur" className="text-sm text-erreur">
            {erreur}
          </p>
        )}
      </div>
      <button type="submit" disabled={enCours} className={`${classesBouton("primaire")} w-full disabled:cursor-wait disabled:opacity-70`}>
        {enCours ? "Envoi…" : "Recevoir le lien"}
      </button>
      <Link href={CHEMIN_CONNEXION} className="-my-2.5 self-start py-2.5 text-sm text-sable underline underline-offset-4 hover:text-or">
        Je me souviens de mon mot de passe
      </Link>
    </form>
  );
}
