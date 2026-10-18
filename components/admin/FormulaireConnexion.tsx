"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EtatConnexion } from "@/lib/admin/connexion";
import { LIMITES_CONNEXION, type ChampConnexion } from "@/lib/admin/constantes";
import { classesBouton } from "@/components/ui/Bouton";
import { useToasts } from "./Toasts";

type Props = {
  /** Server Action `seConnecter` (injectée pour pouvoir tester le composant). */
  action: (etat: EtatConnexion, formulaire: FormData) => Promise<EtatConnexion>;
  /** Page où revenir après la connexion (validée de nouveau par le serveur). */
  suite?: string;
};

// Mêmes champs que le formulaire de contact du site.
const CLASSES_CHAMP =
  "w-full border bg-nuit px-3.5 py-3.5 text-base text-ivoire placeholder:text-sable/50 transition-colors focus:border-or";

/**
 * Formulaire de connexion au back office. Toute la décision est prise par la
 * Server Action ; ici on affiche ses erreurs (bordure rouge, message sous le
 * champ, toast en haut de l'écran). Les champs ne sont jamais désactivés.
 */
export function FormulaireConnexion({ action, suite }: Props) {
  const [etat, envoyer, enCours] = useActionState(action, { statut: "initial" });
  const { afficher } = useToasts();
  const refFormulaire = useRef<HTMLFormElement>(null);

  const erreurs = etat.statut === "erreur" ? etat.erreurs : {};

  useEffect(() => {
    if (etat.statut !== "erreur") return;
    afficher(etat.message, "erreur");
    const premier = refFormulaire.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    (premier ?? refFormulaire.current?.querySelector<HTMLElement>("input[name='motDePasse']"))?.focus();
  }, [etat, afficher]);

  const attributs = (champ: ChampConnexion) => ({
    id: `connexion-${champ}`,
    name: champ,
    "aria-invalid": Boolean(erreurs[champ]),
    "aria-describedby": erreurs[champ] ? `connexion-${champ}-erreur` : undefined,
    className: `${CLASSES_CHAMP} ${erreurs[champ] ? "border-erreur" : "border-ligne"}`,
  });

  return (
    <form ref={refFormulaire} action={envoyer} noValidate className="flex flex-col gap-6">
      {suite && <input type="hidden" name="suite" value={suite} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="connexion-email" className="text-[0.8125rem] tracking-[0.08em] text-sable">
          Email
        </label>
        <input
          {...attributs("email")}
          type="email"
          required
          maxLength={LIMITES_CONNEXION.email}
          autoComplete="username"
          inputMode="email"
          spellCheck={false}
          autoFocus
          defaultValue={etat.statut === "erreur" ? etat.email : ""}
        />
        {erreurs.email && (
          <p id="connexion-email-erreur" className="text-sm text-erreur">
            {erreurs.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="connexion-motDePasse" className="text-[0.8125rem] tracking-[0.08em] text-sable">
          Mot de passe
        </label>
        <input {...attributs("motDePasse")} type="password" required maxLength={LIMITES_CONNEXION.motDePasse} autoComplete="current-password" />
        {erreurs.motDePasse && (
          <p id="connexion-motDePasse-erreur" className="text-sm text-erreur">
            {erreurs.motDePasse}
          </p>
        )}
      </div>

      {/* Message général (identifiants, limite…) ; les erreurs de saisie sont déjà sous leur champ. */}
      {etat.statut === "erreur" && Object.keys(erreurs).length === 0 && (
        <p role="alert" className="text-sm text-erreur">
          {etat.message}
        </p>
      )}

      <button type="submit" disabled={enCours} className={`${classesBouton("primaire")} w-full disabled:cursor-wait disabled:opacity-70`}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
