import type { Locale } from "@/i18n/routing";
import type { CleImage } from "@/lib/images";
import type { Bilingue } from "./types";
import { typographier } from "@/lib/typographie";

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

export const OPTIONS: Option[] = typographier([
  {
    slug: { fr: "ouverture-de-bal", en: "first-dance-effects" },
    titre: { fr: "Ouverture de bal spectaculaire", en: "Spectacular first dance" },
    resume: {
      fr: "Votre chanson, quelques étincelles et le temps qui s’arrête.",
      en: "Your song, a few sparks, and time standing still.",
    },
    image: "presta-bal-etincelles-fumee",
  },
  {
    slug: { fr: "bar-a-vinyles", en: "vinyl-bar" },
    titre: { fr: "Bar à vinyles", en: "Vinyl bar" },
    resume: {
      fr: "Un disque choisi, une conversation qui commence. Le cocktail prend un autre tempo.",
      en: "A record picked, a conversation started. The drinks reception takes on a new tempo.",
    },
    image: "presta-vinyles-platine",
  },
  {
    slug: { fr: "livre-d-or-audio", en: "audio-guestbook" },
    titre: { fr: "Livre d’or audio", en: "Audio guestbook" },
    resume: {
      fr: "Leurs rires, leurs mots, leurs voix. À réécouter longtemps.",
      en: "Their laughter, their words, their voices. To play back for years.",
    },
    image: "telephone-livre-or",
  },
  {
    slug: { fr: "photobooth", en: "photobooth" },
    titre: { fr: "Photobooth", en: "Photobooth" },
    resume: {
      fr: "Des sourires spontanés. Et un souvenir à glisser dans sa poche.",
      en: "Spontaneous smiles. And a keepsake to slip into a pocket.",
    },
    image: "presta-photobooth-invitees",
  },
  {
    slug: { fr: "guirlandes-lumineuses", en: "string-lights" },
    titre: { fr: "Guirlandes lumineuses", en: "String lights" },
    resume: {
      fr: "Une lumière douce pour prolonger les soirées d’été.",
      en: "Soft light to make summer evenings last.",
    },
    image: "grange-guirlandes",
  },
  {
    slug: { fr: "feux-d-artifice-de-jour", en: "daytime-fireworks" },
    titre: { fr: "Feux d’artifice de jour", en: "Daytime fireworks" },
    resume: {
      fr: "Un instant haut en couleur pour une sortie inoubliable.",
      en: "A burst of colour for an unforgettable exit.",
    },
    image: "presta-feux-artifice-jour",
  },
  {
    slug: { fr: "sonorisation-ceremonie-laique", en: "ceremony-sound" },
    titre: { fr: "Sonorisation de cérémonie laïque", en: "Ceremony sound" },
    resume: {
      fr: "Chaque mot entendu. Chaque émotion partagée.",
      en: "Every word heard. Every emotion shared.",
    },
    image: "ceremonie-laique",
  },
  {
    slug: { fr: "sonorisation-deportee", en: "multi-room-sound" },
    titre: { fr: "Sonorisation déportée", en: "Multi-room sound" },
    resume: {
      fr: "La bonne ambiance, dans chacun de vos espaces.",
      en: "The right atmosphere, in every one of your spaces.",
    },
    image: "presta-sono-grand-salon",
  },
]);

export function optionParSlug(slug: string, locale: Locale): Option | undefined {
  return OPTIONS.find((o) => o.slug[locale] === slug);
}
