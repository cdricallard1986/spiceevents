import type { ContenuOption } from "./types";

export const PHOTOBOOTH: ContenuOption = {
  image: "presta-invites-chapiteau",
  // Pas encore de photo de la borne Spice Events : la galerie est masquée en attendant.
  galerie: [],
  avis: { auteurs: "Beth & Liam", depuis: { fr: "Le photobooth", en: "The photo booth was" }, image: "presta-invites-chapiteau" },
  textes: {
    fr: {
      seo: {
        titre: "Photobooth mariage en Île-de-France : 400 tirages inclus | Spice Events",
        description:
          "Borne photo pour mariage et événement : 400 tirages, cadre personnalisé, photos numériques envoyées dès le lundi. Options sur devis. Paris et Île-de-France.",
      },
      hero: {
        surtitre: "Animation · Photobooth",
        titre: "Les fous rires de vos invités, *imprimés sur le vif*.",
        intro:
          "Capturez, imprimez, partagez : une borne photo fun et personnalisable, pour un mariage, un anniversaire ou un événement d'entreprise.",
      },
      presentation: {
        surtitre: "Le photobooth Spice Events",
        titre: "Des souvenirs instantanés, *capturés avec style*.",
        paragraphes: [
          "Avec ou sans accessoires, le photobooth libère la spontanéité : vos invités se lâchent, enchaînent les poses et repartent avec leur photo imprimée sur place.",
          "Toutes les photos vous sont aussi envoyées en version numérique dès le lundi, pour revivre la fête sans attendre.",
        ],
      },
      listes: [
        {
          titre: "Inclus dans la prestation",
          points: [
            "400 tirages photo",
            "Un cadre personnalisé imprimé sur chaque photo",
            "Toutes les photos en version numérique, envoyées dès le lundi",
            "Le déplacement de la borne entre le cocktail et le repas",
          ],
        },
        {
          titre: "Les petits plus",
          intro: "En option, sur devis :",
          points: [
            "Mur photocall en fond",
            "Habillage de la borne sur mesure",
            "Livraison et installation",
            "Tirages illimités",
            "Accessoires de décoration et déguisements",
          ],
        },
      ],
      appel: {
        titre: "Un photobooth pour *votre soirée* ?",
        texte: "Donnez-nous votre date, votre lieu et le nombre d'invités : Cédric vous prépare un devis sur mesure.",
      },
    },
    en: {
      seo: {
        titre: "Wedding photobooth in Paris: 400 prints included | Spice Events",
        description:
          "Photo booth for weddings and events: 400 prints, a custom frame, digital copies sent the Monday after. Extras on request. Paris and Île-de-France.",
      },
      hero: {
        surtitre: "Entertainment · Photobooth",
        titre: "Your guests' best laughs, *printed on the spot*.",
        intro:
          "Snap, print, share: a fun, customisable photo booth for a wedding, a birthday or a corporate event.",
      },
      presentation: {
        surtitre: "The Spice Events photobooth",
        titre: "Instant memories, *captured in style*.",
        paragraphes: [
          "With or without props, the photobooth brings out everyone's playful side: guests let go, strike pose after pose and leave with their photo printed there and then.",
          "Every photo is also sent to you digitally the Monday after, so you can relive the party straight away.",
        ],
      },
      listes: [
        {
          titre: "Included",
          points: [
            "400 photo prints",
            "A custom frame printed on every photo",
            "All photos in digital format, sent the Monday after",
            "Moving the booth between the drinks reception and dinner",
          ],
        },
        {
          titre: "The extras",
          intro: "Optional, quoted on request:",
          points: [
            "Photo-wall backdrop",
            "Bespoke booth wrap",
            "Delivery and set-up",
            "Unlimited prints",
            "Decorative props and dressing-up accessories",
          ],
        },
      ],
      appel: {
        titre: "A photobooth for *your party*?",
        texte: "Tell us your date, venue and number of guests: Cédric will put together a tailored quote.",
      },
    },
  },
};
