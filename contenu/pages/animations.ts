import type { CleImage } from "@/lib/images";
import type { Bilingue, QuestionReponse, Seo } from "../types";
import { typographier } from "@/lib/typographie";

/** Famille d'une animation, pour les filtres de la page (clé stable, libellé traduit). */
export type CategorieAnimation = "musique" | "souvenirs" | "effets";

/**
 * Animation du carrousel en haut de la page (slug français de `contenu/options.ts`). La
 * première est à moitié visible, floutée, à gauche : les deux suivantes sont au centre.
 */
type Vedette = { option: string; image: CleImage; surtitre: string; titre: string; texte?: string };

/** Page Animations, sur le modèle de la maquette « Nocturne » validée par Cédric (novembre 2026). */
type Animations = {
  seo: Seo;
  intro: { surtitre: string; titre: string; texte: string };
  vedettes: Vedette[];
  catalogue: { surtitre: string; titre: string; intro: string; tout: string; filtres: string; categories: Record<CategorieAnimation, string> };
  /** Accroche de chaque carte du catalogue, par slug français d'option. */
  accroches: Record<string, string>;
  faq: { surtitre: string; titre: string; questions: QuestionReponse[]; lien: string };
  appel: { titre: string; texte: string };
};

/** Famille de chaque animation (slug français → catégorie). */
export const CATEGORIES_ANIMATIONS: Record<string, CategorieAnimation> = typographier({
  "ouverture-de-bal": "effets",
  "bar-a-vinyles": "musique",
  "livre-d-or-audio": "souvenirs",
  photobooth: "souvenirs",
  "guirlandes-lumineuses": "effets",
  "feux-d-artifice-de-jour": "effets",
  "sonorisation-ceremonie-laique": "musique",
  "sonorisation-deportee": "musique",
});

