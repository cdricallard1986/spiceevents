import type { Bilingue } from "./types";

/**
 * Vidéos de la chaîne YouTube Spice Events (https://www.youtube.com/user/MrSpiceEvents)
 * intégrées au site. « DJ Dioz » est le nom de DJ de Cédric.
 * `date` : date de mise en ligne sur YouTube (données structurées VideoObject).
 */
export type Video = {
  id: string;
  date: string;
  titre: Bilingue<string>;
  description: Bilingue<string>;
};

export const VIDEOS = {
  mariages: {
    id: "OofgpDRcaYA",
    date: "2026-02-25",
    titre: { fr: "Des mariages inoubliables by Spice Events", en: "Unforgettable weddings by Spice Events" },
    description: {
      fr: "Au cœur des mariages signés Spice Events : l’énergie, l’émotion et l’ambiance d’une soirée où la piste ne désemplit pas.",
      en: "Inside the weddings by Spice Events: the energy, the emotion and the atmosphere of a night when the dance floor never empties.",
    },
  },
  mixMariage: {
    id: "zchNbRcZ_gI",
    date: "2026-02-03",
    titre: { fr: "Mix DJ mariage — Spice Events ft DJ Dioz", en: "Wedding DJ mix — Spice Events ft DJ Dioz" },
    description: {
      fr: "Un mix de Cédric (DJ Dioz) pour rassembler toutes les générations sur la même piste : des incontournables aux sons actuels, des enchaînements fluides.",
      en: "A mix by Cédric (DJ Dioz) to bring every generation onto the same dance floor: timeless classics to current hits, with seamless transitions.",
    },
  },
  mixMontagne: {
    id: "RWOmv0xecJI",
    date: "2026-03-05",
    titre: { fr: "Mix pop rock by DJ Dioz, en montagne", en: "Pop rock mix by DJ Dioz, in the mountains" },
    description: {
      fr: "Un set de Cédric (DJ Dioz) en altitude, au Grand-Bornand : montée progressive, énergie maîtrisée, une ambiance qui marque.",
      en: "A set by Cédric (DJ Dioz) high in the mountains at Le Grand-Bornand: a steady build, controlled energy, an atmosphere that stays with you.",
    },
  },
} satisfies Record<string, Video>;

/** Lecteur YouTube en mode confidentialité renforcée (aucun cookie tant que la vidéo n’est pas lancée). */
export function adresseLecteur(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
