import { SITE } from "../site";
import type { Bilingue, Seo } from "../types";

/**
 * Pages légales, écrites en blocs simples. Dans les paragraphes et les listes,
 * `[texte](adresse)` devient un lien et `**texte**` du gras.
 */
export type BlocLegal = { titre: string; paragraphes?: string[]; liste?: string[] };
export type PageLegale = {
  seo: Seo;
  hero: { surtitre: string; titre: string };
  miseAJour: string;
  blocs: BlocLegal[];
};

const MAIL = `[${SITE.email}](mailto:${SITE.email})`;
const TEL = `[${SITE.telephoneAffiche}](tel:${SITE.telephone})`;
const VERCEL = "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723";
const S = SITE.societe;
const ADRESSE = `${S.adresse.ligne1}, ${S.adresse.rue}, ${S.adresse.codePostal} ${S.adresse.ville}`;
const CAPITAL_FR = S.capital ? `au capital de ${S.capital}` : "[À COMPLÉTER : capital social]";
const CAPITAL_EN = S.capital ? `with a share capital of ${S.capital}` : "[À COMPLÉTER : capital social]";

export const MENTIONS_LEGALES: Bilingue<PageLegale> = {
  fr: {
    seo: {
      titre: "Mentions légales — Spice Events",
      description: "Mentions légales du site spiceevents.fr : éditeur, directeur de la publication, hébergeur et propriété intellectuelle.",
    },
    hero: { surtitre: "Informations légales", titre: "Mentions *légales*" },
    miseAJour: "Dernière mise à jour : 16 octobre 2026",
    blocs: [
      {
        titre: "Éditeur du site",
        paragraphes: [
          `Le site [spiceevents.fr](${SITE.url}) est édité par **${S.raisonSociale}**, qui exerce sous le nom commercial **${SITE.nom}**.`,
        ],
        liste: [
          `Forme juridique : société par actions simplifiée (${S.forme}) ${CAPITAL_FR}`,
          `Siège social : ${ADRESSE}`,
          `SIREN : ${S.siren} — SIRET : ${S.siret}`,
          `TVA intracommunautaire : ${S.tva}`,
          `Code APE / NAF : ${S.ape}`,
          `Email : ${MAIL}`,
          `Téléphone : ${TEL}`,
        ],
      },
      {
        titre: "Directeur de la publication",
        paragraphes: [`${SITE.fondateur}, fondateur de ${SITE.nom}.`],
      },
      {
        titre: "Hébergement",
        paragraphes: [`Le site est hébergé par ${VERCEL}, États-Unis — [vercel.com](https://vercel.com).`],
      },
      {
        titre: "Propriété intellectuelle",
        paragraphes: [
          `Les textes, photographies, vidéos, logos et éléments graphiques de ce site sont la propriété de ${S.raisonSociale} (${SITE.nom}) ou de leurs auteurs respectifs. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation écrite préalable est interdite.`,
        ],
      },
      {
        titre: "Liens externes",
        paragraphes: [
          `Le site contient des liens vers d'autres sites (Mariages.net, Instagram, Facebook, YouTube, MX Événement…). ${SITE.nom} n'est pas responsable de leur contenu.`,
        ],
      },
      {
        titre: "Données personnelles",
        paragraphes: [
          "Le traitement des données transmises par le formulaire de contact est décrit dans notre [politique de confidentialité](/confidentialite).",
        ],
      },
    ],
  },
  en: {
    seo: {
      titre: "Legal notice — Spice Events",
      description: "Legal notice for spiceevents.fr: publisher, publication director, hosting provider and intellectual property.",
    },
    hero: { surtitre: "Legal information", titre: "Legal *notice*" },
    miseAJour: "Last updated: 16 October 2026",
    blocs: [
      {
        titre: "Publisher",
        paragraphes: [
          `The website [spiceevents.fr](${SITE.url}) is published by **${S.raisonSociale}**, trading as **${SITE.nom}**.`,
        ],
        liste: [
          `Legal form: French simplified joint-stock company (${S.forme}) ${CAPITAL_EN}`,
          `Registered office: ${ADRESSE}, ${S.adresse.pays}`,
          `SIREN: ${S.siren} — SIRET: ${S.siret}`,
          `EU VAT number: ${S.tva}`,
          `APE / NAF code: ${S.ape}`,
          `Email: ${MAIL}`,
          `Phone: ${TEL}`,
        ],
      },
      {
        titre: "Publication director",
        paragraphes: [`${SITE.fondateur}, founder of ${SITE.nom}.`],
      },
      {
        titre: "Hosting",
        paragraphes: [`The website is hosted by ${VERCEL}, United States — [vercel.com](https://vercel.com).`],
      },
      {
        titre: "Intellectual property",
        paragraphes: [
          `The texts, photographs, videos, logos and graphic elements on this website are the property of ${S.raisonSociale} (${SITE.nom}) or of their respective authors. Any full or partial reproduction or reuse without prior written permission is prohibited.`,
        ],
      },
      {
        titre: "External links",
        paragraphes: [
          `This website contains links to other websites (Mariages.net, Instagram, Facebook, YouTube, MX Événement…). ${SITE.nom} is not responsible for their content.`,
        ],
      },
      {
        titre: "Personal data",
        paragraphes: [
          "How we handle the data sent through the contact form is described in our [privacy policy](/en/privacy).",
        ],
      },
    ],
  },
};