export const ANIMATIONS: Bilingue<Animations> = typographier({
  fr: {
    seo: {
      titre: "Animations de mariage et de soirée en Île-de-France | Spice Events",
      description:
        "Photobooth, bar à vinyles, livre d'or audio, ouverture de bal, guirlandes, feux d'artifice de jour, sonorisation de cérémonie : des animations sur mesure pour votre mariage en Île-de-France.",
    },
    intro: {
      surtitre: "Les petits plus, les grands souvenirs",
      titre: "Le petit plus. *Le grain de piment.*",
      texte:
        "Un vinyle qui rassemble, un souvenir à emporter, des étincelles au bon moment. Choisissez les ingrédients qui donnent du goût à votre fête.",
    },
    vedettes: [
      {
        option: "guirlandes-lumineuses",
        image: "presta-guirlandes-salle",
        surtitre: "Quand le soleil se couche",
        titre: "Allumez la nuit.",
      },
      {
        option: "bar-a-vinyles",
        image: "presta-vinyles-installation",
        surtitre: "Le cocktail a trouvé son rythme",
        titre: "À vous de choisir le disque.",
        texte: "Le bar à vinyles, une rencontre autour de la musique.",
      },
      {
        option: "photobooth",
        image: "presta-photobooth-invitees",
        surtitre: "Souriez, c'est à vous",
        titre: "Les souvenirs se partagent.",
      },
      {
        option: "ouverture-de-bal",
        image: "presta-bal-fumee-etincelles-chapiteau",
        surtitre: "Le moment où tout s'arrête",
        titre: "Une première danse qui pétille.",
      },
      {
        option: "livre-d-or-audio",
        image: "presta-livre-or-entete",
        surtitre: "Un téléphone, mille messages",
        titre: "Leurs voix, gardées au chaud.",
      },
      {
        option: "feux-d-artifice-de-jour",
        image: "presta-feux-artifice-jour-nuit",
        surtitre: "En plein jour, ça crépite",
        titre: "Un final haut en couleur.",
      },
      {
        option: "sonorisation-ceremonie-laique",
        image: "presta-ceremonie-cour",
        surtitre: "Avant la fête, l'émotion",
        titre: "Chaque mot porté jusqu'au dernier rang.",
      },
      {
        option: "sonorisation-deportee",
        image: "presta-sono-grand-salon",
        surtitre: "Partout où vous êtes",
        titre: "La bonne ambiance, dans chaque pièce.",
      },
    ],
    catalogue: {
      surtitre: "À composer selon vos envies",
      titre: "Votre fête. *Votre dose de piment.*",
      intro: "Un peu, beaucoup, à votre goût. Nous vous aidons à composer une fête qui vous ressemble.",
      tout: "Tout découvrir",
      filtres: "Filtrer les animations",
      categories: { musique: "Musique", souvenirs: "Souvenirs", effets: "Lumière & effets" },
    },
    accroches: {
      "ouverture-de-bal": "Votre chanson, quelques étincelles et le temps qui s'arrête.",
      "bar-a-vinyles": "Un disque choisi, une conversation qui commence. Le cocktail prend un autre tempo.",
      "livre-d-or-audio": "Leurs rires, leurs mots, leurs voix. À réécouter longtemps.",
      photobooth: "Des sourires spontanés. Et un souvenir à glisser dans sa poche.",
      "guirlandes-lumineuses": "Une lumière douce pour prolonger les soirées d'été.",
      "feux-d-artifice-de-jour": "Un instant haut en couleur pour une sortie inoubliable.",
      "sonorisation-ceremonie-laique": "Chaque mot entendu. Chaque émotion partagée.",
      "sonorisation-deportee": "La bonne ambiance, dans chacun de vos espaces.",
    },
    faq: {
      surtitre: "Les réponses avant les questions",
      titre: "Quelques détails *utiles*.",
      questions: [
        {
          question: "Comment choisir les animations ?",
          reponse:
            "Nous partons de votre lieu, de votre déroulé et de vos envies. L'idée est de choisir quelques animations qui trouvent naturellement leur place dans la journée, sans l'encombrer.",
        },
        {
          question: "Les effets sont-ils possibles dans tous les lieux ?",
          reponse:
            "La fumée lourde et les étincelles froides nécessitent de vérifier les règles du lieu et ses équipements : certains lieux ont des détecteurs de fumée sensibles. Nous étudions les possibilités avant de confirmer ces options.",
        },
        {
          question: "Peut-on personnaliser le photobooth ?",
          reponse:
            "Oui, le cadre des photos est personnalisé pour votre événement. La prestation comprend 400 tirages, et toutes les photos vous sont envoyées en version numérique dès le lundi.",
        },
      ],
      lien: "Toutes les questions",
    },
    appel: {
      titre: "Un peu de Spice *change la soirée*.",
      texte: "Choisissons ensemble les petites touches qui feront les grands souvenirs.",
    },
  },
  en: {
    seo: {
      titre: "Wedding entertainment in Paris: photobooth, vinyl bar & more | Spice Events",
      description:
        "Photobooth, vinyl bar, audio guestbook, first-dance effects, string lights, daytime fireworks, ceremony sound: tailored entertainment for your wedding in Paris and Île-de-France.",
    },
    intro: {
      surtitre: "Little extras, lasting memories",
      titre: "The little extra. *The pinch of spice.*",
      texte:
        "A record that brings people together, a keepsake to take home, sparks at just the right moment. Pick the ingredients that give your party its flavour.",
    },
    vedettes: [
      {
        option: "guirlandes-lumineuses",
        image: "presta-guirlandes-salle",
        surtitre: "When the sun goes down",
        titre: "Light up the night.",
      },
      {
        option: "bar-a-vinyles",
        image: "presta-vinyles-installation",
        surtitre: "The drinks reception finds its rhythm",
        titre: "You pick the record.",
        texte: "The vinyl bar: people meeting over music.",
      },
      {
        option: "photobooth",
        image: "presta-photobooth-invitees",
        surtitre: "Smile, it's your turn",
        titre: "Memories are for sharing.",
      },
      {
        option: "ouverture-de-bal",
        image: "presta-bal-fumee-etincelles-chapiteau",
        surtitre: "The moment everything stops",
        titre: "A first dance that sparkles.",
      },
      {
        option: "livre-d-or-audio",
        image: "presta-livre-or-entete",
        surtitre: "One phone, a thousand messages",
        titre: "Their voices, kept safe.",
      },
      {
        option: "feux-d-artifice-de-jour",
        image: "presta-feux-artifice-jour-nuit",
        surtitre: "Crackling in broad daylight",
        titre: "A finale full of colour.",
      },
      {
        option: "sonorisation-ceremonie-laique",
        image: "presta-ceremonie-cour",
        surtitre: "Before the party, the emotion",
        titre: "Every word carried to the back row.",
      },
      {
        option: "sonorisation-deportee",
        image: "presta-sono-grand-salon",
        surtitre: "Wherever you are",
        titre: "The right atmosphere, in every room.",
      },
    ],
    catalogue: {
      surtitre: "Build it your way",
      titre: "Your party. *Your dose of spice.*",
      intro: "A little, a lot, just to your taste. We help you put together a party that feels like you.",
      tout: "See everything",
      filtres: "Filter the entertainment",
      categories: { musique: "Music", souvenirs: "Keepsakes", effets: "Light & effects" },
    },
    accroches: {
      "ouverture-de-bal": "Your song, a few sparks, and time standing still.",
      "bar-a-vinyles": "A record picked, a conversation started. The drinks reception takes on a new tempo.",
      "livre-d-or-audio": "Their laughter, their words, their voices. To play back for years.",
      photobooth: "Spontaneous smiles. And a keepsake to slip into a pocket.",
      "guirlandes-lumineuses": "Soft light to make summer evenings last.",
      "feux-d-artifice-de-jour": "A burst of colour for an unforgettable exit.",
      "sonorisation-ceremonie-laique": "Every word heard. Every emotion shared.",
      "sonorisation-deportee": "The right atmosphere, in every one of your spaces.",
    },
    faq: {
      surtitre: "Answers before you ask",
      titre: "A few *useful details*.",
      questions: [
        {
          question: "How do we choose the entertainment?",
          reponse:
            "We start from your venue, your schedule and what you'd love. The idea is to pick a few things that fit naturally into the day, without cluttering it.",
        },
        {
          question: "Are the effects possible in every venue?",
          reponse:
            "Low fog and cold sparks mean checking the venue's rules and equipment: some venues have sensitive smoke detectors. We look into what's possible before confirming these options.",
        },
        {
          question: "Can the photobooth be personalised?",
          reponse:
            "Yes, the photo frame is designed for your event. The package includes 400 prints, and all the photos are sent to you digitally the Monday after.",
        },
      ],
      lien: "All questions",
    },
    appel: {
      titre: "A little spice *changes the night*.",
      texte: "Let's choose together the small touches that make the big memories.",
    },
  },
});
