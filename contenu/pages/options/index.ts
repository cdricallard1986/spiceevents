import type { Option } from "../../options";
import { BAR_A_VINYLES } from "./bar-a-vinyles";
import { FEUX_D_ARTIFICE_DE_JOUR } from "./feux-d-artifice-de-jour";
import { GUIRLANDES_LUMINEUSES } from "./guirlandes-lumineuses";
import { LIVRE_D_OR_AUDIO } from "./livre-d-or-audio";
import { OUVERTURE_DE_BAL } from "./ouverture-de-bal";
import { PHOTOBOOTH } from "./photobooth";
import { SONORISATION_CEREMONIE_LAIQUE } from "./sonorisation-ceremonie-laique";
import { SONORISATION_DEPORTEE } from "./sonorisation-deportee";
import type { ContenuOption } from "./types";

export type { ContenuOption, ListeOption, TextesOption } from "./types";

/** Contenu de chaque page d'option, indexé par son slug français (voir `contenu/options.ts`). */
export const CONTENUS_OPTIONS: Record<string, ContenuOption> = {
  "ouverture-de-bal": OUVERTURE_DE_BAL,
  "bar-a-vinyles": BAR_A_VINYLES,
  "livre-d-or-audio": LIVRE_D_OR_AUDIO,
  photobooth: PHOTOBOOTH,
  "guirlandes-lumineuses": GUIRLANDES_LUMINEUSES,
  "feux-d-artifice-de-jour": FEUX_D_ARTIFICE_DE_JOUR,
  "sonorisation-ceremonie-laique": SONORISATION_CEREMONIE_LAIQUE,
  "sonorisation-deportee": SONORISATION_DEPORTEE,
};

export function contenuOption(option: Option): ContenuOption {
  const c = CONTENUS_OPTIONS[option.slug.fr];
  if (!c) throw new Error(`Contenu manquant pour l'option : ${option.slug.fr}`);
  return c;
}
