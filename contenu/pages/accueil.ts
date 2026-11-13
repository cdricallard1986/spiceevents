import type { CleImage } from "@/lib/images";
import type { Bilingue, Seo } from "../types";
import { typographier } from "@/lib/typographie";

/** Une des deux grandes portes d’entrée de l’accueil : Mariages ou Événements. */
type Porte = { href: "/mariages" | "/evenementiel"; image: CleImage; surtitre: string; titre: string; texte: string; lien: string };

type Accueil = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string; ctaPrincipal: string; ctaSecondaire: string };
  portes: { surtitre: string; titre: string; liste: Porte[] };
  dj: { titre: string; paragraphes: string[]; lien: string };
  animations: { surtitre: string; titre: string; lien: string };
  avis: { surtitre: string; lien: string };
  appel: { titre: string; texte: string; bouton: string };
};

/**
 * Photos d’en-tête de l’accueil, une tirée au hasard à chaque visite : des nuits de
 * mariage et des soirées d’événements (grandes et paysage).
 */
export const IMAGES_ACCUEIL: CleImage[] = [
  "hero-premiere-danse",
  "presta-mariage-hero",
  "mariage-soiree-faisceaux",
  "mariage-soiree-piste-rose",
  "maison-mariage-lasers",
  "mariage-soiree-scene-dj",
  "maison-evenement-scene-dj",
  "presta-soiree-privee",
  "presta-gala-salle",
  "presta-piste-laser",
  "soiree-piste-fumee",
  "soiree-piste-costumes",
];

export const ACCUEIL: Bilingue<Accueil> = typographier({
  fr: {
    seo: {
      titre: "DJ mariage en Île-de-France — son, lumière & animations | Spice Events",
      description:
        "DJ de mariage primé aux Wedding Awards Mariages.net : préparation sur mesure, sonorisation et éclairage haut de gamme, animations. Paris et Île-de-France.",
    },
    hero: {
      surtitre: "DJ · Son · Lumière · Mariages & événements",
      titre: "Votre nuit. *Notre piment.*",
      intro:
        "Mariages, soirées privées, événements d’entreprise : Cédric et l’équipe Spice Events mettent en musique et en lumière vos plus belles nuits, de la première note au dernier morceau.",
      ctaPrincipal: "Vérifier ma date",
      ctaSecondaire: "Nos animations",
    },
    portes: {
      surtitre: "Deux univers, un même piment",
      titre: "Quelle nuit *préparez-vous* ?",
      liste: [
        {
          href: "/mariages",
          image: "maison-mariage-danse-genou",
          surtitre: "Mariages",
          titre: "Un grand oui. *Une nuit pimentée.*",
          texte: "De la cérémonie au dernier morceau, une journée qui vous ressemble et une fête qui vous rassemble.",
          lien: "Votre mariage",
        },
        {
          href: "/evenementiel",
          image: "presta-gala-bleu",
          surtitre: "Soirées privées & entreprises",
          titre: "Rassemblez. *Nous pimentons.*",
          texte: "Anniversaire, gala, séminaire ou lancement : une ambiance à votre image, relevée d’une touche de Spice.",
          lien: "Votre événement",
        },
      ],
    },
    dj: {
      titre: "Un DJ qui lit la piste, *pas une playlist*.",
      paragraphes: [
        "Depuis plus de 20 ans, Cédric fait danser les mariés, leurs invités et les équipes : plus de 600 mariages et événements. Questionnaire musical, rendez-vous de préparation, coordination avec vos prestataires — le jour J, tout est déjà pensé.",
        "Le son et la lumière sont fournis par notre partenaire MX Événement : un matériel haut de gamme, testé en atelier avant chaque date, avec du matériel de secours sur place.",
      ],
      lien: "Rencontrer Cédric",
    },
    animations: {
      surtitre: "Le grain de piment",
      titre: "Des animations qui *relèvent la fête*.",
      lien: "Toutes les animations",
    },
    avis: { surtitre: "Ils ont dansé jusqu’au bout de la nuit", lien: "Voir tous les avis" },
    appel: {
      titre: "Votre nuit manque *de piment* ?",
      texte: "Une date, quelques envies : Cédric vous répond personnellement. Ensemble, trouvons les ingrédients de votre fête.",
      bouton: "Pimentons votre nuit",
    },
  },
  en: {
    seo: {
      titre: "Wedding DJ in Paris & Île-de-France — sound, lighting & entertainment | Spice Events",
      description:
        "Award-winning wedding DJ (Mariages.net Wedding Awards): tailored preparation, premium sound and lighting, entertainment. Paris and the Île-de-France region.",
    },
    hero: {
      surtitre: "DJ · Sound · Lighting · Weddings & events",
      titre: "Your night. *Our spice.*",
      intro:
        "Weddings, private parties, corporate events: Cédric and the Spice Events team bring your best nights to life with music and light, from the first note to the very last song.",
      ctaPrincipal: "Check my date",
      ctaSecondaire: "Our entertainment",
    },
    portes: {
      surtitre: "Two worlds, the same spice",
      titre: "Which night *are you planning*?",
      liste: [
        {
          href: "/mariages",
          image: "maison-mariage-danse-genou",
          surtitre: "Weddings",
          titre: "A big “I do”. *A spicy night.*",
          texte: "From the ceremony to the last song, a day that feels like you and a party that brings everyone together.",
          lien: "Your wedding",
        },
        {
          href: "/evenementiel",
          image: "presta-gala-bleu",
          surtitre: "Private & corporate events",
          titre: "Bring them together. *We add the spice.*",
          texte: "Birthday, gala, seminar or launch: an atmosphere that reflects you, with a touch of Spice.",
          lien: "Your event",
        },
      ],
    },
    dj: {
      titre: "A DJ who reads the dance floor, *not a playlist*.",
      paragraphes: [
        "For over 20 years, Cédric has been getting couples, their guests and teams on the dance floor: more than 600 weddings and events. Music questionnaire, planning meetings, coordination with your other suppliers — by the big day, everything has been thought through.",
        "Sound and lighting come from our partner MX Événement: premium equipment, tested in the workshop before every date, with backup gear on site.",
      ],
      lien: "Meet Cédric",
    },
    animations: {
      surtitre: "The pinch of spice",
      titre: "Entertainment that *spices up the party*.",
      lien: "All entertainment",
    },
    avis: { surtitre: "They danced till the end of the night", lien: "See all reviews" },
    appel: {
      titre: "Is your night missing *some spice*?",
      texte: "A date, a few ideas: Cédric will reply to you personally. Let’s find the ingredients for your party together.",
      bouton: "Let’s spice up your night",
    },
  },
});
