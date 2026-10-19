import type { Categorie } from "@/lib/journal/constantes";
import type { Seo } from "../types";

type Journal = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  aLaUne: string;
  filtres: string;
  /** Phrase d'introduction de chaque rubrique. */
  rubriques: Record<Categorie, string>;
  article: { lies: { surtitre: string; titre: string }; retour: string };
};

/** Page publiée en français seulement (les articles ne sont pas traduits). */
export const JOURNAL: Journal = {
  seo: {
    titre: "Journal : conseils mariage, DJ, son & lumière — Spice Events",
    description:
      "Conseils pour votre mariage, choix du DJ, musique, technique son et lumière, animations et mariages réalisés : le journal de Spice Events, DJ en Île-de-France.",
  },
  hero: {
    surtitre: "Le journal",
    titre: "Conseils et coulisses *pour un mariage qui danse*.",
    intro: "Musique, lumière, déroulé, animations : ce que nous avons appris en préparant les mariages et les soirées de nos clients.",
  },
  aLaUne: "À la une",
  filtres: "Rubriques",
  rubriques: {
    "Conseils mariage": "Préparer le grand jour : lieu, décoration, thématique, saison et organisation.",
    "Musique & ambiance": "Le rôle du DJ, la lecture de la piste et le rythme de la soirée.",
    Technique: "Sonorisation, éclairage et préparation : ce qui ne se voit pas, mais se ressent.",
    Animations: "Livre d'or audio, guirlandes, photobooth… et comment bien les doser.",
    "Mariages réalisés": "Quelques mariages que nous avons sonorisés et mis en lumière.",
  },
  article: {
    lies: { surtitre: "Le journal", titre: "À lire *aussi*" },
    retour: "Tout le journal",
  },
};
