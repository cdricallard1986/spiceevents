"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Suite<T> = {
  enCours: boolean;
  /** La suite n'a pas pu s'exécuter (message lisible). */
  erreur: string | null;
  /** Dernier résultat ; gardé affiché pendant une relance. */
  resultat: T | null;
  /** Heure de la dernière réponse (résultat ou erreur). */
  termineeA: Date | null;
  /** Rejoue la suite (bouton « Relancer »). */
  relancer: () => Promise<void>;
};

/**
 * Lance une suite de tests « live » (comportements SQL, audit des droits) et
 * suit son état.
 *
 * Le lancement est AUTOMATIQUE à l'ouverture de la page, même si l'onglet
 * n'est pas affiché : une page de santé qui attend un clic pour dire si tout va
 * bien ne dit rien, et c'est ce qui renseigne la pastille de chaque onglet.
 * Le bouton « Relancer » reste, pour rejouer après une correction.
 *
 * Un seul lancement automatique, même quand React monte deux fois le composant
 * en développement (mode strict).
 */
export function useSuite<T>(lancer: () => Promise<T>, messageErreur: (e: unknown) => string): Suite<T> {
  const [etat, setEtat] = useState<Omit<Suite<T>, "relancer">>({ enCours: true, erreur: null, resultat: null, termineeA: null });

  // Toujours la dernière version des fonctions, sans relancer l'effet à chaque rendu.
  const fonctions = useRef({ lancer, messageErreur });
  useEffect(() => {
    fonctions.current = { lancer, messageErreur };
  });

  const executer = useCallback(async () => {
    try {
      const resultat = await fonctions.current.lancer();
      setEtat({ enCours: false, erreur: null, resultat, termineeA: new Date() });
    } catch (e) {
      setEtat({ enCours: false, erreur: fonctions.current.messageErreur(e), resultat: null, termineeA: new Date() });
    }
  }, []);

  const dejaLancee = useRef(false);
  useEffect(() => {
    if (dejaLancee.current) return;
    dejaLancee.current = true;
    void executer();
  }, [executer]);

  const relancer = useCallback(async () => {
    setEtat((e) => ({ ...e, enCours: true, erreur: null }));
    await executer();
  }, [executer]);

  return { ...etat, relancer };
}
