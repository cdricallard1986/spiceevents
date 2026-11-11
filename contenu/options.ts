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
      fr: "Fumée lourde et étincelles froides, synchronisées avec votre première danse.",
      en: "Low fog and cold sparks, synchronised with your first dance.",
    },
    image: "presta-bal-etincelles-fumee",
  },
  {
    slug: { fr: "bar-a-vinyles", en: "vinyl-bar" },
    titre: { fr: "Bar à vinyles", en: "Vinyl bar" },
    resume: {
      fr: "Vos invités choisissent un disque, le DJ l'intègre à la soirée.",
      en: "Guests pick a record, the DJ blends it into the night.",
    },
    image: "presta-vinyles-platine",
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
      en: "400 prints, a custom frame, all your photos sent the Monday after.",
    },
    image: "presta-photobooth-invitees",
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
    slug: { fr: "feux-d-artifice-de-jour", en: "daytime-fireworks" },
    titre: { fr: "Feux d'artifice de jour", en: "Daytime fireworks" },
    resume: {
      fr: "Des gerbes de poudre multicolore en plein jour, pour un moment qui éclate de couleurs.",
      en: "Bursts of multicoloured powder in broad daylight, for a moment full of colour.",
    },
    image: "presta-feux-artifice-jour",
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
    image: "presta-sono-grand-salon",
  },
];

export function optionParSlug(slug: string, locale: Locale): Option | undefined {
  return OPTIONS.find((o) => o.slug[locale] === slug);
}
