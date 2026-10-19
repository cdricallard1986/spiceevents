/**
 * Onglets de la page `/admin/tests` et leurs pastilles de verdict, logique
 * pure et testée (le composant `OngletsTests` ne fait que l'afficher).
 *
 * La pastille de chaque onglet donne le verdict SANS l'ouvrir : on voit la
 * santé du site d'un coup d'œil (modèle : page Tests du CRM).
 */

export type CleOnglet = "sql" | "droits" | "unitaires" | "configuration";

export const ONGLETS: readonly { cle: CleOnglet; titre: string }[] = [
  { cle: "sql", titre: "Comportements SQL" },
  { cle: "droits", titre: "Audit des droits" },
  { cle: "unitaires", titre: "Tests unitaires" },
  { cle: "configuration", titre: "Configuration" },
];

/** Paramètre d'adresse qui mémorise l'onglet ouvert (`/admin/tests?onglet=droits`). */
export const PARAMETRE_ONGLET = "onglet";

/** Onglet demandé par l'adresse, ou le premier si la valeur est absente ou inconnue. */
export function ongletDepuis(valeur: string | string[] | undefined | null): CleOnglet {
  const v = Array.isArray(valeur) ? valeur[0] : valeur;
  return ONGLETS.find((o) => o.cle === v)?.cle ?? ONGLETS[0].cle;
}

/** Onglet voisin pour la navigation au clavier (flèches, Début, Fin), en boucle. */
export function ongletVoisin(actif: CleOnglet, touche: string): CleOnglet | null {
  const i = ONGLETS.findIndex((o) => o.cle === actif);
  const n = ONGLETS.length;
  if (touche === "ArrowRight") return ONGLETS[(i + 1) % n].cle;
  if (touche === "ArrowLeft") return ONGLETS[(i - 1 + n) % n].cle;
  if (touche === "Home") return ONGLETS[0].cle;
  if (touche === "End") return ONGLETS[n - 1].cle;
  return null;
}

// --- Pastilles ---------------------------------------------------------------

export type EtatPastille =
  | { type: "en_cours" }
  /** La suite n'a pas pu s'exécuter : ni verte ni rouge, c'est en soi une alerte. */
  | { type: "erreur" }
  | { type: "ok"; total?: number }
  | { type: "echec"; nombre: number }
  /** Rien à juger (rapport des tests pas encore généré, en local). */
  | { type: "absent" };

export type Pastille = { signe: string; ton: "succes" | "erreur" | "neutre"; libelle: string };

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

export function pastille(etat: EtatPastille): Pastille {
  switch (etat.type) {
    case "en_cours":
      return { signe: "…", ton: "neutre", libelle: "exécution en cours" };
    case "erreur":
      return { signe: "!", ton: "erreur", libelle: "n'a pas pu s'exécuter" };
    case "ok":
      return { signe: etat.total === undefined ? "✓" : `✓ ${etat.total}`, ton: "succes", libelle: etat.total === undefined ? "tout passe" : `tout passe (${etat.total})` };
    case "echec":
      return { signe: `✗ ${etat.nombre}`, ton: "erreur", libelle: `${pluriel(etat.nombre, "échec")}` };
    case "absent":
      return { signe: "–", ton: "neutre", libelle: "pas encore de résultat" };
  }
}

/** État d'une suite « live » (comportements SQL, audit des droits). */
export function etatPastilleSuite(s: { enCours: boolean; erreur: string | null; echecs: number | null }): EtatPastille {
  if (s.enCours) return { type: "en_cours" };
  if (s.erreur) return { type: "erreur" };
  if (s.echecs === null) return { type: "absent" };
  return s.echecs === 0 ? { type: "ok" } : { type: "echec", nombre: s.echecs };
}

/** État des tests unitaires d'après le résumé du dernier build (null : rapport pas encore généré). */
export function etatPastilleUnitaires(resume: { succes: boolean; totaux: { total: number; echoues: number }; fichiersEnErreur: number } | null): EtatPastille {
  if (!resume) return { type: "absent" };
  if (resume.succes) return { type: "ok", total: resume.totaux.total };
  // Un fichier qui n'a pas pu s'exécuter compte comme un échec, même sans test échoué.
  return { type: "echec", nombre: Math.max(1, resume.totaux.echoues + resume.fichiersEnErreur) };
}

/** État de la configuration : chaque secret absent est un échec (une valeur par défaut n'en est pas un). */
export function etatPastilleConfiguration(lignes: readonly { secret: boolean; presente: boolean }[]): EtatPastille {
  const absents = lignes.filter((l) => l.secret && !l.presente).length;
  return absents === 0 ? { type: "ok" } : { type: "echec", nombre: absents };
}
