import type { Bilingue, Seo } from "../types";

type PageAvis = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  awards: { surtitre: string; titre: string; texte: (annees: string) => string };
  mariages: { surtitre: string; titre: string };
  evenements: { surtitre: string; titre: string };
  mariagesNet: { surtitre: string; titre: string; texte: string; lien: string };
};

export const PAGE_AVIS: Bilingue<PageAvis> = {
  fr: {
    seo: {
      titre: "Avis clients — DJ mariage Spice Events en Île-de-France",
      description:
        "Les avis des mariés et des clients de Spice Events, DJ de mariage primé aux Wedding Awards Mariages.net 2022, 2024 et 2025. Paris et Île-de-France.",
    },
    hero: {
      surtitre: "Avis",
      titre: "Ce qu'ils retiennent *de leur soirée*.",
      intro: "Les mots des mariés et des clients qui nous ont confié leur événement.",
    },
    awards: {
      surtitre: "Distinctions",
      titre: "Wedding Awards *Mariages.net*",
      texte: (annees) => `Des distinctions décernées par Mariages.net en ${annees}.`,
    },
    mariages: { surtitre: "Mariages", titre: "Les mariés *racontent*." },
    evenements: { surtitre: "Événements", titre: "Soirées privées *et entreprises*." },
    mariagesNet: {
      surtitre: "Mariages.net",
      titre: "Vous avez dansé *avec nous* ?",
      texte: "Retrouvez nos avis sur Mariages.net, ou partagez à votre tour votre expérience : chaque mot compte pour les couples qui nous découvrent.",
      lien: "Lire ou laisser un avis",
    },
  },
  en: {
    seo: {
      titre: "Reviews — Spice Events wedding DJ in Paris & Île-de-France",
      description:
        "Reviews from couples and clients of Spice Events, the wedding DJ awarded Mariages.net Wedding Awards in 2022, 2024 and 2025. Paris and Île-de-France.",
    },
    hero: {
      surtitre: "Reviews",
      titre: "What they remember *about their night*.",
      intro: "In the words of the couples and clients who trusted us with their event, translated from the French.",
    },
    awards: {
      surtitre: "Awards",
      titre: "Mariages.net *Wedding Awards*",
      texte: (annees) => `Awards presented by Mariages.net in ${annees}.`,
    },
    mariages: { surtitre: "Weddings", titre: "Our couples *tell the story*." },
    evenements: { surtitre: "Events", titre: "Private parties *and corporate events*." },
    mariagesNet: {
      surtitre: "Mariages.net",
      titre: "Did you dance *with us*?",
      texte: "Read our reviews on Mariages.net, or share your own experience: every word helps the couples who are just discovering us.",
      lien: "Read or leave a review",
    },
  },
};
