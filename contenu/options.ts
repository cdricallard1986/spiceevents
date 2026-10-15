import type { Locale } from "@/i18n/routing";
import type { CleImage } from "@/lib/images";
import type { Bilingue } from "./types";

/**
 * Les animations et options, chacune avec sa page `/animations/<slug>`.
 * Le slug est traduit (FR / EN). Le contenu détaillé de chaque page est dans
 * `contenu/pages/options/<slug-fr>.ts`.
 */
export type Option = {
  slug: Bilingue<string>;
  titre: Bilingue<string>;
  resume: Bilingue<string>;
  image: CleImage;
};

export const OPTIONS: Option[] = [
  {
    slug: { fr: "ouverture-de-bal", en: "first-dance-effects" },
    titre: { fr: "Ouverture de bal spectaculaire", en: "Spectacular first dance" },
    resume: {
      fr: "Fumée lourde et étincelles froides, synchronisées à votre première danse.",
      en: "Low fog and cold sparks, synchronised with your first dance.",
    },
    image: "premiere-danse-rose",
  },
  {
    slug: { fr: "bar-a-vinyles", en: "vinyl-bar" },
    titre: { fr: "Bar à vinyles", en: "Vinyl bar" },
    resume: {
      fr: "Vos invités piochent un disque, le DJ l'intègre à la soirée.",
      en: "Guests pick a record, the DJ blends it into the night.",
    },
    image: "vinyles",
  },
  {
    slug: { fr: "livre-d-or-audio", en: "audio-guestbook" },
    titre: { fr: "Livre d'or audio", en: "Audio guestbook" },
    resume: {
      fr: "Un téléphone vintage pour garder leurs voix, pour toujours.",
      en: "A vintage phone to keep their voices, forever.",
    },
    image: "telephone-livre-or",
  },
  {
    slug: { fr: "photobooth", en: "photobooth" },
    titre: { fr: "Photobooth", en: "Photobooth" },
    resume: {
      fr: "400 tirages, cadre personnalisé, photos envoyées dès le lundi.",
      en: "400 prints, custom frame, all photos sent by Monday.",
    },
    image: "piste-invites",
  },
  {
    slug: { fr: "guirlandes-lumineuses", en: "string-lights" },
    titre: { fr: "Guirlandes lumineuses", en: "String lights" },
    resume: {
      fr: "Une lumière chaude et féerique, du cocktail à la piste.",
      en: "Warm, magical light, from drinks to the dance floor.",
    },
    image: "grange-guirlandes",
  },
  {
    slug: { fr: "murs-d-eau-et-vegetaux", en: "water-and-green-walls" },
    titre: { fr: "Murs d'eau & végétaux", en: "Water & green walls" },
    resume: {
      fr: "Un décor signature, personnalisable à vos initiales.",
      en: "A signature backdrop, personalised with your initials.",
    },
    image: "chateau-cour",
  },
  {
    slug: { fr: "sonorisation-ceremonie-laique", en: "ceremony-sound" },
    titre: { fr: "Sonorisation de cérémonie laïque", en: "Ceremony sound" },
    resume: {
      fr: "Chaque mot entendu, du premier au dernier rang.",
      en: "Every word heard, from the front row to the back.",
    },
    image: "ceremonie-laique",
  },
  {
    slug: { fr: "sonorisation-deportee", en: "multi-room-sound" },
    titre: { fr: "Sonorisation déportée", en: "Multi-room sound" },
    resume: {
      fr: "Cocktail, dîner, salle annexe : le bon son dans chaque espace.",
      en: "Drinks, dinner, side room: the right sound in every space.",
    },
    image: "chapiteau-diner",
  },
];

export function optionParSlug(slug: string, locale: Locale): Option | undefined {
  return OPTIONS.find((o) => o.slug[locale] === slug);
}
