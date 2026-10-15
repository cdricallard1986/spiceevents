import type { Bilingue, Etape, Seo } from "../types";

/** Textes du formulaire (passés au composant client). */
export type TextesFormulaire = {
  prenoms: string;
  prenomsExemple: string;
  nom: string;
  email: string;
  telephone: string;
  type: string;
  typeChoisir: string;
  date: string;
  lieu: string;
  lieuExemple: string;
  invites: string;
  message: string;
  messageExemple: string;
  facultatif: string;
  envoyer: string;
  envoiEnCours: string;
  fermer: string;
  succesTitre: string;
  succesTexte: string;
  succesSpam: string;
  /** Libellé du champ piège (invisible, lu seulement par les robots). */
  piege: string;
};

type Contact = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  formulaire: { surtitre: string; titre: string; intro: string; textes: TextesFormulaire };
  joindre: { titre: string; telephone: string; email: string; zone: string; zoneTexte: string };
  /** Suivi des années (SITE.weddingAwards). */
  awards: { titre: string; texte: string };
  ensuite: { titre: string; etapes: Etape[] };
  rgpd: { texte: string; lien: string };
};

export const CONTACT: Bilingue<Contact> = {
  fr: {
    seo: {
      titre: "Contact & devis — DJ mariage à Paris et en Île-de-France | Spice Events",
      description:
        "Demandez un devis pour votre DJ de mariage ou d'événement à Paris et en Île-de-France. Cédric vous répond personnellement. Formulaire ou 06 76 40 37 76.",
    },
    hero: {
      surtitre: "Contact · Devis",
      titre: "Parlons de *votre date*.",
      intro: "Quelques informations suffisent : Cédric lit chaque demande et vous répond personnellement.",
    },
    formulaire: {
      surtitre: "Demande de devis",
      titre: "Dites-nous *l'essentiel*.",
      intro: "Deux minutes suffisent. Les champs « facultatif » pourront attendre le premier échange.",
      textes: {
        prenoms: "Vos prénoms",
        prenomsExemple: "Julie & Thomas",
        nom: "Nom",
        email: "Email",
        telephone: "Téléphone",
        type: "Type d'événement",
        typeChoisir: "Choisir…",
        date: "Date de l'événement",
        lieu: "Lieu",
        lieuExemple: "Ville ou nom du domaine",
        invites: "Nombre d'invités",
        message: "Votre projet",
        messageExemple: "L'ambiance que vous imaginez, les moments clés, les animations qui vous tentent…",
        facultatif: "facultatif",
        envoyer: "Envoyer ma demande",
        envoiEnCours: "Envoi en cours…",
        fermer: "Fermer",
        succesTitre: "Merci, votre demande est *bien arrivée*.",
        succesTexte:
          "Cédric vous répond personnellement pour organiser un premier échange, de vive voix ou en visio. Un email de confirmation est en route vers votre boîte.",
        succesSpam: "Rien reçu ? Pensez à regarder dans vos courriers indésirables.",
        piege: "Ne pas remplir ce champ",
      },
    },
    joindre: {
      titre: "Nous joindre",
      telephone: "Téléphone",
      email: "Email",
      zone: "Zone d'intervention",
      zoneTexte: "Paris et toute l'Île-de-France",
    },
    awards: {
      titre: "Wedding Awards Mariages.net",
      texte: "Spice Events, lauréat des éditions",
    },
    ensuite: {
      titre: "Ce qui se passe *ensuite*",
      etapes: [
        { titre: "Cédric vous répond", texte: "Il lit votre demande et revient vers vous personnellement." },
        {
          titre: "Premier échange",
          texte: "Un rendez-vous ou une visio pour cerner vos envies, votre lieu et vos besoins techniques.",
        },
        {
          titre: "Devis sur mesure",
          texte: "Une proposition claire, adaptée à votre budget. Le devis validé, votre date est bloquée.",
        },
      ],
    },
    rgpd: {
      texte:
        "Vos informations servent uniquement à répondre à votre demande et à préparer votre devis. Elles ne sont ni revendues, ni utilisées pour de la publicité.",
      lien: "Politique de confidentialité",
    },
  },
  en: {
    seo: {
      titre: "Contact & quote — wedding DJ in Paris & Île-de-France | Spice Events",
      description:
        "Ask for a quote for your wedding or event DJ in Paris and the Île-de-France region. Cédric replies to every request personally. Use the form or call +33 6 76 40 37 76.",
    },
    hero: {
      surtitre: "Contact · Quote",
      titre: "Let's talk about *your date*.",
      intro: "A few details are all we need: Cédric reads every request and replies to you personally.",
    },
    formulaire: {
      surtitre: "Request a quote",
      titre: "Tell us *the essentials*.",
      intro: "It only takes two minutes. Anything marked “optional” can wait until our first chat.",
      textes: {
        prenoms: "Your first names",
        prenomsExemple: "Emma & James",
        nom: "Surname",
        email: "Email",
        telephone: "Phone",
        type: "Type of event",
        typeChoisir: "Choose…",
        date: "Date of the event",
        lieu: "Venue",
        lieuExemple: "Town or venue name",
        invites: "Number of guests",
        message: "Your plans",
        messageExemple: "The atmosphere you have in mind, the key moments, any entertainment you like the sound of…",
        facultatif: "optional",
        envoyer: "Send my request",
        envoiEnCours: "Sending…",
        fermer: "Close",
        succesTitre: "Thank you, your request has *arrived safely*.",
        succesTexte:
          "Cédric will get back to you personally to arrange a first conversation, in person or by video call. A confirmation email is on its way to your inbox.",
        succesSpam: "Nothing there? Please check your spam folder.",
        piege: "Leave this field empty",
      },
    },
    joindre: {
      titre: "Get in touch",
      telephone: "Phone",
      email: "Email",
      zone: "Where we work",
      zoneTexte: "Paris and the whole Île-de-France region",
    },
    awards: {
      titre: "Mariages.net Wedding Awards",
      texte: "Spice Events, winner in",
    },
    ensuite: {
      titre: "What happens *next*",
      etapes: [
        { titre: "Cédric replies", texte: "He reads your request and gets back to you himself." },
        {
          titre: "A first conversation",
          texte: "A meeting or a video call to understand your wishes, your venue and your technical needs.",
        },
        {
          titre: "A tailored quote",
          texte: "A clear proposal that fits your budget. Once you approve the quote, your date is secured.",
        },
      ],
    },
    rgpd: {
      texte:
        "Your details are used only to answer your request and prepare your quote. They are never sold or used for advertising.",
      lien: "Privacy policy",
    },
  },
};
