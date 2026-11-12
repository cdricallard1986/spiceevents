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
      titre: "Une nuit pimentée dont vos invités *parleront encore*.",
      intro:
        "De la cérémonie au dernier morceau, Cédric et l'équipe Spice Events préparent avec vous la musique, la lumière et le rythme de votre mariage.",
      ctaPrincipal: "Vérifier ma date",
      ctaSecondaire: "Découvrir nos mariages",
    },
    dj: {
      titre: "Un DJ qui lit la piste, *pas une playlist*.",
      paragraphes: [
        "Depuis plus de 20 ans, Cédric fait danser les mariés et leurs invités : plus de 600 mariages et événements. Questionnaire musical, rendez-vous de préparation, coordination avec vos prestataires — le jour J, tout est déjà pensé.",
        "Le son et la lumière sont fournis par notre partenaire MX Événement : un matériel haut de gamme, testé en atelier avant chaque date, avec du matériel de secours sur place.",
      ],
      lien: "Rencontrer Cédric",
    },
    journee: {
      surtitre: "Du premier oui au dernier morceau",
      titre: "Chaque moment a sa musique, *son piment*, son tempo.",
      intro: "Nous relevons toute la journée, pas seulement la soirée.",
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
      surtitre: "Le grain de piment",
      titre: "Des animations qui *relèvent la fête*.",
      lien: "Toutes les animations",
    },
    evenements: {
      surtitre: "Soirées privées & entreprises",
      titre: "Le même piment pour *toutes vos soirées*.",
      texte:
        "Anniversaires, galas, séminaires, lancements de produit : direction musicale, son, lumière et coordination, avec la même exigence que pour un mariage.",
      lien: "Événements privés et professionnels",
    },
    avis: { surtitre: "Ils nous ont fait confiance", titre: "Ils ont dansé jusqu'au bout de la nuit. *Ils racontent.*" },
  },
  en: {
    seo: {
      titre: "Wedding DJ in Paris & Île-de-France — sound, lighting & entertainment | Spice Events",
      description:
        "Award-winning wedding DJ (Mariages.net Wedding Awards): tailored preparation, premium sound and lighting, entertainment. Paris and the Île-de-France region.",
    },
    hero: {
      surtitre: "Wedding DJ · Sound · Lighting · Paris area",
      titre: "A spicy night your guests *will still talk about*.",
      intro:
        "From the ceremony to the very last song, Cédric and the Spice Events team plan the music, the lighting and the pace of your wedding with you.",
      ctaPrincipal: "Check my date",
      ctaSecondaire: "Our weddings",
    },
    dj: {
      titre: "A DJ who reads the dance floor, *not a playlist*.",
      paragraphes: [
        "For over 20 years, Cédric has been getting couples and their guests on the dance floor: more than 600 weddings and events. Music questionnaire, planning meetings, coordination with your other suppliers — by the big day, everything has been thought through.",
        "Sound and lighting come from our partner MX Événement: premium equipment, tested in the workshop before every date, with backup gear on site.",
      ],
      lien: "Meet Cédric",
    },
    journee: {
      surtitre: "From the first “I do” to the last song",
      titre: "Every moment has its music, *its spice*, its tempo.",
      intro: "We spice up the whole day, not just the party.",
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
      surtitre: "The pinch of spice",
      titre: "Entertainment that *spices up the party*.",
      lien: "All entertainment",
    },
    evenements: {
      surtitre: "Private & corporate events",
      titre: "The same spice for *every party*.",
      texte:
        "Birthdays, galas, seminars, product launches: music direction, sound, lighting and coordination, with the same high standards as a wedding.",
      lien: "Private and corporate events",
    },
    avis: { surtitre: "They trusted us", titre: "They danced till the end of the night. *They tell it best.*" },
  },
};
