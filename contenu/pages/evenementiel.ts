import type { CleImage } from "@/lib/images";
import type { Bilingue, Carte, Etape, QuestionReponse, Seo } from "../types";

type Format = { titre: string; texte: string; exemples: string[]; image: CleImage };

type Evenementiel = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  promesse: { surtitre: string; titre: string; paragraphes: string[] };
  formats: { surtitre: string; titre: string; liste: Format[] };
  services: { surtitre: string; titre: string; intro: string; liste: Carte[] };
  methode: { surtitre: string; titre: string; etapes: Etape[] };
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
      titre: "Vos temps forts, *mis en scène*.",
      intro:
        "Anniversaire, soirée privée, séminaire, gala ou lancement : la même exigence que pour un mariage, au service de vos invités et de vos objectifs.",
    },
    promesse: {
      surtitre: "L'allié de vos moments forts",
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
      surtitre: "Ce que nous prenons en charge",
      titre: "Tout ce qui fait *l'ambiance*.",
      intro: "Une seule équipe pour la musique, la technique et le rythme de votre événement.",
      liste: [
        {
          titre: "Direction musicale",
          texte: "Un DJ professionnel qui adapte la sélection à votre public et à vos objectifs, du cocktail à la soirée.",
        },
        {
          titre: "Sonorisation haut de gamme",
          texte: "Calibrée selon votre lieu et votre format — conférence, gala, lancement, soirée —, même sur plusieurs espaces.",
        },
        {
          titre: "Mise en lumière sur mesure",
          texte: "Éclairages décoratifs et scénographie dynamique pour valoriser vos espaces et votre identité visuelle.",
        },
        {
          titre: "Animations",
          texte: "Photobooth, effets lumineux, expériences interactives : de quoi captiver vos invités et renforcer la cohésion.",
        },
        {
          titre: "Coordination",
          texte: "Échanges avec vos prestataires, gestion des temps forts et suivi technique, pour un événement sans stress.",
        },
      ],
    },
    methode: {
      surtitre: "Notre méthode",
      titre: "De l'idée à la scène, *on s'occupe de tout*.",
      etapes: [
        {
          titre: "Premier échange",
          texte: "Nous prenons le temps de comprendre vos attentes, vos objectifs et l'identité de votre projet.",
        },
        {
          titre: "Devis & planification",
          texte: "Une offre sur mesure, alignée sur vos besoins et vos objectifs, préparée avec sérieux.",
        },
        {
          titre: "Préparation & coordination",
          texte: "Nous travaillons avec l'ensemble de vos prestataires pour un déroulé fluide et sans oubli.",
        },
        {
          titre: "Le jour J",
          texte: "Installation anticipée, tests techniques, matériel de secours : nous parons à toutes les éventualités.",
        },
      ],
    },
    galerie: { surtitre: "En images", titre: "Nos événements *en action*.", lien: "Voir la galerie" },
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
      titre: "Planifions *votre événement*.",
      texte: "Date, lieu, nombre d'invités, objectifs : dites-nous l'essentiel, Cédric vous répond personnellement.",
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
      titre: "Your big moments, *staged*.",
      intro:
        "Birthday, private party, seminar, gala or launch: the same high standards as a wedding, working for your guests and your goals.",
    },
    promesse: {
      surtitre: "Your partner for the moments that matter",
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
      surtitre: "What we take care of",
      titre: "Everything that makes *the atmosphere*.",
      intro: "One team for the music, the technical side and the pace of your event.",
      liste: [
        {
          titre: "Music direction",
          texte: "A professional DJ who tailors the selection to your audience and goals, from drinks to the dance floor.",
        },
        {
          titre: "Premium sound",
          texte: "Calibrated to your venue and format — conference, gala, launch, party — even across several spaces.",
        },
        {
          titre: "Tailored lighting",
          texte: "Decorative lighting and dynamic staging to show off your spaces and your visual identity.",
        },
        {
          titre: "Entertainment",
          texte: "Photobooth, lighting effects, interactive experiences: everything to captivate guests and bring people together.",
        },
        {
          titre: "Coordination",
          texte: "Liaising with your suppliers, managing key moments and technical follow-up, for a stress-free event.",
        },
      ],
    },
    methode: {
      surtitre: "Our approach",
      titre: "From idea to stage, *we handle everything*.",
      etapes: [
        {
          titre: "First conversation",
          texte: "We take the time to understand your expectations, your goals and the identity of your project.",
        },
        {
          titre: "Quote & planning",
          texte: "A tailored proposal, aligned with your needs and objectives, put together with care.",
        },
        {
          titre: "Preparation & coordination",
          texte: "We work with all your suppliers for a smooth running order with nothing forgotten.",
        },
        {
          titre: "On the day",
          texte: "Early set-up, technical checks, backup equipment: we're ready for anything.",
        },
      ],
    },
    galerie: { surtitre: "In pictures", titre: "Our events *in action*.", lien: "View the gallery" },
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
      titre: "Let's plan *your event*.",
      texte: "Date, venue, number of guests, goals: tell us the essentials and Cédric will get back to you personally.",
    },
  },
};
