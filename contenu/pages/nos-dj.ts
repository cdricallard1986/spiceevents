import type { CleImage } from "@/lib/images";
import type { Bilingue, Seo } from "../types";
import { typographier } from "@/lib/typographie";

/**
 * Page « Nos DJ » : textes de la page et section du fondateur (Cédric). Les DJ
 * et musiciens de l’équipe se gèrent dans le back office (/admin/dj, table
 * `equipe`) ; leurs fiches d’origine sont dans `contenu/equipe.ts`.
 */
export type Membre = {
  id: string;
  nom: string;
  /** L’autre nom sous lequel les mariés le connaissent (nom de scène ou prénom), affiché sous le nom. */
  alias?: string;
  role: string;
  styles: string[];
  accroche: string;
  paragraphes: string[];
  /** Un avis de mariés qui le cite (texte exact, traduit en anglais si besoin). */
  avis?: { texte: string; auteur: string };
  lieux?: string;
  lien?: { libelle: string; href: string };
  image?: CleImage;
};

type NosDj = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  fondateur: Membre & { surtitre: string; titre: string };
  equipe: { surtitre: string; titre: string; intro: string };
  musiciens: { surtitre: string; titre: string; intro: string };
  methode: { surtitre: string; titre: string; points: { titre: string; texte: string }[] };
  appel: { titre: string; texte: string; bouton: string };
};

const MIX_CEDRIC = "https://www.youtube.com/watch?v=zchNbRcZ_gI";

export const NOS_DJ: Bilingue<NosDj> = typographier({
  fr: {
    seo: {
      titre: "Nos DJ de mariage et de soirée en Île-de-France | Spice Events",
      description:
        "Cédric (DJ Dioz) et les DJ de l’équipe Spice Events : électro, funk, house, pop-rock avec guitariste, et un saxophoniste pour le live. Une même méthode pour chaque mariage.",
    },
    hero: {
      surtitre: "L’équipe",
      titre: "Nos DJ. *Le piment aux platines.*",
      intro:
        "Des styles différents, une même exigence : lire la piste, préparer chaque soirée avec vous et faire danser toutes les générations jusqu’au bout de la nuit.",
    },
    fondateur: {
      surtitre: "Le fondateur",
      titre: "Cédric, *alias DJ Dioz*.",
      id: "cedric",
      nom: "Cédric Allard",
      alias: "DJ Dioz",
      role: "DJ et fondateur",
      styles: ["Tous les styles", "Mariages", "Événements"],
      accroche: "Plus de 20 ans de platines et plus de 600 mariages et événements.",
      paragraphes: [
        "Cédric a fait de sa passion un métier : il mixe lui-même une partie des mariages et prépare toutes les soirées de l’équipe, du questionnaire musical au déroulé du jour J.",
        "Son credo : un bon DJ ne se cache pas derrière son ordinateur, il vit la soirée avec vous. Selon votre date, c’est lui qui mixe, ou il vous présente le DJ de l’équipe qui vous ressemble.",
      ],
      lien: { libelle: "Écouter son mix", href: MIX_CEDRIC },
      image: "presta-cedric-portrait",
    },
    equipe: {
      surtitre: "Les DJ",
      titre: "Chacun son style. *Tous le même piment.*",
      intro: "Des clubs parisiens aux mariages dans toute la France : des DJ choisis par Cédric, préparés avec la même méthode.",
    },
    musiciens: {
      surtitre: "En live",
      titre: "Un saxophone *sur vos platines*.",
      intro: "Pour le vin d’honneur ou la soirée, un musicien joue en live sur les mix du DJ.",
    },
    methode: {
      surtitre: "La même méthode",
      titre: "Quel que soit votre DJ, *rien n’est laissé au hasard*.",
      points: [
        { titre: "Préparé par Cédric", texte: "Questionnaire musical, rendez-vous de préparation et déroulé de la soirée : Cédric prépare chaque mariage avec vous, puis le transmet à votre DJ." },
        { titre: "Votre musique", texte: "Vos incontournables, les morceaux à éviter, les moments clés : le DJ arrive en connaissant votre soirée." },
        { titre: "Le même matériel", texte: "Son et lumière fournis par MX Événement, testés en atelier avant chaque date, avec du matériel de secours sur place." },
      ],
    },
    appel: {
      titre: "Quel DJ pour *votre nuit* ?",
      texte: "Racontez-nous votre date et vos envies musicales : Cédric vous propose le DJ qui vous ressemble.",
      bouton: "Vérifier ma date",
    },
  },
  en: {
    seo: {
      titre: "Our wedding & party DJs in Paris | Spice Events",
      description:
        "Cédric (DJ Dioz) and the Spice Events DJs: electro, funk, house, pop-rock with a guitarist, plus a saxophonist for live sets. The same method for every wedding.",
    },
    hero: {
      surtitre: "The team",
      titre: "Our DJs. *Spice on the decks.*",
      intro:
        "Different styles, the same high standards: reading the dance floor, preparing every night with you and getting every generation dancing until the very end.",
    },
    fondateur: {
      surtitre: "The founder",
      titre: "Cédric, *aka DJ Dioz*.",
      id: "cedric",
      nom: "Cédric Allard",
      alias: "DJ Dioz",
      role: "DJ and founder",
      styles: ["Every style", "Weddings", "Events"],
      accroche: "Over 20 years on the decks and more than 600 weddings and events.",
      paragraphes: [
        "Cédric turned his passion into his profession: he plays some of the weddings himself and prepares every night the team plays, from the music questionnaire to the running order on the day.",
        "His motto: a good DJ doesn’t hide behind a laptop, he lives the night with you. Depending on your date, he plays himself or introduces you to the DJ from the team who suits you best.",
      ],
      lien: { libelle: "Listen to his mix", href: MIX_CEDRIC },
      image: "presta-cedric-portrait",
    },
    equipe: {
      surtitre: "The DJs",
      titre: "Each with their style. *All with the same spice.*",
      intro: "From Paris clubs to weddings all over France: DJs chosen by Cédric and prepared with the same method.",
    },
    musiciens: {
      surtitre: "Live",
      titre: "A saxophone *over your DJ set*.",
      intro: "For the drinks reception or the party, a musician plays live over the DJ’s mixes.",
    },
    methode: {
      surtitre: "The same method",
      titre: "Whoever your DJ, *nothing is left to chance*.",
      points: [
        { titre: "Prepared by Cédric", texte: "Music questionnaire, planning meetings and running order: Cédric prepares every wedding with you, then hands it over to your DJ." },
        { titre: "Your music", texte: "Your must-plays, the songs to avoid, the key moments: your DJ arrives already knowing your night." },
        { titre: "The same equipment", texte: "Sound and lighting from MX Événement, tested in the workshop before every date, with backup gear on site." },
      ],
    },
    appel: {
      titre: "Which DJ for *your night*?",
      texte: "Tell us your date and your musical tastes: Cédric will suggest the DJ who suits you best.",
      bouton: "Check my date",
    },
  },
});
