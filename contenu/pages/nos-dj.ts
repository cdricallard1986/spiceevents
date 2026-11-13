import type { CleImage } from "@/lib/images";
import type { Bilingue, Seo } from "../types";

/**
 * Page « Nos DJ » : l'équipe de Cédric (novembre 2026). Biographies reprises de
 * l'ancien site (Kevin, DJ Pan's alias Aurélien, David, Lucas), Antoine et Angel présentés à
 * partir des avis Mariages.net de 2026. Sans photo : un monogramme en attendant
 * les portraits.
 */
export type Membre = {
  id: string;
  nom: string;
  /** L'autre nom sous lequel les mariés le connaissent (nom de scène ou prénom), affiché sous le nom. */
  alias?: string;
  role: string;
  styles: string[];
  accroche: string;
  paragraphes: string[];
  /** Un avis de mariés qui le cite (texte exact, traduit en anglais si besoin). */
  avis?: { texte: string; auteur: string };
  lieux?: string;
  lien?: { libelle: string; href: string };
  image?: CleImage;
};

type NosDj = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  fondateur: Membre & { surtitre: string; titre: string };
  equipe: { surtitre: string; titre: string; intro: string; membres: Membre[] };
  musiciens: { surtitre: string; titre: string; intro: string; membres: Membre[] };
  methode: { surtitre: string; titre: string; points: { titre: string; texte: string }[] };
  appel: { titre: string; texte: string; bouton: string };
};

const MIXCLOUD_KEVIN = "https://www.mixcloud.com/kevin-ramboatiana/";
const FACEBOOK_PANS = "https://www.facebook.com/djpans";
const MIX_CEDRIC = "https://www.youtube.com/watch?v=zchNbRcZ_gI";

