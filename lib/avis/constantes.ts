import { OPTIONS } from "@/contenu/options";

// Constantes des avis partagées par le site, le back office (navigateur compris)
// et les schémas Zod : fichier sans Zod, pour ne pas l'embarquer côté client.

/** Longueurs maximales, alignées sur les contraintes de la table `avis` (migration 0003). */
export const LIMITES_AVIS = {
  auteurs: 120,
  role: 120,
  texte: 5000,
  citation: 600,
  lien: 500,
} as const;

export const CATEGORIES = ["mariage", "evenement"] as const;
export type Categorie = (typeof CATEGORIES)[number];

export const LIBELLES_CATEGORIE: Record<Categorie, string> = {
  mariage: "Mariage",
  evenement: "Événementiel",
};

export const SOURCES = ["site", "mariages_net", "google", "autre"] as const;
export type Source = (typeof SOURCES)[number];

export const LIBELLES_SOURCE: Record<Source, string> = {
  site: "Site",
  mariages_net: "Mariages.net",
  google: "Google",
  autre: "Autre",
};

/** Préfixe des emplacements « page d'option » : `option:<slug français>`. */
export const PREFIXE_OPTION = "option:";

export type Emplacement = "accueil_grand" | "accueil" | "mariages_grand" | "mariages" | `option:${string}`;

/** Emplacement de la page d'une option (slug français, celui de `contenu/options.ts`). */
export function emplacementOption(slugFr: string): Emplacement {
  return `${PREFIXE_OPTION}${slugFr}`;
}

export type EmplacementPropose = {
  valeur: Emplacement;
  libelle: string;
  /** Un seul avis à la fois (grand avis, page d'option) : le cocher le retire de l'avis qui l'avait. */
  unique: boolean;
};

/** Tous les emplacements du site, dans l'ordre des cases à cocher du back office. */
export const EMPLACEMENTS: readonly EmplacementPropose[] = [
  { valeur: "accueil_grand", libelle: "Accueil — grand avis", unique: true },
  { valeur: "accueil", libelle: "Accueil — grille", unique: false },
  { valeur: "mariages_grand", libelle: "Page Mariages — grand avis", unique: true },
  { valeur: "mariages", libelle: "Page Mariages — grille", unique: false },
  // Une page d'option n'affiche qu'un grand avis : l'emplacement est unique, lui aussi.
  ...OPTIONS.map((o) => ({ valeur: emplacementOption(o.slug.fr), libelle: `Page ${o.titre.fr}`, unique: true })),
];

const PAR_VALEUR = new Map(EMPLACEMENTS.map((e) => [e.valeur as string, e]));

export function estEmplacementConnu(valeur: string): valeur is Emplacement {
  return PAR_VALEUR.has(valeur);
}

/** Un seul avis à la fois sur cet emplacement ? */
export function estEmplacementUnique(valeur: string): boolean {
  return PAR_VALEUR.get(valeur)?.unique ?? false;
}

/** Libellé lisible ; un emplacement inconnu (option retirée du site) est affiché tel quel. */
export function libelleEmplacement(valeur: string): string {
  return PAR_VALEUR.get(valeur)?.libelle ?? `${valeur} (emplacement inconnu)`;
}

/**
 * Longueur comme la compte Postgres (`char_length` : caractères, pas unités
 * UTF-16) — un émoji compte pour un. Sert aux compteurs et à la validation.
 */
export function longueur(texte: string): number {
  return Array.from(texte).length;
}
