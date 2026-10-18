"use client";

import { useId, useRef, type ReactNode } from "react";
import { classesBouton } from "@/components/ui/Bouton";
import { Modale } from "./Modale";

/** Boutons du back office : ceux du site, et une variante rouge pour les actions irréversibles. */
export const CLASSES_DANGER =
  "inline-flex items-center justify-center border border-erreur px-7 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-erreur transition-colors hover:bg-erreur hover:text-nuit";

type Props = {
  ouverte: boolean;
  titre: string;
  message: ReactNode;
  libelleConfirmer?: string;
  libelleAnnuler?: string;
  /** Suppression, envoi… : bouton rouge. */
  danger?: boolean;
  /** Action en cours : le bouton de confirmation patiente (l'annulation reste possible). */
  enCours?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
};

/**
 * Confirmation explicite des actions sensibles (publication, suppression,
 * envoi). Le focus va sur « Annuler » : un Entrée réflexe ne déclenche rien.
 * Échap et clic sur le fond annulent.
 */
export function ConfirmDialog({
  ouverte,
  titre,
  message,
  libelleConfirmer = "Confirmer",
  libelleAnnuler = "Annuler",
  danger = false,
  enCours = false,
  onConfirmer,
  onAnnuler,
}: Props) {
  const idMessage = useId();
  const annuler = useRef<HTMLButtonElement>(null);
  return (
    <Modale
      ouverte={ouverte}
      onFermer={onAnnuler}
      titre={titre}
      role="alertdialog"
      largeur="etroite"
      focusInitial={annuler}
      descriptionId={idMessage}
      pied={
        <>
          <button ref={annuler} type="button" onClick={onAnnuler} className={classesBouton("contour")}>
            {libelleAnnuler}
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={enCours}
            className={`${danger ? CLASSES_DANGER : classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}
          >
            {libelleConfirmer}
          </button>
        </>
      }
    >
      <div id={idMessage} className="text-sable">
        {message}
      </div>
    </Modale>
  );
}