export const NOS_DJ: Bilingue<NosDj> = {
  fr: {
    seo: {
      titre: "Nos DJ de mariage et de soirée en Île-de-France | Spice Events",
      description:
        "Cédric (DJ Dioz) et les DJ de l'équipe Spice Events : électro, funk, house, pop-rock avec guitariste, et un saxophoniste pour le live. Une même méthode pour chaque mariage.",
    },
    hero: {
      surtitre: "L'équipe",
      titre: "Nos DJ. *Le piment aux platines.*",
      intro:
        "Des styles différents, une même exigence : lire la piste, préparer chaque soirée avec vous et faire danser toutes les générations jusqu'au bout de la nuit.",
    },
    fondateur: {
      surtitre: "Le fondateur",
      titre: "Cédric, *alias DJ Dioz*.",
      id: "cedric",
      nom: "Cédric Allard",
      alias: "DJ Dioz",
      role: "DJ et fondateur",
      styles: ["Tous les styles", "Mariages", "Événements"],
      accroche: "Plus de 20 ans de platines et plus de 600 mariages et événements.",
      paragraphes: [
        "Cédric a fait de sa passion un métier : il mixe lui-même une partie des mariages et prépare toutes les soirées de l'équipe, du questionnaire musical au déroulé du jour J.",
        "Son credo : un bon DJ ne se cache pas derrière son ordinateur, il vit la soirée avec vous. Selon votre date, c'est lui qui mixe, ou il vous présente le DJ de l'équipe qui vous ressemble.",
      ],
      lien: { libelle: "Écouter son mix", href: MIX_CEDRIC },
      image: "presta-cedric-portrait",
    },
    equipe: {
      surtitre: "Les DJ",
      titre: "Chacun son style. *Tous le même piment.*",
      intro: "Des clubs parisiens aux mariages dans toute la France : des DJ choisis par Cédric, préparés avec la même méthode.",
      membres: [
        {
          id: "antoine",
          nom: "Antoine Doussat",
          role: "DJ",
          styles: ["Mariages", "Mariages internationaux"],
          accroche: "Le dernier arrivé, déjà salué par les mariés.",
          paragraphes: [
            "Antoine a rejoint l'équipe pour la saison 2026. Il a déjà fait danser des mariages venus de l'étranger, en orchestrant aussi les discours du dîner.",
          ],
          avis: {
            texte: "DJ Antoine a été excellent ; il a joué toutes les chansons que nous avons demandées et a aidé à officier les discours pendant le dîner.",
            auteur: "Roman, mariage de juillet 2026",
          },
        },
        {
          id: "kevin",
          nom: "Kevin Ramboatiana",
          role: "DJ",
          styles: ["Électro", "Funk", "French Touch"],
          accroche: "Né en 1992, il baigne dans la musique depuis toujours.",
          paragraphes: [
            "Il découvre le DJing à 13 ans et bricole ses premiers mix dans sa chambre. La French Touch et ses voyages lui donnent son univers : électro et funk, avec quelques percussions à l'esprit tribal.",
            "Repéré pour son charisme et l'originalité de ses mix, il joue dans les plus grands clubs parisiens et des lieux reconnus, du Rex Club au Palace. En 2019, il fait partie du jury du Lab Festival Paris, dédié à la nouvelle scène DJ parisienne.",
          ],
          lieux: "Amante (Ibiza), Rex Club, La Machine du Moulin Rouge, InterContinental Paris Le Grand, The Westin, Pavillon Cambon Capucines, Tour Montparnasse, Musée Rodin",
          lien: { libelle: "Sa page Mixcloud", href: MIXCLOUD_KEVIN },
        },
        {
          id: "pans",
          nom: "DJ Pan's",
          alias: "Aurélien",
          role: "DJ, avec guitariste",
          styles: ["Rock", "Pop", "New wave", "Rockabilly"],
          accroche: "Let's rock !",
          paragraphes: [
            "Du rockabilly à l'électro-rock, en passant par la pop, la new wave et le surf : aucune branche du rock ne manque à sa playlist.",
            "Major de sa promotion à l'école des Deejays de l'UCPA, rodé par des centaines de clubs en France et à l'étranger, et passé par la radio, il propose un vrai show pop-rock accompagné d'un guitariste : nouveautés et classiques, pépites et raretés, entrecoupés de riffs ravageurs.",
          ],
          avis: {
            texte: "Aurélien nous a fait danser toute la nuit en s'adaptant à nos goûts. Il a été extrêmement gentil et arrangeant !",
            auteur: "Juliette, mariage de septembre 2022",
          },
          lien: { libelle: "Sa page Facebook", href: FACEBOOK_PANS },
        },
        {
          id: "david",
          nom: "David Gentio",
          role: "DJ",
          styles: ["House", "Deep house", "Mariages"],
          accroche: "Depuis ses 15 ans, David vous fait danser.",
          paragraphes: [
            "Il commence par les soirées de son entourage, puis mixe dès 18 ans dans des discothèques parisiennes comme le Duplex ou le Mix Club, avant de se consacrer aux mariages.",
            "Ses mariages l'ont mené aux quatre coins de la France, du bassin parisien à la Bretagne, et jusque sur des îles comme l'île d'Yeu ou le Frioul. Sa motivation : partager sa passion et mettre le feu jusqu'au bout de la nuit.",
          ],
        },
        {
          id: "lucas",
          nom: "Lucas Magro",
          role: "DJ et musicien",
          styles: ["Funk", "Rock", "Disco", "Actuel"],
          accroche: "De la technique à la magie.",
          paragraphes: [
            "Émerveillé depuis toujours par l'événementiel, Lucas mixe depuis plus de 10 ans dans des soirées privées avant de se tourner vers les mariages.",
            "Musicien de la première heure, il mêle les ambiances, du funk au rock en passant par le disco et les musiques actuelles, pour garder la piste pleine jusqu'au petit matin.",
          ],
        },
      ],
    },
    musiciens: {
      surtitre: "En live",
      titre: "Un saxophone *sur vos platines*.",
      intro: "Pour le vin d'honneur ou la soirée, un musicien joue en live sur les mix du DJ.",
      membres: [
        {
          id: "angel",
          nom: "Angel",
          role: "Saxophoniste",
          styles: ["Vin d'honneur", "Soirée"],
          accroche: "Le live qui fait lever les invités.",
          paragraphes: ["Angel accompagne le DJ au saxophone, pour un cocktail élégant ou une soirée qui monte encore d'un cran."],
          avis: { texte: "Cédric et Angel ont été fantastiques et ont rendu l'après-midi et la soirée inoubliables pour le mariage.", auteur: "Lucy, mariage de juillet 2026" },
        },
      ],
    },
    methode: {
      surtitre: "La même méthode",
      titre: "Quel que soit votre DJ, *rien n'est laissé au hasard*.",
      points: [
        { titre: "Préparé par Cédric", texte: "Questionnaire musical, rendez-vous de préparation et déroulé de la soirée : Cédric prépare chaque mariage avec vous, puis le transmet à votre DJ." },
        { titre: "Votre musique", texte: "Vos incontournables, les morceaux à éviter, les moments clés : le DJ arrive en connaissant votre soirée." },
        { titre: "Le même matériel", texte: "Son et lumière fournis par MX Événement, testés en atelier avant chaque date, avec du matériel de secours sur place." },
      ],
    },
    appel: {
      titre: "Quel DJ pour *votre nuit* ?",
      texte: "Racontez-nous votre date et vos envies musicales : Cédric vous propose le DJ qui vous ressemble.",
      bouton: "Vérifier ma date",
    },
  },
  en: {
    seo: {
      titre: "Our wedding & party DJs in Paris | Spice Events",
      description:
        "Cédric (DJ Dioz) and the Spice Events DJs: electro, funk, house, pop-rock with a guitarist, plus a saxophonist for live sets. The same method for every wedding.",
    },
    hero: {
      surtitre: "The team",
      titre: "Our DJs. *Spice on the decks.*",
      intro:
        "Different styles, the same high standards: reading the dance floor, preparing every night with you and getting every generation dancing until the very end.",
    },
    fondateur: {
      surtitre: "The founder",
      titre: "Cédric, *aka DJ Dioz*.",
      id: "cedric",
      nom: "Cédric Allard",
      alias: "DJ Dioz",
      role: "DJ and founder",
      styles: ["Every style", "Weddings", "Events"],
      accroche: "Over 20 years on the decks and more than 600 weddings and events.",
      paragraphes: [
        "Cédric turned his passion into his profession: he plays some of the weddings himself and prepares every night the team plays, from the music questionnaire to the running order on the day.",
        "His motto: a good DJ doesn't hide behind a laptop, he lives the night with you. Depending on your date, he plays himself or introduces you to the DJ from the team who suits you best.",
      ],
      lien: { libelle: "Listen to his mix", href: MIX_CEDRIC },
      image: "presta-cedric-portrait",
    },
    equipe: {
      surtitre: "The DJs",
      titre: "Each with their style. *All with the same spice.*",
      intro: "From Paris clubs to weddings all over France: DJs chosen by Cédric and prepared with the same method.",
      membres: [
        {
          id: "antoine",
          nom: "Antoine Doussat",
          role: "DJ",
          styles: ["Weddings", "International weddings"],
          accroche: "The newest member, already praised by couples.",
          paragraphes: [
            "Antoine joined the team for the 2026 season. He has already got couples from abroad dancing, and hosted the dinner speeches too.",
          ],
          avis: {
            texte: "DJ Antoine was excellent; he played all the songs we requested and helped officiate the speeches during the dinner.",
            auteur: "Roman, July 2026 wedding",
          },
        },
        {
          id: "kevin",
          nom: "Kevin Ramboatiana",
          role: "DJ",
          styles: ["Electro", "Funk", "French Touch"],
          accroche: "Born in 1992, he has grown up surrounded by music.",
          paragraphes: [
            "He discovered DJing at 13 and made his first mixes in his bedroom. French Touch and his travels shaped his sound: electro and funk, with a touch of tribal percussion.",
            "Noticed for his charisma and original mixes, he has played the biggest Paris clubs and renowned venues, from the Rex Club to Le Palace. In 2019 he sat on the jury of the Lab Festival Paris, devoted to the new Paris DJ scene.",
          ],
          lieux: "Amante (Ibiza), Rex Club, La Machine du Moulin Rouge, InterContinental Paris Le Grand, The Westin, Pavillon Cambon Capucines, Tour Montparnasse, Musée Rodin",
          lien: { libelle: "His Mixcloud page", href: MIXCLOUD_KEVIN },
        },
        {
          id: "pans",
          nom: "DJ Pan's",
          alias: "Aurélien",
          role: "DJ, with guitarist",
          styles: ["Rock", "Pop", "New wave", "Rockabilly"],
          accroche: "Let's rock!",
          paragraphes: [
            "From rockabilly to electro-rock, by way of pop, new wave and surf: no branch of rock is missing from his playlist.",
            "Top of his class at the UCPA DJ school, seasoned by hundreds of clubs in France and abroad and by radio work, he offers a real pop-rock show with a live guitarist: new releases and classics, gems and rarities, cut with blistering riffs.",
          ],
          avis: {
            texte: "Aurélien kept us dancing all night, adapting to our tastes. He was extremely kind and accommodating!",
            auteur: "Juliette, September 2022 wedding",
          },
          lien: { libelle: "His Facebook page", href: FACEBOOK_PANS },
        },
        {
          id: "david",
          nom: "David Gentio",
          role: "DJ",
          styles: ["House", "Deep house", "Weddings"],
          accroche: "David has been getting people dancing since he was 15.",
          paragraphes: [
            "He started with parties for friends and family, then played Paris clubs such as Le Duplex and the Mix Club from the age of 18, before focusing on weddings.",
            "Weddings have taken him all over France, from Paris to Brittany and out to islands such as Île d'Yeu and Frioul. What drives him: sharing his passion and keeping the party going until dawn.",
          ],
        },
        {
          id: "lucas",
          nom: "Lucas Magro",
          role: "DJ and musician",
          styles: ["Funk", "Rock", "Disco", "Current hits"],
          accroche: "From technique to magic.",
          paragraphes: [
            "Always fascinated by events, Lucas has been DJing private parties for more than 10 years before turning to weddings.",
            "A musician through and through, he blends moods, from funk to rock by way of disco and current hits, to keep the dance floor full until the small hours.",
          ],
        },
      ],
    },
    musiciens: {
      surtitre: "Live",
      titre: "A saxophone *over your DJ set*.",
      intro: "For the drinks reception or the party, a musician plays live over the DJ's mixes.",
      membres: [
        {
          id: "angel",
          nom: "Angel",
          role: "Saxophonist",
          styles: ["Drinks reception", "Party"],
          accroche: "The live touch that gets guests on their feet.",
          paragraphes: ["Angel plays saxophone alongside the DJ, for an elegant drinks reception or a party that goes up another notch."],
          avis: { texte: "Cedric and Angel were fantastic and made the afternoon and evening a wedding to remember.", auteur: "Lucy, July 2026 wedding" },
        },
      ],
    },
    methode: {
      surtitre: "The same method",
      titre: "Whoever your DJ, *nothing is left to chance*.",
      points: [
        { titre: "Prepared by Cédric", texte: "Music questionnaire, planning meetings and running order: Cédric prepares every wedding with you, then hands it over to your DJ." },
        { titre: "Your music", texte: "Your must-plays, the songs to avoid, the key moments: your DJ arrives already knowing your night." },
        { titre: "The same equipment", texte: "Sound and lighting from MX Événement, tested in the workshop before every date, with backup gear on site." },
      ],
    },
    appel: {
      titre: "Which DJ for *your night*?",
      texte: "Tell us your date and your musical tastes: Cédric will suggest the DJ who suits you best.",
      bouton: "Check my date",
    },
  },
};
