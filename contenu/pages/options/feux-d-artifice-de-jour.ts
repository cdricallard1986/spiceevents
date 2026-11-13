import type { ContenuOption } from "./types";
import { typographier } from "@/lib/typographie";

export const FEUX_D_ARTIFICE_DE_JOUR: ContenuOption = typographier({
  image: "presta-feux-artifice-jour-nuit",
  // Galerie en base (back office) ; liste du code vide : sans Supabase, la galerie est masquée.
  galerie: [],
  textes: {
    fr: {
      seo: {
        titre: "Feu d’artifice de jour pour mariage : poudre multicolore | Spice Events",
        description:
          "Un feu d’artifice de jour aux fumées multicolores pour la sortie de cérémonie ou la photo de groupe. Mariages et événements à Paris et en Île-de-France.",
      },
      hero: {
        surtitre: "Effets spéciaux · En plein jour",
        titre: "Un feu d’artifice, *en plein jour*.",
        intro:
          "Des gerbes de poudre et de fumées multicolores qui éclatent dans le ciel : un final spectaculaire, sans attendre la nuit.",
      },
      presentation: {
        surtitre: "Le principe",
        titre: "Les couleurs, *à la place des étincelles*.",
        paragraphes: [
          "Un feu d’artifice classique a besoin de la nuit. Le feu d’artifice de jour, lui, se voit en pleine lumière : il dessine dans le ciel des éventails de poudre et de fumées colorées, aux teintes de votre choix.",
          "C’est un moment de surprise et d’émotion partagée, que vos invités découvrent ensemble — et qui offre à votre photographe des images uniques, en plein après-midi.",
          "Nous le synchronisons avec votre déroulé et votre musique, et nous vérifions en amont avec votre lieu ce qui est possible : espace en plein air, distances, autorisations.",
        ],
      },
      listes: [
        {
          titre: "Idéal pour",
          points: [
            "La sortie de cérémonie",
            "La photo de groupe",
            "Le final du cocktail, avant de passer à table",
            "Un temps fort d’événement d’entreprise en extérieur",
          ],
        },
        {
          titre: "À prévoir",
          intro: "Dès le premier échange, nous regardons ensemble :",
          points: ["L’accord de votre lieu", "L’espace en plein air disponible", "Le moment idéal dans votre journée"],
        },
      ],
      appel: {
        titre: "Un final *haut en couleurs* ?",
        texte: "Parlez-nous de votre événement et de votre déroulé : nous vous disons ce qui est possible, et quand.",
      },
    },
    en: {
      seo: {
        titre: "Daytime wedding fireworks with coloured powder | Spice Events",
        description:
          "Daytime fireworks with multicoloured smoke for your ceremony exit or group photo. Weddings and events in Paris and the Île-de-France region.",
      },
      hero: {
        surtitre: "Special effects · In broad daylight",
        titre: "Fireworks, *in broad daylight*.",
        intro: "Bursts of multicoloured powder and smoke lighting up the sky: a spectacular finale, without waiting for nightfall.",
      },
      presentation: {
        surtitre: "The idea",
        titre: "Colour, *instead of sparks*.",
        paragraphes: [
          "Classic fireworks need the dark. Daytime fireworks shine in full light: they paint fans of coloured powder and smoke across the sky, in the shades you choose.",
          "It is a moment of surprise and shared emotion that your guests discover together — and it gives your photographer one-of-a-kind shots in the middle of the afternoon.",
          "We time it to your schedule and your music, and we check with your venue in advance what is possible: outdoor space, distances, permissions.",
        ],
      },
      listes: [
        {
          titre: "Perfect for",
          points: [
            "Your ceremony exit",
            "The group photo",
            "The end of the drinks reception, before dinner",
            "An outdoor highlight at a corporate event",
          ],
        },
        {
          titre: "Things to plan",
          intro: "From our first conversation, we look together at:",
          points: ["Your venue’s approval", "The outdoor space available", "The best moment in your day"],
        },
      ],
      appel: {
        titre: "A *colourful* finale?",
        texte: "Tell us about your event and your schedule: we’ll tell you what is possible, and when.",
      },
    },
  },
});
