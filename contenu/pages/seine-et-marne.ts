import type { CleImage } from "@/lib/images";
import type { Seo } from "../types";
import { typographier } from "@/lib/typographie";

/**
 * Page locale « DJ mariage en Seine-et-Marne » (français seulement).
 *
 * Règle de Google sur les pages locales : une vraie page, pas une copie de la
 * page Mariages avec un autre nom de département. Tout ce qui est écrit ici
 * vient des mariages réellement animés dans le 77 (planning et dossiers des
 * mariés de Cédric, novembre 2026) et des avis déjà publiés sur le site.
 * Communes vérifiées sur les fiches publiques des lieux.
 */

type Lieu = {
  nom: string;
  commune: string;
  /** Ce que nous y avons fait : faits tirés des dossiers, sans nom de client. */
  texte: string;
  mariages: string;
};

type Citation = { texte: string; auteurs: string; lieu: string };

type SeineEtMarne = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  promesse: { surtitre: string; titre: string; paragraphes: string[] };
  lieux: { surtitre: string; titre: string; intro: string; liste: Lieu[]; aussi: string };
  avis: { surtitre: string; titre: string; liste: Citation[] };
  conseils: { surtitre: string; titre: string; intro: string; liste: { titre: string; texte: string }[] };
  /** Une seule photo par endroit : jamais deux photos d’un même mariage côte à côte. */
  photos: { entete: CleImage; promesse: CleImage };
  appel: { titre: string; texte: string; bouton: string };
};

