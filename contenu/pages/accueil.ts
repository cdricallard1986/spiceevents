import type { Bilingue, Etape, Seo } from "../types";

type Accueil = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string; ctaPrincipal: string; ctaSecondaire: string };
  dj: { titre: string; paragraphes: string[]; lien: string };
  journee: { surtitre: string; titre: string; intro: string; etapes: Etape[]; lien: string };
  animations: { surtitre: string; titre: string; lien: string };
  evenements: { surtitre: string; titre: string; texte: string; lien: string };
  avis: { surtitre: string; titre: string };
};

export const ACCUEIL: Bilingue<Accueil> = {
  fr: {
    seo: {
      titre: "DJ mariage en Île-de-France — son, lumière & animations | Spice Events",
      description:
        "DJ de mariage primé aux Wedding Awards Mariages.net : préparation sur mesure, sonorisation et éclairage haut de gamme, animations. Paris et Île-de-France.",
    },
    hero: {
      surtitre: "DJ mariage · Son · Lumière · Île-de-France",
      titre: "La nuit dont vos invités *parleront encore*.",
      intro:
        "De la cérémonie au dernier morceau, Cédric et l'équipe Spice Events préparent avec vous la musique, la lumière et le rythme de votre mariage.",
      ctaPrincipal: "Vérifier ma date",
      ctaSecondaire: "Découvrir nos mariages",
    },
    dj: {
      titre: "Un DJ qui lit la piste, *pas une playlist*.",
      paragraphes: [
        "Depuis plus de 20 ans, Cédric fait danser les mariés et leurs invités : plus de 350 mariages et événements. Questionnaire musical, rendez-vous de préparation, coordination avec vos prestataires — le jour J, tout est déjà pensé.",
        "Le son et la lumière sont fournis par notre partenaire MX Événement : un matériel haut de gamme, testé en atelier avant chaque date, avec du matériel de secours sur place.",
      ],
      lien: "Rencontrer Cédric",
    },
    journee: {
      surtitre: "Votre journée",
      titre: "Chaque moment a sa musique, *sa lumière*, son tempo.",
      intro: "Nous accompagnons toute la journée, pas seulement la soirée.",
      etapes: [
        { titre: "Cérémonie", texte: "Micros, entrée des mariés, musique lancée à la seconde près." },
        { titre: "Cocktail", texte: "Sonorisation déportée, bar à vinyles, livre d'or audio." },
        { titre: "Dîner", texte: "Lumière chaude, discours et projections intégrés au déroulé." },
        { titre: "Ouverture de bal", texte: "Fumée lourde et étincelles froides, synchronisées à votre chanson." },
        { titre: "Soirée", texte: "Une piste pleine, toutes générations confondues, jusqu'à 4 h." },
      ],
      lien: "Tout savoir sur nos mariages",
    },
    animations: {
      surtitre: "Les petits plus",
      titre: "Des animations dont on *se souvient*.",
      lien: "Toutes les animations",
    },
    evenements: {
      surtitre: "Soirées privées & entreprises",
      titre: "Le même soin pour *tous vos événements*.",
      texte:
        "Anniversaires, galas, séminaires, lancements de produit : direction musicale, son, lumière et coordination, avec la même exigence que pour un mariage.",
      lien: "Événements privés et professionnels",
    },
    avis: { surtitre: "Ils nous ont fait confiance", titre: "Les mariés *en parlent* mieux que nous." },
  },
  en: {
    seo: {
      titre: "Wedding DJ in Paris & Île-de-France — sound, lighting & entertainment | Spice Events",
      description:
        "Award-winning wedding DJ (Mariages.net Wedding Awards): tailored preparation, premium sound and lighting, entertainment. Paris and the Île-de-France region.",
    },
    hero: {
      surtitre: "Wedding DJ · Sound · Lighting · Paris area",
      titre: "The night your guests *will still talk about*.",
      intro:
        "From the ceremony to the very last song, Cédric and the Spice Events team plan the music, the lighting and the pace of your wedding with you.",
      ctaPrincipal: "Check my date",
      ctaSecondaire: "Our weddings",
    },
    dj: {
      titre: "A DJ who reads the dance floor, *not a playlist*.",
      paragraphes: [
        "For over 20 years, Cédric has been getting couples and their guests on the dance floor: more than 350 weddings and events. Music questionnaire, planning meetings, coordination with your other suppliers — by the big day, everything has been thought through.",
        "Sound and lighting come from our partner MX Événement: premium equipment, tested in the workshop before every date, with backup gear on site.",
      ],
      lien: "Meet Cédric",
    },
    journee: {
      surtitre: "Your day",
      titre: "Every moment has its music, *its light*, its tempo.",
      intro: "We look after the whole day, not just the party.",
      etapes: [
        { titre: "Ceremony", texte: "Microphones, your entrance, music cued to the second." },
        { titre: "Drinks reception", texte: "Remote sound, vinyl bar, audio guestbook." },
        { titre: "Dinner", texte: "Warm lighting, speeches and slideshows built into the running order." },
        { titre: "First dance", texte: "Low fog and cold sparks, synchronised with your song." },
        { titre: "Party", texte: "A packed dance floor, every generation together, until 4 am." },
      ],
      lien: "All about our weddings",
    },
    animations: {
      surtitre: "The little extras",
      titre: "Entertainment *people remember*.",
      lien: "All entertainment",
    },
    evenements: {
      surtitre: "Private & corporate events",
      titre: "The same care for *every event*.",
      texte:
        "Birthdays, galas, seminars, product launches: music direction, sound, lighting and coordination, with the same high standards as a wedding.",
      lien: "Private and corporate events",
    },
    avis: { surtitre: "They trusted us", titre: "Our couples *say it* better than we do." },
  },
};
