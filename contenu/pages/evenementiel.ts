import type { CleImage } from "@/lib/images";
import type { Bilingue, Carte, Etape, QuestionReponse, Seo } from "../types";

type Format = { titre: string; texte: string; exemples: string[]; image: CleImage };

type Evenementiel = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  promesse: { surtitre: string; titre: string; paragraphes: string[] };
  formats: { surtitre: string; titre: string; liste: Format[] };
  /** Icône : ♪ ◌ ✳ → (maquette Nocturne). */
  services: { surtitre: string; titre: string; liste: (Carte & { icone: string })[] };
  /** Méthode en trois temps, puis deux photos en grand (maquette Nocturne). */
  methode: {
    surtitre: string;
    titre: string;
    etapes: (Etape & { numero: string })[];
    vedettes: { image: CleImage; surtitre: string; titre: string }[];
  };
  galerie: { surtitre: string; titre: string; lien: string };
  avis: { surtitre: string; titre: string };
  faq: { surtitre: string; titre: string; questions: QuestionReponse[] };
  appel: { titre: string; texte: string };
};

export const EVENEMENTIEL: Bilingue<Evenementiel> = {
  fr: {
    seo: {
      titre: "Soirées privées & événements d'entreprise en Île-de-France | Spice Events",
      description:
        "Anniversaires, soirées privées, séminaires, galas, lancements de produit : direction musicale, sonorisation, éclairage et coordination clé en main à Paris et en Île-de-France.",
    },
    hero: {
      surtitre: "Événementiel · Soirées privées & entreprises",
      titre: "Rassemblez. *Nous pimentons.*",
      intro:
        "Anniversaire, soirée privée, séminaire, gala ou lancement : la même exigence que pour un mariage, au service de vos invités et de vos objectifs.",
    },
    promesse: {
      surtitre: "Le piment de vos temps forts",
      titre: "Un événement *à votre image*, maîtrisé de bout en bout.",
      paragraphes: [
        "Chaque temps fort est unique et mérite d'être vécu pleinement. Notre mission : faire de votre événement un moment inoubliable et à votre image, avec un service professionnel, innovant et humain.",
        "Musique, son, lumière, animations et coordination : tout est pensé pour que vous puissiez profiter de votre événement — ou vous concentrer sur vos invités et votre message.",
      ],
    },
    formats: {
      surtitre: "Pour qui",
      titre: "Deux univers, *une même exigence*.",
      liste: [
        {
          titre: "Soirées privées",
          texte: "Une fête qui vous ressemble, avec une musique pensée pour vos invités et une ambiance qui monte au bon moment.",
          exemples: ["Anniversaires", "Soirées privées", "Soirées à thème"],
          image: "presta-soiree-privee",
        },
        {
          titre: "Entreprises",
          texte:
            "Une prestation clé en main, à l'image de votre marque : prises de parole, remises de prix et projections intégrées au déroulé, puis une soirée qui rassemble vos équipes.",
          exemples: ["Séminaires et conférences", "Galas et soirées annuelles", "Lancements de produit", "Soirées de networking"],
          image: "presta-gala-bleu",
        },
      ],
    },
    services: {
      surtitre: "Une équipe, toute l'ambiance",
      titre: "Vous avez l'occasion. *Nous avons le piment.*",
      liste: [
        { icone: "♪", titre: "La musique", texte: "Un DJ qui s'adapte à votre public, du cocktail au dernier rappel." },
        { icone: "◌", titre: "Le son", texte: "Une diffusion claire, adaptée aux prises de parole et à chaque espace." },
        { icone: "✳", titre: "La lumière", texte: "Une mise en scène qui révèle le lieu et donne le ton." },
        { icone: "→", titre: "La coordination", texte: "Un déroulé préparé avec vos prestataires, pour profiter du moment." },
      ],
    },
    methode: {
      surtitre: "Simple pour vous, précis pour nous",
      titre: "Bien préparé. *Pleinement vécu.*",
      etapes: [
        {
          numero: "01 / On échange",
          titre: "Votre idée devient un projet.",
          texte: "Vos objectifs, votre public, votre lieu : nous définissons ensemble ce qui compte.",
        },
        {
          numero: "02 / On prépare",
          titre: "Chaque détail a sa place.",
          texte: "Devis sur mesure, sélection musicale et coordination technique avec vos prestataires.",
        },
        {
          numero: "03 / On fait vivre",
          titre: "Place à votre événement.",
          texte: "Installation, tests et présence sur place. Notre équipe accompagne vos temps forts.",
        },
      ],
      vedettes: [
        { image: "presta-lancement", surtitre: "Lancements & rencontres", titre: "Mettre vos idées en lumière." },
        { image: "presta-dj-scene", surtitre: "La soirée continue", titre: "Et libérer l'énergie." },
      ],
    },
    galerie: { surtitre: "En images", titre: "Nos nuits *en action*.", lien: "Voir la galerie" },
    avis: { surtitre: "Ils nous ont fait confiance", titre: "Ce qu'en disent *nos clients*." },
    faq: {
      surtitre: "Questions fréquentes",
      titre: "Tout savoir sur *nos prestations*.",
      questions: [
        {
          question: "Intervenez-vous pour des événements d'entreprise ?",
          reponse:
            "Oui : séminaires, galas, soirées annuelles, lancements de produit… Notre approche reste la même qu'en mariage : une organisation rigoureuse, une ambiance maîtrisée et une prestation clé en main, adaptée à votre image.",
        },
        {
          question: "Pouvez-vous sonoriser plusieurs espaces en même temps (cocktail, scène, piste) ?",
          reponse:
            "Oui. Nous sonorisons et éclairons plusieurs zones avec du matériel dédié à chacune : chaque espace a son ambiance, avec une cohérence musicale et technique sur l'ensemble de l'événement.",
        },
        {
          question: "Pouvez-vous intégrer des discours ou des moments clés ?",
          reponse:
            "Absolument. Discours, remises de prix, projections : nous les intégrons au déroulé technique et musical pour que chaque temps fort soit mis en valeur.",
        },
        {
          question: "Pouvez-vous adapter l'ambiance à l'image de notre entreprise ?",
          reponse:
            "Oui. Nous personnalisons l'ambiance musicale et visuelle pour refléter l'identité et les valeurs de votre marque, dans le ton et selon les objectifs de votre événement.",
        },
        {
          question: "Fournissez-vous tout le matériel ?",
          reponse:
            "Oui, en partenariat avec MX Événement. Tout est testé avant chaque prestation, et nous prévoyons du matériel de remplacement pour parer à tout imprévu.",
        },
        {
          question: "Êtes-vous présents pendant tout l'événement ?",
          reponse:
            "Oui : notre équipe reste présente du début à la fin pour gérer la régie, la musique et l'animation, en toute discrétion.",
        },
      ],
    },
    appel: {
      titre: "Votre prochaine soirée manque *de piment* ?",
      texte: "Date, nombre d'invités, objectifs : dites-nous l'essentiel, Cédric vous répond personnellement.",
    },
  },
  en: {
    seo: {
      titre: "DJ for private parties & corporate events in Paris | Spice Events",
      description:
        "Birthdays, private parties, seminars, galas, product launches: music direction, sound, lighting and turnkey coordination in Paris and the Île-de-France region.",
    },
    hero: {
      surtitre: "Events · Private & corporate",
      titre: "Bring them together. *We add the spice.*",
      intro:
        "Birthday, private party, seminar, gala or launch: the same high standards as a wedding, working for your guests and your goals.",
    },
    promesse: {
      surtitre: "The spice in your big moments",
      titre: "An event *that reflects you*, handled from start to finish.",
      paragraphes: [
        "Every big moment is unique and deserves to be lived to the full. Our mission: to make your event unforgettable and true to you, with a professional, innovative and personal service.",
        "Music, sound, lighting, entertainment and coordination: everything is designed so you can enjoy your event — or focus on your guests and your message.",
      ],
    },
    formats: {
      surtitre: "Who it's for",
      titre: "Two worlds, *the same standards*.",
      liste: [
        {
          titre: "Private parties",
          texte: "A party that feels like you, with music chosen for your guests and an atmosphere that builds at just the right pace.",
          exemples: ["Birthdays", "Private parties", "Themed parties"],
          image: "presta-soiree-privee",
        },
        {
          titre: "Corporate events",
          texte:
            "A turnkey service that reflects your brand: speeches, awards and presentations built into the running order, followed by a party that brings your teams together.",
          exemples: ["Seminars and conferences", "Galas and annual parties", "Product launches", "Networking evenings"],
          image: "presta-gala-bleu",
        },
      ],
    },
    services: {
      surtitre: "One team, the whole atmosphere",
      titre: "You have the occasion. *We have the spice.*",
      liste: [
        { icone: "♪", titre: "The music", texte: "A DJ who reads your crowd, from drinks to the last encore." },
        { icone: "◌", titre: "The sound", texte: "Clear sound, suited to speeches and to every space." },
        { icone: "✳", titre: "The light", texte: "Staging that reveals the venue and sets the tone." },
        { icone: "→", titre: "The coordination", texte: "A schedule prepared with your suppliers, so you can enjoy the moment." },
      ],
    },
    methode: {
      surtitre: "Simple for you, precise for us",
      titre: "Well prepared. *Fully lived.*",
      etapes: [
        {
          numero: "01 / We talk",
          titre: "Your idea becomes a project.",
          texte: "Your goals, your audience, your venue: together we define what matters.",
        },
        {
          numero: "02 / We prepare",
          titre: "Every detail in its place.",
          texte: "A tailored quote, the music selection and technical coordination with your suppliers.",
        },
        {
          numero: "03 / We bring it to life",
          titre: "Over to your event.",
          texte: "Setup, tests and presence on site. Our team supports your key moments.",
        },
      ],
      vedettes: [
        { image: "presta-lancement", surtitre: "Launches & gatherings", titre: "Putting your ideas in the spotlight." },
        { image: "presta-dj-scene", surtitre: "The party goes on", titre: "And setting the energy free." },
      ],
    },
    galerie: { surtitre: "In pictures", titre: "Our nights *in action*.", lien: "View the gallery" },
    avis: { surtitre: "They trusted us", titre: "What *our clients* say." },
    faq: {
      surtitre: "Frequently asked questions",
      titre: "All about *our services*.",
      questions: [
        {
          question: "Do you work on corporate events?",
          reponse:
            "Yes: seminars, galas, annual parties, product launches… Our approach is the same as for weddings: rigorous planning, a well-judged atmosphere and a turnkey service that reflects your image.",
        },
        {
          question: "Can you provide sound for several spaces at once (drinks, stage, dance floor)?",
          reponse:
            "Yes. We provide sound and lighting for several areas, with dedicated equipment for each: every space has its own atmosphere, with musical and technical consistency across the whole event.",
        },
        {
          question: "Can you build speeches or key moments into the evening?",
          reponse:
            "Absolutely. Speeches, awards, presentations: we build them into the technical and musical running order so every highlight gets the attention it deserves.",
        },
        {
          question: "Can you tailor the atmosphere to our company's image?",
          reponse:
            "Yes. We adapt the music and visuals to reflect your brand's identity and values, in keeping with the tone and goals of your event.",
        },
        {
          question: "Do you supply all the equipment?",
          reponse:
            "Yes, in partnership with MX Événement. Everything is tested before each event, and we bring backup equipment in case of the unexpected.",
        },
        {
          question: "Are you there for the whole event?",
          reponse:
            "Yes: our team stays from start to finish to run the control desk, the music and the entertainment, discreetly.",
        },
      ],
    },
    appel: {
      titre: "Is your next party missing *some spice*?",
      texte: "Date, number of guests, goals: tell us the essentials and Cédric will get back to you personally.",
    },
  },
};