export const SEINE_ET_MARNE: SeineEtMarne = typographier({
  seo: {
    titre: "DJ mariage en Seine-et-Marne (77) | Spice Events",
    description:
      "DJ de mariage en Seine-et-Marne : châteaux, fermes et domaines de la Brie où nous avons fait danser les mariés, avis de couples, son et lumière sur mesure.",
  },
  hero: {
    surtitre: "Seine-et-Marne · 77",
    titre: "DJ mariage *en Seine-et-Marne*",
    intro:
      "Châteaux de la Brie, corps de ferme, prieurés et domaines : nous connaissons les lieux de réception du 77, leurs salles, leurs contraintes et la meilleure façon d’y faire danser vos invités jusqu’au bout de la nuit.",
  },
  promesse: {
    surtitre: "Un département que nous connaissons",
    titre: "Chaque lieu a *son caractère*. Nous l’anticipons.",
    paragraphes: [
      "En Seine-et-Marne, on se marie rarement dans une simple salle : une cérémonie dans le jardin, un cocktail devant la véranda, un dîner dans une grange, la soirée dans une autre salle. Ces lieux sont superbes, mais ils demandent une vraie préparation technique.",
      "Avant votre mariage, nous étudions le plan du lieu et le déroulé de votre journée : où placer la sonorisation pour chaque moment, comment éclairer chaque espace, où ranger le matériel et à quelle heure tout doit être prêt. Le jour J, il n’y a plus de surprise : il reste la fête.",
    ],
  },
  lieux: {
    surtitre: "Ils nous ont accueillis",
    titre: "Quelques lieux du 77 *où nous avons fait danser*",
    intro: "Des mariages que nous avons animés, avec ce qui les a rendus uniques.",
    liste: [
      {
        nom: "Le Grand Hôtel du Bois",
        commune: "Jouarre",
        mariages: "2 mariages, 2024 et 2025",
        texte:
          "Un corps de ferme à l’esprit industriel. Cérémonie laïque rétro, cocktail au jardin avec une sonorisation déportée, bar à vinyles et photobooth ; l’année suivante, un mariage franco-turc avec un orchestre au cocktail devant la véranda, une session de musique turque pendant le dîner et une piste pleine jusqu’à 5 h.",
      },
      {
        nom: "Château de Bonaventure",
        commune: "Aulnoy",
        mariages: "Septembre 2026",
        texte:
          "Environ 150 invités et plusieurs salles. Cérémonie laïque préparée avec l’officiant, cocktail, dîner et soirée dansante : un éclairage pensé pour chaque salle et adapté au décor du château, avec le photobooth en prime.",
      },
      {
        nom: "Le Prieuré de Vernelle",
        commune: "Grisy-Suisnes",
        mariages: "Octobre 2024",
        texte:
          "Un ancien prieuré privatisé pour la journée : cérémonie à la chapelle, cocktail devant la salle (ou au cloître s’il pleut), dîner et piste dans deux salles différentes, avec des enceintes supplémentaires pour que chaque espace ait le bon son. Un thème fantaisie jusque dans la musique, et des invités encore sur la piste à 5 h.",
      },
      {
        nom: "Ferme d’Orsonville",
        commune: "Villiers-en-Bière",
        mariages: "Septembre 2024",
        texte:
          "Une journée entière, de midi au bout de la nuit : cérémonie laïque au fond du jardin avec diaporama, cocktail bossa nova, entrée des mariés dans le jardin, discours diffusés à l’écran et ouverture de bal chorégraphiée.",
      },
      {
        nom: "Château du Vivier",
        commune: "Fontenay-Trésigny",
        mariages: "2 mariages, 2015 et 2026",
        texte:
          "Environ 130 invités : cérémonie laïque, vidéoprojection, livre d’or audio, bar à vinyles, éclairage extérieur, et un dîner dans une salle séparée de la piste.",
      },
      {
        nom: "Domaine du Parc",
        commune: "Pontcarré",
        mariages: "Mars 2020",
        texte:
          "Un domaine entouré de douves, aux portes de la forêt de Ferrières : une centaine d’invités pour un cocktail et une soirée animés aux platines comme à la lumière.",
      },
    ],
    aussi:
      "Nous avons aussi fait danser les mariés au Manoir de mon Père (Les Écrennes), à la Ferme de la Ronce (La Houssaye-en-Brie) et au Clos des Fermiers (Giremoutiers).",
  },
  avis: {
    surtitre: "Ils se sont mariés en Seine-et-Marne",
    titre: "Ce qu’ils *en ont dit*",
    liste: [
      {
        texte:
          "De la cérémonie laïque rétro au dance floor électro en passant par le blind test intergénérationnel, il a su emporter tous nos invités au fil de la journée. Notre ouverture de bal était digne d’un Danse avec les stars. Les jeux de lumières étaient parfaits !",
        auteurs: "Clémentine & Kévin",
        lieu: "Le Grand Hôtel du Bois, Jouarre",
      },
      {
        texte:
          "Il est très observateur et attentif à ce qui se passe sur la piste, il a su mettre les bons morceaux au bon moment afin de nous faire danser jusqu’à 5 h !",
        auteurs: "Frédéric & Selda",
        lieu: "Le Grand Hôtel du Bois, Jouarre",
      },
      {
        texte:
          "Tout a été respecté, que ce soit au niveau des sons choisis, du photobooth, de l’enchaînement lors de la cérémonie laïque (il a pris contact avec notre officiant), au cocktail, à la réception et la soirée dansante, l’éclairage au top dans toutes les salles et adapté à l’environnement.",
        auteurs: "Nicolas",
        lieu: "Château de Bonaventure, Aulnoy",
      },
      {
        texte:
          "Cédric a su être à l’écoute de nos demandes, s’adapter à notre lieu (et ses différentes salles) et à l’univers de notre mariage. Du début à la fin de la partie dansante, la piste n’a pas désempli, nous étions encore une dizaine à 5 h du matin !",
        auteurs: "Coralie & Benjamin",
        lieu: "Le Prieuré de Vernelle",
      },
      {
        texte:
          "Il a pu totalement prendre en compte nos souhaits, tant pour la cérémonie laïque que pour le repas et la partie festive. Nous avons énormément apprécié sa décoration et la qualité du matériel son.",
        auteurs: "Pierre",
        lieu: "Ferme d’Orsonville, Villiers-en-Bière",
      },
    ],
  },
  conseils: {
    surtitre: "Bon à savoir",
    titre: "Se marier dans un lieu du 77 : *ce que nous anticipons*",
    intro: "Ce que nous ont appris les châteaux, fermes et domaines du département.",
    liste: [
      {
        titre: "Plusieurs espaces, un seul fil musical",
        texte:
          "Cérémonie au jardin, cocktail en terrasse, dîner dans une salle, soirée dans une autre : nous prévoyons une sonorisation déportée pour que chaque moment ait son ambiance, sans coupure entre deux espaces.",
      },
      {
        titre: "Un plan B en cas de pluie",
        texte:
          "Un cocktail prévu dehors peut se replier dans un cloître, une véranda ou une grange. Nous convenons avec vous et le lieu de l’endroit où se replier, pour que la musique suive sans improvisation.",
      },
      {
        titre: "Granges, charpentes et vieilles pierres",
        texte:
          "Ces volumes sont magnifiques mais résonnent. Nous adaptons le placement et le réglage des enceintes pour un son clair au dîner comme sur la piste, et un éclairage qui met en valeur la charpente plutôt que de l’écraser.",
      },
      {
        titre: "Limiteurs, détecteurs et horaires",
        texte:
          "Limiteur de son, détecteurs de fumée sensibles, heure de fin imposée : nous les vérifions avec le lieu dès le premier échange, pour choisir les bonnes animations et éviter toute coupure le soir même.",
      },
      {
        titre: "Accès et installation",
        texte:
          "Marches, chemin de terre, accès véhicule limité : nous posons ces questions avant le mariage pour installer et désinstaller en toute discrétion, sans gêner le traiteur ni vos invités.",
      },
    ],
  },
  photos: { entete: "mariage-soiree-faisceaux", promesse: "maison-mariage-charpente" },
  appel: {
    titre: "Vous vous mariez *en Seine-et-Marne* ?",
    texte: "Dites-nous votre date et votre lieu : nous vous répondons personnellement, avec ce que nous savons déjà de votre domaine.",
    bouton: "Vérifier ma date",
  },
});
