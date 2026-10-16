import type { CleImage } from "@/lib/images";
import type { Bilingue, Seo } from "../types";

type Galerie = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  mariages: { surtitre: string; titre: string };
  evenements: { surtitre: string; titre: string };
};

export const GALERIE: Bilingue<Galerie> = {
  fr: {
    seo: {
      titre: "Galerie photos — mariages et événements | Spice Events, Île-de-France",
      description:
        "Premières danses, dîners mis en lumière, châteaux illuminés, soirées d'entreprise : une sélection de photos de mariages et d'événements animés par Spice Events.",
    },
    hero: {
      surtitre: "Galerie",
      titre: "La lumière, *la piste*, l'émotion.",
      intro: "Une sélection de mariages et d'événements que nous avons mis en musique et en lumière.",
    },
    mariages: { surtitre: "Mariages", titre: "De la cérémonie *au bout de la nuit*." },
    evenements: { surtitre: "Événements", titre: "Galas, lancements *et grandes soirées*." },
  },
  en: {
    seo: {
      titre: "Photo gallery — weddings and events | Spice Events, Paris area",
      description:
        "First dances, beautifully lit dinners, illuminated châteaux, corporate parties: a selection of photos from weddings and events by Spice Events.",
    },
    hero: {
      surtitre: "Gallery",
      titre: "The light, *the dance floor*, the emotion.",
      intro: "A selection of weddings and events we have brought to life with music and lighting.",
    },
    mariages: { surtitre: "Weddings", titre: "From the ceremony *to the end of the night*." },
    evenements: { surtitre: "Events", titre: "Galas, launches *and big nights out*." },
  },
};

/** Photos de mariages, dans l'ordre d'affichage (on alterne ambiances et moments). */
export const PHOTOS_MARIAGES: CleImage[] = [
  "hero-premiere-danse",
  "maison-mariage-ceremonie-arbres",
  "grange-guirlandes",
  "maison-mariage-danse-genou",
  "maison-mariage-chateau-rose",
  "maison-mariage-maries-micro",
  "maison-mariage-salle-etoiles",
  "couple-faisceaux",
  "maison-mariage-chapiteau-fete",
  "maison-mariage-charpente",
  "maison-mariage-piste-verte",
  "chateau-cour",
  "maison-mariage-ceremonie-cour",
  "premiere-danse-rose",
  "maison-mariage-diner-rouge",
  "maison-mariage-lasers",
  "maison-mariage-chapiteau-nuit",
  "maison-mariage-danse-gobos",
  "maison-mariage-facade-projection",
  "chapiteau-diner",
  "maison-mariage-chapiteau-ovation",
  "maison-mariage-cour-gobos",
  "maison-mariage-diner-violet",
];

/** Photos d'événements privés et d'entreprise. */
export const PHOTOS_EVENEMENTS: CleImage[] = [
  "maison-evenement-gala",
  "maison-evenement-scene-dj",
  "maison-evenement-bal",
  "maison-evenement-lancement-auto",
  "maison-evenement-cabine-dj",
  "maison-evenement-soiree-lumiere",
  "maison-evenement-seminaire",
  "maison-evenement-concert",
  "maison-evenement-dj-vue-haut",
  "maison-evenement-structure",
  "maison-evenement-faisceaux",
];
