import type { Seo } from "../types";

type Recrutement = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  poste: { surtitre: string; titre: string; paragraphes: string[] };
  profil: { titre: string; points: string[] };
  missions: { titre: string; points: string[] };
  pourquoi: { surtitre: string; titre: string; texte: string };
  candidature: { titre: string; texte: string; bouton: string; objet: string };
};

/** Page publiée en français seulement. */
export const RECRUTEMENT: Recrutement = {
  seo: {
    titre: "Recrutement : DJ généraliste mariages et événements — Spice Events",
    description:
      "Spice Events recrute un DJ généraliste pour animer des mariages et des événements en Île-de-France : profil recherché, missions et candidature.",
  },
  hero: {
    surtitre: "On recrute",
    titre: "Rejoignez *l'aventure* Spice Events.",
    intro: "Nous cherchons un ou une DJ généraliste pour animer nos mariages et nos événements.",
  },
  poste: {
    surtitre: "DJ généraliste · Mariages & événements",
    titre: "Plus qu'un DJ, *une personnalité*.",
    paragraphes: [
      "Nous ne cherchons pas seulement quelqu'un qui sait mixer. Nous cherchons une personnalité capable de créer des ambiances, de comprendre les émotions et d'accompagner des mariés tout au long de leur journée.",
      "Vous interviendrez sur des mariages et des événements aux univers variés. Votre mission : faire vivre la piste de danse, et être un vrai partenaire pour les mariés comme pour les autres prestataires. Si vous aimez la musique, le contact humain et le travail bien fait, vous êtes au bon endroit.",
    ],
  },
  profil: {
    titre: "Vous êtes fait(e) pour ce poste si…",
    points: [
      "vous êtes DJ généraliste, à l'aise avec tous les styles et toutes les générations ;",
      "vous savez lire une piste de danse et ajuster votre set ;",
      "vous avez un bon relationnel client et une attitude rassurante ;",
      "vous êtes à l'aise à l'oral et en visio ;",
      "vous avez des bases techniques en son et lumière, ou l'envie d'apprendre ;",
      "vous êtes fiable, ponctuel(le) et impliqué(e).",
    ],
  },
  missions: {
    titre: "Vos missions",
    points: [
      "Animer la piste de danse pendant environ 4 heures.",
      "Adapter la musique en temps réel selon l'ambiance et le public.",
      "Être force de proposition pour les moments clés : entrée, ouverture de bal, surprises, transitions.",
      "Assurer une présentation professionnelle et commerciale.",
      "Participer ponctuellement aux rendez-vous clients en visio.",
      "Tenir le timing de la soirée avec les autres prestataires (traiteur, photo, vidéo…).",
      "Aider au montage et au démontage du matériel, avec un technicien.",
    ],
  },
  pourquoi: {
    surtitre: "Pourquoi nous rejoindre",
    titre: "Un métier exercé *avec exigence*.",
    texte:
      "Nous défendons une approche humaine et qualitative du métier : chaque événement est préparé avec soin, anticipation et rigueur, jamais laissé au hasard. Vous rejoignez une équipe passionnée et bienveillante, attachée au travail collectif et au souci du détail, avec des prestations valorisantes et du matériel professionnel performant.",
  },
  candidature: {
    titre: "Envie de *rejoindre l'équipe* ?",
    texte: "Envoyez-nous quelques mots sur vous, votre expérience et vos disponibilités : nous vous recontacterons rapidement.",
    bouton: "Envoyer ma candidature",
    objet: "Candidature DJ généraliste",
  },
};
