"use client";

import { useRef, useState } from "react";
import { useToasts } from "./Toasts";

/**
 * Erreurs d'une fiche du back office (avis, DJ, photo, article) : bordure
 * rouge par champ + toast. La même erreur, à chaque nouvel essai
 * d'enregistrement automatique, ne s'affiche qu'une fois.
 */
export function useErreursFiche<E extends Partial<Record<string, string>>>() {
  const { afficher } = useToasts();
  const [erreurs, setErreurs] = useState<E>({} as E);
  const dernier = useRef("");
  return {
    erreurs,
    signaler(message: string, champs: E = {} as E) {
      setErreurs(champs);
      if (message !== dernier.current) afficher(message, "erreur");
      dernier.current = message;
    },
    effacer() {
      setErreurs({} as E);
      dernier.current = "";
    },
  };
}
