import type { Bilingue, Carte, QuestionReponse, Seo } from "../types";

type Animations = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  intro: { surtitre: string; titre: string; paragraphes: string[]; citation: string };
  options: { surtitre: string; titre: string; intro: string };
  idees: { surtitre: string; titre: string; intro: string; liste: Carte[]; note: string };
  faq: { surtitre: string; titre: string; questions: QuestionReponse[] };
  appel: { titre: string; texte: string };
};

export const ANIMATIONS: Bilingue<Animations> = {
  fr: {
    seo: {
      titre: "Animations de mariage et de soirée en Île-de-France | Spice Events",
      description:
        "Photobooth, bar à vinyles, livre d'or audio, ouverture de bal, guirlandes, murs d'eau, sonorisation de cérémonie : des animations sur mesure pour votre mariage à Paris et en Île-de-France.",
    },
    hero: {
      surtitre: "Animations · Mariages & événements",
      titre: "Des animations qui *rassemblent* vos invités.",
      intro:
        "Musique, lumière, souvenirs à emporter : chaque animation est pensée pour rythmer un moment fort, de la cérémonie à la dernière danse.",
    },
    intro: {
      surtitre: "Notre approche",
      titre: "Le bon détail, *au bon moment*.",
      paragraphes: [
        "Un bel événement se joue aussi dans les détails. Nous concevons des animations sur mesure — musique, lumière, photobooth, effets spéciaux — pour captiver, surprendre et rassembler vos invités.",
        "Cérémonie, cocktail, dîner, soirée dansante ou temps fort d'un événement professionnel : nous vous aidons à choisir les animations qui servent vraiment votre journée, et nous les intégrons à son déroulé.",
      ],
      citation: "Transformer un instant en émotion, c'est l'art de l'animation.",
    },
    options: {
      surtitre: "Nos animations",
      titre: "Huit idées pour *marquer les esprits*.",
      intro: "Chacune a sa page : ce qui est inclus, comment ça se passe, et des photos en situation.",
    },
    idees: {
      surtitre: "Et aussi",
      titre: "D'autres idées pour *surprendre vos invités*.",
      intro:
        "Pour une expérience visuelle et sonore complète, nous proposons aussi ces prestations. Parlez-nous de votre projet : nous vous conseillons celles qui s'accordent à votre lieu et à votre déroulé.",
      liste: [
        {
          titre: "Vidéoprojecteur et écran",
          texte: "Projetez vos souvenirs, un diaporama ou des messages pendant le dîner, pour des instants partagés.",
        },
        {
          titre: "Éclairage du dîner",
          texte: "Une lumière chaude et raffinée, qui sublime votre salle, vos tables et vos invités.",
        },
        {
          titre: "Mise en lumière du lieu",
          texte: "Façades, jardins, charpentes : nous révélons l'architecture de votre lieu à la nuit tombée.",
        },
        {
          titre: "Nos partenaires de confiance",
          texte: "Une envie qui ne figure pas ici ? Nous vous recommandons des prestataires avec qui nous aimons travailler.",
        },
      ],
      note: "Prestations sur devis.",
    },
    faq: {
      surtitre: "Questions fréquentes",
      titre: "Bon à *savoir*.",
      questions: [
        {
          question: "Les étincelles froides et la fumée lourde sont-elles possibles dans tous les lieux ?",
          reponse:
            "Non. Certains lieux sont équipés de détecteurs de fumée sensibles, incompatibles avec ces effets. Nous vérifions toujours les contraintes techniques de votre lieu avant de vous les proposer.",
        },
        {
          question: "Les guirlandes lumineuses peuvent-elles être installées en extérieur ?",
          reponse:
            "Oui : nos guirlandes s'installent en intérieur comme en extérieur — salle, jardin, terrasse ou cour — et s'intègrent à votre décoration.",
        },
        {
          question: "Le photobooth peut-il suivre vos invités au fil de la journée ?",
          reponse:
            "Oui : le déplacement de la borne entre le cocktail et le repas est inclus. Vos invités repartent avec leurs photos imprimées, et vous recevez toutes les photos en version numérique dès le lundi.",
        },
      ],
    },
    appel: {
      titre: "Composons *votre programme*.",
      texte: "Dites-nous votre date, votre lieu et les animations qui vous tentent : Cédric vous conseille et vous prépare un devis.",
    },
  },
  en: {
    seo: {
      titre: "Wedding entertainment in Paris: photobooth, vinyl bar & more | Spice Events",
      description:
        "Photobooth, vinyl bar, audio guestbook, first-dance effects, string lights, water walls, ceremony sound: tailored entertainment for your wedding in Paris and Île-de-France.",
    },
    hero: {
      surtitre: "Entertainment · Weddings & events",
      titre: "Entertainment that *brings your guests together*.",
      intro:
        "Music, light, keepsakes to take home: each idea is designed to lift a key moment, from the ceremony to the very last dance.",
    },
    intro: {
      surtitre: "Our approach",
      titre: "The right detail, *at the right moment*.",
      paragraphes: [
        "A great event lives in the details. We design tailored entertainment — music, lighting, photobooth, special effects — to captivate, surprise and bring your guests together.",
        "Ceremony, drinks, dinner, the dance floor or the highlight of a corporate event: we help you choose the ideas that truly serve your day, and build them into the running order.",
      ],
      citation: "Turning a moment into an emotion: that's the art of entertainment.",
    },
    options: {
      surtitre: "Our entertainment",
      titre: "Eight ideas *people remember*.",
      intro: "Each one has its own page: what's included, how it works, and photos of it in action.",
    },
    idees: {
      surtitre: "And also",
      titre: "More ways to *surprise your guests*.",
      intro:
        "For a complete sound-and-vision experience, we also offer the following. Tell us about your plans and we'll recommend what suits your venue and running order.",
      liste: [
        {
          titre: "Projector and screen",
          texte: "Show your memories, a slideshow or messages during dinner, for moments everyone shares.",
        },
        {
          titre: "Dinner lighting",
          texte: "Warm, refined light that flatters your room, your tables and your guests.",
        },
        {
          titre: "Venue lighting",
          texte: "Façades, gardens, timber beams: we bring out your venue's architecture as night falls.",
        },
        {
          titre: "Our trusted partners",
          texte: "Looking for something that isn't listed here? We'll recommend suppliers we love working with.",
        },
      ],
      note: "Quoted on request.",
    },
    faq: {
      surtitre: "Frequently asked questions",
      titre: "Good to *know*.",
      questions: [
        {
          question: "Can cold sparks and low fog be used in any venue?",
          reponse:
            "No. Some venues have sensitive smoke detectors, which aren't compatible with these effects. We always check your venue's technical constraints before suggesting them.",
        },
        {
          question: "Can the string lights go outdoors?",
          reponse:
            "Yes: our string lights work indoors and out — function room, garden, terrace or courtyard — and blend in with your décor.",
        },
        {
          question: "Can the photobooth follow your guests through the day?",
          reponse:
            "Yes: moving the booth between the drinks reception and dinner is included. Guests leave with their printed photos, and you receive every photo digitally the Monday after.",
        },
      ],
    },
    appel: {
      titre: "Let's build *your line-up*.",
      texte: "Tell us your date, venue and the ideas you like: Cédric will advise you and prepare a quote.",
    },
  },
};
