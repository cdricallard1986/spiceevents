import { typographier } from "@/lib/typographie";
import type { PageLocale } from "./types";

/**
 * Page locale « DJ mariage en Seine-et-Marne » (français seulement).
 *
 * Règle de Google sur les pages locales : une vraie page, pas une copie de la
 * page Mariages avec un autre nom de département. Tout ce qui est écrit ici
 * vient des mariages réellement animés dans le 77 (planning et dossiers des
 * mariés de Cédric, novembre 2026) et des avis déjà publiés sur le site.
 * Communes vérifiées sur les fiches publiques des lieux.
 *
 * Règle de Cédric : ne parler des lieux que pour les mettre en valeur (aucune
 * contrainte, aucun défaut).
 */

export const SEINE_ET_MARNE: PageLocale = typographier({
  seo: {
    titre: "DJ mariage en Seine-et-Marne (77) | Spice Events",
    description:
      "DJ de mariage en Seine-et-Marne : châteaux, fermes et domaines de la Brie où nous avons fait danser les mariés, avis de couples, son et lumière sur mesure.",
  },
  ariane: "Seine-et-Marne",
  hero: {
    surtitre: "Seine-et-Marne · 77",
    titre: "DJ mariage *en Seine-et-Marne*",
    intro:
      "Châteaux de la Brie, corps de ferme, prieurés et domaines : nous connaissons les lieux de réception du 77, leurs salles, leurs charmes et la meilleure façon d’y faire danser vos invités jusqu’au bout de la nuit.",
  },
  promesse: {
    surtitre: "Un département que nous connaissons",
    titre: "Chaque lieu a *son caractère*. Nous le mettons en valeur.",
    paragraphes: [
      "En Seine-et-Marne, on se marie rarement dans une simple salle : une cérémonie dans le jardin, un cocktail devant la véranda, un dîner dans une grange, la soirée dans une autre salle. Chaque moment de la journée a son décor, et nous préparons la technique pour que chacun brille.",
      "Avant votre mariage, nous étudions le plan du lieu et le déroulé de votre journée : où placer la sonorisation pour chaque moment, comment éclairer chaque espace, et à quelle heure tout doit être prêt. Le jour J, il ne reste que la fête.",
    ],
  },
  cartes: {
    surtitre: "Ils nous ont accueillis",
    titre: "Quelques lieux du 77 *où nous avons fait danser*",
    intro: "Des mariages que nous avons animés, avec ce qui les a rendus uniques.",
    liste: [
      {
        titre: "Le Grand Hôtel du Bois",
        surtitre: "Jouarre",
        detail: "2 mariages, 2024 et 2025",
        texte:
          "Un corps de ferme à l’esprit industriel. Cérémonie laïque rétro, cocktail au jardin avec une sonorisation déportée, bar à vinyles et photobooth ; l’année suivante, un mariage franco-turc avec un orchestre au cocktail devant la véranda, une session de musique turque pendant le dîner et une piste pleine jusqu’à 5 h.",
      },
      {
        titre: "Château de Bonaventure",
        surtitre: "Aulnoy",
        detail: "Septembre 2026",
        texte:
          "Environ 150 invités et plusieurs salles. Cérémonie laïque préparée avec l’officiant, cocktail, dîner et soirée dansante : un éclairage pensé pour chaque salle et adapté au décor du château, avec le photobooth en prime.",
      },
      {
        titre: "Le Prieuré de Vernelle",
        surtitre: "Grisy-Suisnes",
        detail: "Octobre 2024",
        texte:
          "Un ancien prieuré privatisé pour la journée : cérémonie à la chapelle, cocktail devant la salle ou au cloître, dîner et piste dans deux salles, chacune avec sa sonorisation. Un thème fantaisie jusque dans la musique, et des invités encore sur la piste à 5 h.",
      },
      {
        titre: "Ferme d’Orsonville",
        surtitre: "Villiers-en-Bière",
        detail: "Septembre 2024",
        texte:
          "Une journée entière, de midi au bout de la nuit : cérémonie laïque au fond du jardin avec diaporama, cocktail bossa nova, entrée des mariés dans le jardin, discours diffusés à l’écran et ouverture de bal chorégraphiée.",
      },
      {
        titre: "Château du Vivier",
        surtitre: "Fontenay-Trésigny",
        detail: "4 mariages, de 2012 à 2026",
        texte:
          "Le dernier en date : environ 130 invités, cérémonie laïque, vidéoprojection, livre d’or audio, bar à vinyles, le château éclairé à la nuit tombée, et un dîner dans une salle séparée de la piste.",
      },
      {
        titre: "Domaine du Parc",
        surtitre: "Pontcarré",
        detail: "Mars 2020",
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
        contexte: "Le Grand Hôtel du Bois, Jouarre",
      },
      {
        texte:
          "Il est très observateur et attentif à ce qui se passe sur la piste, il a su mettre les bons morceaux au bon moment afin de nous faire danser jusqu’à 5 h !",
        auteurs: "Frédéric & Selda",
        contexte: "Le Grand Hôtel du Bois, Jouarre",
      },
      {
        texte:
          "Tout a été respecté, que ce soit au niveau des sons choisis, du photobooth, de l’enchaînement lors de la cérémonie laïque (il a pris contact avec notre officiant), au cocktail, à la réception et la soirée dansante, l’éclairage au top dans toutes les salles et adapté à l’environnement.",
        auteurs: "Nicolas",
        contexte: "Château de Bonaventure, Aulnoy",
      },
      {
        texte:
          "Cédric a su être à l’écoute de nos demandes, s’adapter à notre lieu (et ses différentes salles) et à l’univers de notre mariage. Du début à la fin de la partie dansante, la piste n’a pas désempli, nous étions encore une dizaine à 5 h du matin !",
        auteurs: "Coralie & Benjamin",
        contexte: "Le Prieuré de Vernelle",
      },
      {
        texte:
          "Il a pu totalement prendre en compte nos souhaits, tant pour la cérémonie laïque que pour le repas et la partie festive. Nous avons énormément apprécié sa décoration et la qualité du matériel son.",
        auteurs: "Pierre",
        contexte: "Ferme d’Orsonville, Villiers-en-Bière",
      },
    ],
  },
  atouts: {
    surtitre: "Pourquoi le 77",
    titre: "Les atouts des lieux *de Seine-et-Marne*",
    intro: "Ce que nous aimons dans les châteaux, fermes et domaines du département, et comment nous en tirons le meilleur.",
    liste: [
      {
        titre: "Un décor pour chaque moment",
        texte:
          "Jardin pour la cérémonie, terrasse ou véranda pour le cocktail, grange ou orangerie pour le dîner, une salle pour danser : la journée change de décor, et la musique suit d’un espace à l’autre.",
      },
      {
        titre: "Des cérémonies en plein air",
        texte:
          "Parcs, jardins, cloîtres : des cadres naturels pour une cérémonie laïque. Nous la sonorisons pour que chaque mot soit entendu, avec la musique de votre entrée au bon moment.",
      },
      {
        titre: "Charpentes et vieilles pierres",
        texte:
          "Granges, prieurés, châteaux : des volumes et des matières que la lumière sublime. Nous éclairons la charpente et les murs pour révéler le lieu à la nuit tombée.",
      },
      {
        titre: "La fête jusqu’au bout de la nuit",
        texte:
          "Beaucoup de domaines sont privatisés pour vous seuls : nos mariés ont dansé jusqu’à 5 h au Prieuré de Vernelle comme au Grand Hôtel du Bois.",
      },
      {
        titre: "Vos invités dorment sur place",
        texte:
          "Nombre de domaines logent les invités : personne ne surveille sa montre ni la route du retour, et la piste en profite.",
      },
      {
        titre: "La campagne aux portes de Paris",
        texte:
          "Vallée de la Marne, plateaux de la Brie, forêts de Ferrières ou de Fontainebleau : un mariage à la campagne, à environ une heure de Paris pour vos invités.",
      },
    ],
  },
  anecdote: {
    surtitre: "Le saviez-vous ?",
    titre: "La fête *la plus célèbre* de Seine-et-Marne",
    texte:
      "Le 17 août 1661, Nicolas Fouquet reçoit Louis XIV au château de Vaux-le-Vicomte : comédie de Molière, festin préparé par Vatel, feu d’artifice au-dessus des jardins de Le Nôtre. La fête est si éblouissante que le roi fait arrêter son hôte moins de trois semaines plus tard, puis confie Versailles aux mêmes artistes. En Seine-et-Marne, une belle fête marque les esprits depuis plus de trois siècles : à nous d’écrire la vôtre.",
  },
  photos: { entete: "mariage-soiree-faisceaux", promesse: "maison-mariage-charpente" },
  appel: {
    titre: "Vous vous mariez *en Seine-et-Marne* ?",
    texte: "Dites-nous votre date et votre lieu : nous vous répondons personnellement, avec ce que nous savons déjà de votre domaine.",
    bouton: "Vérifier ma date",
  },
});
