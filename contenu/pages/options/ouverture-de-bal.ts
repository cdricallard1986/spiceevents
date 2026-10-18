import type { ContenuOption } from "./types";

export const OUVERTURE_DE_BAL: ContenuOption = {
  image: "presta-bal-fumee-bleue",
  galerie: ["presta-bal-fumee-nb", "hero-premiere-danse", "maison-mariage-danse-gobos", "couple-faisceaux"],
  // Photo derrière le grand avis (l\'avis lui-même se choisit dans le back office).
  imageAvis: "premiere-danse-rose",
  textes: {
    fr: {
      seo: {
        titre: "Ouverture de bal : étincelles froides & fumée lourde | Spice Events",
        description:
          "Étincelles froides et fumée lourde synchronisées avec votre première danse : un effet spectaculaire, testé et sécurisé. Mariages à Paris et en Île-de-France.",
      },
      hero: {
        surtitre: "Animation · Ouverture de bal",
        titre: "Votre première danse, *comme au cinéma*.",
        intro:
          "Fumée lourde au sol et étincelles froides, synchronisées avec votre chanson : l'ouverture de bal devient le moment que vos invités n'oublieront pas.",
      },
      presentation: {
        surtitre: "Le package",
        titre: "Deux effets, *un seul instant*.",
        paragraphes: [
          "L'ouverture de bal marque le début de la fête. Nous vous aidons à en faire un moment à la fois poétique et grandiose, à votre image.",
          "La fumée lourde enveloppe la piste et sublime vos mouvements ; les étincelles froides jaillissent autour de vous, parfaitement synchronisées avec votre musique. L'effet est saisissant dès les premières notes.",
        ],
      },
      listes: [
        {
          titre: "Chaque détail maîtrisé",
          points: [
            "Étincelles froides et fumée lourde, déclenchées au bon moment de votre chanson",
            "Tests techniques avant l'événement",
            "Matériel de remplacement prévu pour parer à tout imprévu",
            "La sécurité de vos invités, à chaque étape",
          ],
        },
      ],
      avertissement:
        "Ces effets ne sont pas compatibles avec les détecteurs de fumée : nous ne réalisons pas cette prestation dans les lieux qui en sont équipés. Nous vérifions toujours les contraintes de votre lieu avant de vous la proposer.",
      appel: {
        titre: "Une première danse *à couper le souffle* ?",
        texte: "Donnez-nous votre date et votre lieu : nous vérifions que tout est compatible et préparons l'effet avec vous.",
      },
    },
    en: {
      seo: {
        titre: "Spectacular first dance: cold sparks & low fog | Spice Events, Paris",
        description:
          "Cold sparks and low fog synchronised with your first dance: a show-stopping effect, tested and safe. Weddings in Paris and across Île-de-France.",
      },
      hero: {
        surtitre: "Entertainment · First dance",
        titre: "Your first dance, *straight out of a film*.",
        intro:
          "Low fog across the floor and cold sparks, timed to your song: the first dance becomes the moment your guests will never forget.",
      },
      presentation: {
        surtitre: "The package",
        titre: "Two effects, *one moment*.",
        paragraphes: [
          "Your first dance is the moment the party begins. We help you make it both poetic and grand, and entirely yours.",
          "Low fog wraps the dance floor and flatters every move, while cold sparks rise around you, perfectly in time with your music. The effect is breathtaking from the very first notes.",
        ],
      },
      listes: [
        {
          titre: "Every detail under control",
          points: [
            "Cold sparks and low fog, triggered at exactly the right point in your song",
            "Technical tests ahead of the day",
            "Backup equipment on hand for anything unexpected",
            "Your guests' safety at every stage",
          ],
        },
      ],
      avertissement:
        "These effects can't be used alongside smoke detectors, so we don't offer them in venues fitted with them. We always check your venue's constraints before suggesting this option.",
      appel: {
        titre: "A first dance *to take their breath away*?",
        texte: "Tell us your date and venue: we'll check everything is compatible and plan the effect with you.",
      },
    },
  },
};