export const CONFIDENTIALITE: Bilingue<PageLegale> = {
  fr: {
    seo: {
      titre: "Politique de confidentialité — Spice Events",
      description:
        "Comment Spice Events traite les données du formulaire de contact : finalité, base légale, durée de conservation, sous-traitants, vos droits RGPD et mesure d'audience sans cookie.",
    },
    hero: { surtitre: "Vos données", titre: "Politique de *confidentialité*" },
    miseAJour: "Dernière mise à jour : 16 octobre 2026",
    blocs: [
      {
        titre: "Responsable du traitement",
        paragraphes: [`${S.raisonSociale} (nom commercial ${SITE.nom}), ${ADRESSE}, représentée par ${SITE.fondateur} — ${MAIL}.`],
      },
      {
        titre: "Données collectées",
        paragraphes: [
          "Nous ne collectons que les informations que vous nous transmettez par le formulaire de contact :",
        ],
        liste: [
          "votre nom ;",
          "votre adresse email et votre numéro de téléphone ;",
          "la date et le lieu de votre événement ;",
          "le nombre d'invités ;",
          "votre message.",
        ],
      },
      {
        titre: "Finalité et base légale",
        paragraphes: [
          "Ces données servent uniquement à répondre à votre demande et à établir un devis. Ce traitement repose sur l'exécution de mesures précontractuelles prises à votre demande (article 6.1.b du RGPD).",
          "Elles ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.",
        ],
      },
      {
        titre: "Durée de conservation",
        paragraphes: ["Vos données sont conservées 3 ans après notre dernier contact, puis supprimées."],
      },
      {
        titre: "Destinataires et sous-traitants",
        paragraphes: [
          `Vos données sont destinées à ${SITE.nom} uniquement. Nous faisons appel aux prestataires techniques suivants, qui les traitent pour notre compte :`,
        ],
        liste: [
          "**Vercel** — hébergement du site ;",
          "**Supabase** — stockage des demandes de contact ;",
          "**Resend** — envoi des emails.",
        ],
      },
      {
        titre: "Transferts hors de l'Union européenne",
        paragraphes: [
          "Les demandes de contact sont stockées chez Supabase dans un centre de données situé dans l'Union européenne. Vercel et Resend sont des sociétés américaines : les transferts éventuels de données vers les États-Unis sont encadrés par les clauses contractuelles types de la Commission européenne et, le cas échéant, par le cadre de protection des données UE–États-Unis (Data Privacy Framework).",
        ],
      },
      {
        titre: "Vos droits",
        paragraphes: [
          `Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation du traitement et de portabilité de vos données. Pour les exercer, écrivez-nous à ${MAIL}.`,
          "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : [cnil.fr](https://www.cnil.fr).",
        ],
      },
      {
        titre: "Mesure d'audience",
        paragraphes: [
          "Nous mesurons la fréquentation du site avec Vercel Web Analytics, sans cookie et sans collecter de donnée personnelle : seules des statistiques globales et anonymes (pages vues, provenance) sont produites.",
        ],
      },
      {
        titre: "Cookies",
        paragraphes: [
          "Le site n'utilise aucun cookie publicitaire ni de suivi. Un cookie technique peut mémoriser la langue que vous avez choisie ; il est strictement nécessaire au fonctionnement du site.",
          "La vidéo de la page À propos est intégrée en mode de confidentialité renforcée de YouTube (youtube-nocookie.com) : YouTube ne dépose d'informations dans votre navigateur que si vous lancez la lecture.",
        ],
      },
    ],
  },
  en: {
    seo: {
      titre: "Privacy policy — Spice Events",
      description:
        "How Spice Events handles contact form data: purpose, legal basis, retention period, processors, your GDPR rights and cookie-free analytics.",
    },
    hero: { surtitre: "Your data", titre: "Privacy *policy*" },
    miseAJour: "Last updated: 16 October 2026",
    blocs: [
      {
        titre: "Data controller",
        paragraphes: [`${S.raisonSociale} (trading as ${SITE.nom}), ${ADRESSE}, ${S.adresse.pays}, represented by ${SITE.fondateur} — ${MAIL}.`],
      },
      {
        titre: "Data we collect",
        paragraphes: ["We only collect the information you send us through the contact form:"],
        liste: [
          "your name;",
          "your email address and phone number;",
          "the date and venue of your event;",
          "the number of guests;",
          "your message.",
        ],
      },
      {
        titre: "Purpose and legal basis",
        paragraphes: [
          "This data is used solely to reply to your enquiry and prepare a quote. The processing is based on steps taken at your request prior to entering into a contract (Article 6(1)(b) GDPR).",
          "It is never sold, rented out or used for advertising.",
        ],
      },
      {
        titre: "Retention period",
        paragraphes: ["Your data is kept for 3 years after our last contact, then deleted."],
      },
      {
        titre: "Recipients and processors",
        paragraphes: [
          `Your data is intended for ${SITE.nom} only. We use the following technical providers, who process it on our behalf:`,
        ],
        liste: [
          "**Vercel** — website hosting;",
          "**Supabase** — storage of contact requests;",
          "**Resend** — sending emails.",
        ],
      },
      {
        titre: "Transfers outside the European Union",
        paragraphes: [
          "Contact requests are stored by Supabase in a data centre located in the European Union. Vercel and Resend are US companies: any transfer of data to the United States is covered by the European Commission's standard contractual clauses and, where applicable, by the EU–US Data Privacy Framework.",
        ],
      },
      {
        titre: "Your rights",
        paragraphes: [
          `You have the right to access, rectify and erase your data, to object to or restrict its processing, and to data portability. To exercise these rights, email us at ${MAIL}.`,
          "If, after contacting us, you feel your rights have not been respected, you can lodge a complaint with the CNIL, the French data protection authority: [cnil.fr](https://www.cnil.fr).",
        ],
      },
      {
        titre: "Audience measurement",
        paragraphes: [
          "We measure visits to the website with Vercel Web Analytics, without cookies and without collecting any personal data: only aggregate, anonymous statistics (page views, referrers) are produced.",
        ],
      },
      {
        titre: "Cookies",
        paragraphes: [
          "This website uses no advertising or tracking cookies. A technical cookie may remember the language you have chosen; it is strictly necessary for the website to work.",
          "The video on the About page is embedded using YouTube's privacy-enhanced mode (youtube-nocookie.com): YouTube only stores information in your browser if you start playing the video.",
        ],
      },
    ],
  },
};
