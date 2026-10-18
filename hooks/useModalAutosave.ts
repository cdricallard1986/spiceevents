"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Enregistrement automatique des modales de saisie (règle d'ergonomie de
 * Cédric) : on ouvre, on modifie, on ferme — pas de bouton « Enregistrer », pas
 * de perte, et les champs restent TOUJOURS éditables (ne jamais les griser
 * pendant une sauvegarde).
 *
 * - Miroir instantané en localStorage à chaque frappe (survit au rechargement,
 *   au plantage, à la coupure réseau), puis enregistrement serveur ~800 ms après
 *   la dernière frappe.
 * - Une seule sauvegarde à la fois, dans l'ordre : le serveur ne reçoit jamais
 *   une ancienne valeur après une plus récente. Chaque modification incrémente
 *   un numéro de séquence ; une réponse dont la séquence est dépassée (on a
 *   retapé pendant l'envoi) est ignorée — ni statut « Enregistré », ni rappel
 *   `surEnregistre` — et la nouvelle valeur part juste après.
 * - `fermer()` envoie aussitôt ce qui attend et renvoie `false` seulement si
 *   l'enregistrement a échoué : c'est le seul cas où avertir avant de fermer.
 *
 * Trois modes :
 * - `edition` : ligne existante, enregistrement serveur automatique ;
 * - `creation-locale` (entité simple) : brouillon en localStorage seulement, la
 *   ligne n'est créée qu'au clic sur « Créer » (puis `oublierBrouillon()`) ;
 * - `brouillon-base` (entité à cycle de vie) : une ligne « brouillon » est
 *   créée en base dès l'ouverture, puis tout se passe comme en édition.
 */

export type StatutSauvegarde = "a_jour" | "modifie" | "enregistrement" | "enregistre" | "erreur" | "brouillon";

type Commun<T> = {
  /** Clé du miroir localStorage, unique par fiche (ex. `avis:42`, `avis:nouveau`). */
  cle: string;
  /** Valeur d'ouverture (celle de la base, ou le formulaire vide). */
  valeurInitiale: T;
  /** Délai après la dernière frappe avant l'envoi au serveur. */
  delaiMs?: number;
  /** Appelé après un enregistrement à jour (jamais pour une réponse périmée). */
  surEnregistre?: (resultat: unknown, valeur: T) => void;
};

export type OptionsAutosave<T> = Commun<T> &
  (
    | { mode: "edition"; enregistrer: (valeur: T) => Promise<unknown> }
    | { mode: "creation-locale" }
    | {
        mode: "brouillon-base";
        /** Crée la ligne brouillon et renvoie son identifiant (appelé une fois, à l'ouverture). */
        creerBrouillon: (valeur: T) => Promise<string>;
        enregistrer: (valeur: T, id: string) => Promise<unknown>;
      }
  );

export const DELAI_AUTOSAVE_MS = 800;
/** Un brouillon local plus ancien est oublié. */
const DUREE_MIROIR_MS = 7 * 24 * 60 * 60 * 1000;
const PREFIXE = "autosave:";

type Miroir = { valeur: unknown; initiale: string; le: number };

function lireMiroir(cle: string): Miroir | null {
  try {
    const brut = window.localStorage.getItem(PREFIXE + cle);
    if (!brut) return null;
    const miroir = JSON.parse(brut) as Miroir;
    return typeof miroir?.initiale === "string" && typeof miroir.le === "number" ? miroir : null;
  } catch {
    return null;
  }
}

function ecrireMiroir(cle: string, miroir: Miroir) {
  try {
    window.localStorage.setItem(PREFIXE + cle, JSON.stringify(miroir));
  } catch {
    // Stockage plein, bloqué ou navigation privée : l'enregistrement serveur reste le filet principal.
  }
}

function effacerMiroir(cle: string) {
  try {
    window.localStorage.removeItem(PREFIXE + cle);
  } catch {
    // Idem.
  }
}

export function useModalAutosave<T>(options: OptionsAutosave<T>) {
  const { cle, delaiMs = DELAI_AUTOSAVE_MS } = options;

  const [valeur, setValeur] = useState<T>(options.valeurInitiale);
  const [statut, setStatut] = useState<StatutSauvegarde>("a_jour");
  const [erreur, setErreur] = useState<unknown>(null);
  const [id, setId] = useState<string | null>(null);
  const [brouillonRestaure, setBrouillonRestaure] = useState(false);

  // Toujours les dernières options (fonctions d'enregistrement), sans relancer les effets.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const valeurRef = useRef<T>(options.valeurInitiale);
  // Empreinte de la valeur d'ouverture : un miroir pris sur une autre version de la fiche est ignoré.
  const initialeRef = useRef(JSON.stringify(options.valeurInitiale));
  const sequenceRef = useRef(0);
  const sequenceEnregistreeRef = useRef(0);
  const fileRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const minuteurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef<string | null>(null);
  const creationRef = useRef<Promise<string> | null>(null);
  const monteRef = useRef(true);

  const annulerMinuteur = () => {
    if (minuteurRef.current) clearTimeout(minuteurRef.current);
    minuteurRef.current = null;
  };

  /** Identifiant de la ligne brouillon (créée une seule fois, recréée seulement après un échec). */
  const obtenirId = useCallback((): Promise<string> => {
    const o = optionsRef.current;
    if (idRef.current) return Promise.resolve(idRef.current);
    if (o.mode !== "brouillon-base") return Promise.reject(new Error("Pas de brouillon en base dans ce mode"));
    if (!creationRef.current) {
      creationRef.current = o.creerBrouillon(valeurRef.current).then(
        (nouvel) => {
          idRef.current = nouvel;
          if (monteRef.current) setId(nouvel);
          return nouvel;
        },
        (e) => {
          creationRef.current = null;
          throw e;
        },
      );
    }
    return creationRef.current;
  }, []);

  /** Une sauvegarde ; ne lève jamais d'erreur. Renvoie vrai si la dernière saisie est en base. */
  const executer = useCallback(async (): Promise<boolean> => {
    const o = optionsRef.current;
    if (o.mode === "creation-locale") return true;
    const sequence = sequenceRef.current;
    const aCreer = o.mode === "brouillon-base" && !idRef.current;
    if (sequence === sequenceEnregistreeRef.current && !aCreer) return true;

    const envoyee = valeurRef.current;
    if (monteRef.current) setStatut("enregistrement");
    try {
      let resultat: unknown;
      if (o.mode === "brouillon-base") {
        const ligne = await obtenirId();
        resultat = sequence === 0 ? undefined : await o.enregistrer(envoyee, ligne);
      } else {
        resultat = await o.enregistrer(envoyee);
      }
      sequenceEnregistreeRef.current = Math.max(sequenceEnregistreeRef.current, sequence);
      if (sequence !== sequenceRef.current) {
        // Réponse périmée : une saisie plus récente attend son tour (minuteur en cours).
        if (monteRef.current) setStatut("modifie");
        return false;
      }
      effacerMiroir(cle);
      if (monteRef.current) {
        setErreur(null);
        setStatut(sequence === 0 ? "a_jour" : "enregistre");
      }
      if (sequence !== 0) o.surEnregistre?.(resultat, envoyee);
      return true;
    } catch (e) {
      // Échec d'une valeur déjà dépassée : la plus récente partira de toute façon.
      if (sequence !== sequenceRef.current) return false;
      if (monteRef.current) {
        setErreur(e);
        setStatut("erreur");
      }
      return false;
    }
  }, [cle, obtenirId]);

  /** Met une sauvegarde dans la file (une à la fois, dans l'ordre). */
  const sauvegarder = useCallback((): Promise<boolean> => {
    annulerMinuteur();
    const suivante = fileRef.current.then(executer);
    fileRef.current = suivante;
    return suivante;
  }, [executer]);

  const modifier = useCallback(
    (maj: Partial<T> | ((precedente: T) => T)) => {
      const suivante =
        typeof maj === "function" ? (maj as (p: T) => T)(valeurRef.current) : { ...valeurRef.current, ...maj };
      valeurRef.current = suivante;
      sequenceRef.current += 1;
      setValeur(suivante);
      // Miroir instantané, avant toute attente.
      ecrireMiroir(cle, { valeur: suivante, initiale: initialeRef.current, le: Date.now() });
      if (optionsRef.current.mode === "creation-locale") {
        setStatut("brouillon");
        return;
      }
      setStatut("modifie");
      annulerMinuteur();
      minuteurRef.current = setTimeout(() => void sauvegarder(), delaiMs);
    },
    [cle, delaiMs, sauvegarder],
  );

  /** Envoie tout de suite ce qui attend (bouton « réessayer » de la pill, raccourci clavier…). */
  const enregistrerMaintenant = useCallback(() => sauvegarder(), [sauvegarder]);

  /**
   * À appeler à la fermeture : envoie ce qui attend. `true` = on peut fermer
   * sans rien dire ; `false` = l'enregistrement a échoué, avertir avant de fermer.
   */
  const fermer = useCallback(async (): Promise<boolean> => {
    if (optionsRef.current.mode === "creation-locale") return true;
    return sauvegarder();
  }, [sauvegarder]);

  /** Oublie le brouillon local (après « Créer », ou fermeture confirmée malgré un échec). */
  const oublierBrouillon = useCallback(() => {
    annulerMinuteur();
    effacerMiroir(cle);
    setBrouillonRestaure(false);
  }, [cle]);

  // Ouverture : reprise d'un miroir laissé par un rechargement ou un plantage,
  // et création de la ligne brouillon en base (une seule fois, même en StrictMode).
  useEffect(() => {
    monteRef.current = true;
    const miroir = lireMiroir(cle);
    if (miroir) {
      if (miroir.initiale === initialeRef.current && Date.now() - miroir.le < DUREE_MIROIR_MS) {
        valeurRef.current = miroir.valeur as T;
        sequenceRef.current += 1;
        setValeur(miroir.valeur as T);
        setBrouillonRestaure(true);
        if (optionsRef.current.mode === "creation-locale") setStatut("brouillon");
        else {
          setStatut("modifie");
          minuteurRef.current = setTimeout(() => void sauvegarder(), delaiMs);
        }
      } else {
        // La fiche a changé depuis (ou le miroir est trop vieux) : il écraserait des données plus récentes.
        effacerMiroir(cle);
      }
    }
    if (optionsRef.current.mode === "brouillon-base" && !creationRef.current && !idRef.current) void sauvegarder();
    return () => {
      monteRef.current = false;
      // Démontage avec une saisie en attente : on l'envoie quand même.
      if (minuteurRef.current) {
        annulerMinuteur();
        void sauvegarder();
      }
    };
  }, [cle, delaiMs, sauvegarder]);

  // Fermeture de l'onglet après un échec : seul cas où l'on avertit (le miroir garde la saisie).
  useEffect(() => {
    if (statut !== "erreur") return;
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, [statut]);

  return {
    valeur,
    modifier,
    statut,
    /** Dernière erreur d'enregistrement (null si la dernière sauvegarde a réussi). */
    erreur,
    /** Identifiant de la ligne brouillon (mode `brouillon-base`). */
    id,
    /** Une saisie non enregistrée a été reprise depuis ce navigateur. */
    brouillonRestaure,
    enregistrerMaintenant,
    reessayer: enregistrerMaintenant,
    fermer,
    oublierBrouillon,
  };
}
