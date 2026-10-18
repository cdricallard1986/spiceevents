"use client";

import type { ReactNode } from "react";
import { longueur } from "@/lib/avis/constantes";
import { CLASSES_AIDE, CLASSES_CHAMP, CLASSES_CHAMP_ERREUR, CLASSES_LIBELLE } from "./champs";

// Champ de saisie des fiches du back office (avis, photos) : partagé pour que
// toutes les modales aient les mêmes libellés, compteurs, aides et erreurs.

export type Attributs = {
  id: string;
  className: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/** Un champ : libellé, contrôle, compteur de caractères, aide, erreur (bordure rouge). */
export function Champ({
  id,
  libelle,
  erreur,
  aide,
  max,
  valeur,
  className = "",
  children,
}: {
  id: string;
  libelle: string;
  erreur?: string;
  aide?: string;
  /** Longueur maximale de la base : affiche un compteur. */
  max?: number;
  valeur?: string;
  className?: string;
  children: (attributs: Attributs) => ReactNode;
}) {
  const decrit = [erreur && `${id}-erreur`, aide && `${id}-aide`, max !== undefined && `${id}-compteur`].filter(Boolean).join(" ");
  const n = valeur === undefined ? 0 : longueur(valeur.trim());
  const depasse = max !== undefined && n > max;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={CLASSES_LIBELLE}>
          {libelle}
        </label>
        {max !== undefined && (
          <span id={`${id}-compteur`} className={`text-xs tabular-nums ${depasse ? "text-erreur" : "text-sable/70"}`}>
            {n.toLocaleString("fr-FR")} / {max.toLocaleString("fr-FR")}
            <span className="sr-only"> caractères</span>
          </span>
        )}
      </div>
      {children({
        id,
        className: erreur || depasse ? CLASSES_CHAMP_ERREUR : CLASSES_CHAMP,
        ...(erreur ? { "aria-invalid": true as const } : {}),
        ...(decrit ? { "aria-describedby": decrit } : {}),
      })}
      {aide && (
        <p id={`${id}-aide`} className={CLASSES_AIDE}>
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} className="text-sm text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}
