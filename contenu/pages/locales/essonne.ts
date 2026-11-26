import { typographier } from "@/lib/typographie";
import type { PageLocale } from "./types";

/**
 * Page locale « DJ mariage en Essonne » (français seulement).
 * Mariages réellement animés (planning de Cédric, novembre 2026) : Orangerie du
 * Château de Farcheville (2024), Moulin des Noues (2025), DOR à Vigneux-sur-Seine
 * (2026) ; Château du Maréchal de Saxe (Yerres) réservé pour 2027. Avis : ceux
 * déjà publiés sur le site. Communes vérifiées sur les fiches publiques des lieux.
 */
export const ESSONNE: PageLocale = typographier({
  seo: {
    titre: "DJ mariage en Essonne (91) | Spice Events",
    description:
      "DJ de mariage en Essonne : Château de Farcheville, Moulin des Noues, Vigneux-sur-Seine… les lieux où nous avons fait danser les mariés, et leurs avis.",
  },
  ariane: "Essonne",
  hero: {
    surtitre: "Essonne · 91",
    titre: "DJ mariage *en Essonne*",
    intro:
      "Château médiéval, moulin du Gâtinais, salle de réception aux portes de Paris : en Essonne, nous avons fait danser les mariés dans des lieux très différents, avec la même exigence de son et de lumière.",
  },
  promesse: {
    surtitre: "Du château au moulin",
    titre: "Un département, *mille ambiances*.",
    paragraphes: [
      "Entre la vallée de la Seine, le Hurepoix et le parc naturel du Gâtinais, l’Essonne offre des lieux de mariage pour tous les styles : orangerie de château, moulin restauré, salle de réception moderne. Chacun a son caractère, et nous adaptons la sonorisation et l’éclairage pour le mettre en valeur.",
      "Avant votre mariage, nous étudions le lieu et le déroulé de votre journée : où placer le son pour chaque moment, comment éclairer chaque espace, et à quelle heure tout doit être prêt. Le jour J, il ne reste que la fête.",
    ],
  },
  cartes: {
    surtitre: "Ils nous ont accueillis",
    titre: "Les lieux de l’Essonne *où nous avons fait danser*",
    intro: "Des mariages que nous avons animés, avec ce qui les a rendus uniques.",
    liste: [
      {
        titre: "Orangerie du Château de Farcheville",
        surtitre: "Bouville",
        detail: "Septembre 2024",
        texte:
          "Un château fortifié du Moyen Âge et sa grande orangerie : 140 invités, un cocktail au son d’un groupe de jazz, puis le dîner et la soirée dans l’orangerie, avec une ouverture de bal mixée sur mesure.",
      },
      {
        titre: "Le Moulin des Noues",
        surtitre: "Soisy-sur-École",
        detail: "Septembre 2025",
        texte:
          "Un moulin restauré au cœur du Gâtinais : une cérémonie laïque pleine d’émotion, bar à vinyles et jeux des mariés, puis photobooth et lumières d’ambiance pour la soirée.",
      },
      {
        titre: "DOR",
        surtitre: "Vigneux-sur-Seine",
        detail: "Juin 2026",
        texte:
          "Une salle de réception aux portes de Paris : une centaine d’invités, un saxophoniste aux côtés du DJ, et une sonorisation à l’intérieur comme à l’extérieur.",
      },
    ],
    aussi: "Prochain rendez-vous : un mariage au Château du Maréchal de Saxe, à Yerres, en 2027.",
  },
  avis: {
    surtitre: "Ils se sont mariés en Essonne",
    titre: "Ce qu’ils *en ont dit*",
    liste: [
      {
        texte:
          "Merci Cédric pour ton accompagnement, tes bons conseils et ton professionnalisme le jour J ! Nous avons eu plein de compliments sur la soirée dansante et l’ambiance de notre mariage !",
        auteurs: "Marie & Quentin",
        contexte: "Orangerie du Château de Farcheville",
      },
      {
        texte:
          "Que ce soit sur le choix de ses musiques, l’ambiance, la gestion du mix pour l’ouverture de bal, tout était parfait ! Il a de très bons conseils et de bonnes idées ! Installation parfaite.",
        auteurs: "Quentin",
        contexte: "Orangerie du Château de Farcheville",
      },
      {
        texte:
          "Le petit plus a été lors de la cérémonie laïque où son sens du timing a permis de susciter l’émotion à l’ensemble de nos invités en créant une atmosphère romantique. Ce joyeux mélange a contribué à créer un mariage parfait.",
        auteurs: "Pascal & Abigaïl",
        contexte: "Le Moulin des Noues, Soisy-sur-École",
      },
    ],
  },
  atouts: {
    surtitre: "Pourquoi l’Essonne",
    titre: "Les atouts des lieux *de l’Essonne*",
    intro: "Ce que nous aimons dans les châteaux, moulins et domaines du département, et comment nous en tirons le meilleur.",
    liste: [
      {
        titre: "Des châteaux chargés d’histoire",
        texte:
          "Forteresses médiévales, orangeries, demeures du XVIIIe siècle : des cadres que la lumière révèle à la nuit tombée.",
      },
      {
        titre: "La douceur du Gâtinais",
        texte:
          "Moulins, fermes et villages de pierre du parc naturel du Gâtinais français : la campagne, à moins d’une heure de Paris.",
      },
      {
        titre: "Un décor pour chaque moment",
        texte:
          "Cérémonie au jardin, cocktail en terrasse, dîner et soirée en salle : la journée change de décor, et la musique suit d’un espace à l’autre.",
      },
      {
        titre: "Des cérémonies en plein air",
        texte:
          "Parcs et jardins se prêtent aux cérémonies laïques. Nous les sonorisons pour que chaque mot soit entendu, avec la musique de votre entrée au bon moment.",
      },
      {
        titre: "Vos invités dorment sur place",
        texte:
          "Nombre de domaines logent les invités : personne ne surveille sa montre ni la route du retour, et la piste en profite.",
      },
      {
        titre: "Aux portes de Paris",
        texte:
          "Des salles de réception faciles d’accès, en voiture comme en RER : vos invités arrivent sans détour, et la fête commence plus tôt.",
      },
    ],
  },
  anecdote: {
    surtitre: "Le saviez-vous ?",
    titre: "La cathédrale *la plus jeune* de France",
    texte:
      "Inaugurée en 1995 à Évry, la cathédrale de la Résurrection, dessinée par l’architecte suisse Mario Botta, est la seule cathédrale construite en France au XXe siècle. Un grand cylindre de brique couronné d’arbres : en Essonne, on sait encore surprendre, et c’est exactement ce que nous aimons faire sur une piste de danse.",
  },
  photos: { entete: "mariage-soiree-bras-leves", promesse: "mariage-soiree-cabine" },
  appel: {
    titre: "Vous vous mariez *en Essonne* ?",
    texte: "Dites-nous votre date et votre lieu : nous vous répondons personnellement, avec ce que nous savons déjà de votre domaine.",
    bouton: "Vérifier ma date",
  },
});
