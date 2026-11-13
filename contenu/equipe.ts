import type { MembreEquipe } from "@/lib/equipe/types";

/**
 * DJ et musiciens de la page Nos DJ tels qu'au 13 novembre 2026, au format de
 * la table `equipe` (migration 0012). Deux usages :
 * - l'import initial en base (`lib/equipe/import-sql.ts` → migration 0012) ;
 * - les données de secours de la page sans Supabase dans l'environnement
 *   (développement local, tests).
 * Ensuite, l'équipe se gère dans le back office (/admin/dj) : ce fichier ne
 * suit plus les modifications faites en ligne.
 *
 * Règle de Cédric : le nom de famille réduit à son initiale. Biographies de
 * l'ancien site (Kevin, DJ Pan's alias Aurélien, David, Lucas) ; Antoine et
 * Angel présentés à partir des avis Mariages.net de 2026. Portraits tirés du
 * Drive Spice et identifiés par Cédric.
 */

const MIXCLOUD_KEVIN = "https://www.mixcloud.com/kevin-ramboatiana/";
const FACEBOOK_PANS = "https://www.facebook.com/djpans";

const VIDE = {
  alias: null,
  avis_texte_fr: null,
  avis_texte_en: null,
  avis_auteur_fr: null,
  avis_auteur_en: null,
  lieux_fr: null,
  lieux_en: null,
  lien_url: null,
  lien_libelle_fr: null,
  lien_libelle_en: null,
  photo_chemin: null,
  photo_largeur: null,
  photo_hauteur: null,
  photo_cadrage: "50% 50%",
  publie: true,
} as const satisfies Partial<MembreEquipe>;

export const EQUIPE_INITIALE: readonly MembreEquipe[] = [
  {
    ...VIDE,
    id: "6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e01",
    groupe: "dj",
    ordre: 10,
    nom: "Antoine D.",
    role_fr: "DJ",
    role_en: null,
    styles_fr: ["Mariages", "Mariages internationaux"],
    styles_en: ["Weddings", "International weddings"],
    accroche_fr: "Le dernier arrivé, déjà salué par les mariés.",
    accroche_en: "The newest member, already praised by couples.",
    presentation_fr: "Antoine a rejoint l'équipe pour la saison 2026. Il a déjà fait danser des mariages venus de l'étranger, en orchestrant aussi les discours du dîner.",
    presentation_en: "Antoine joined the team for the 2026 season. He has already got couples from abroad dancing, and hosted the dinner speeches too.",
    avis_texte_fr: "DJ Antoine a été excellent ; il a joué toutes les chansons que nous avons demandées et a aidé à officier les discours pendant le dîner.",
    avis_texte_en: "DJ Antoine was excellent; he played all the songs we requested and helped officiate the speeches during the dinner.",
    avis_auteur_fr: "Roman, mariage de juillet 2026",
    avis_auteur_en: "Roman, July 2026 wedding",
  },
  {
    ...VIDE,
    id: "6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e02",
    groupe: "dj",
    ordre: 20,
    nom: "Kevin R.",
    role_fr: "DJ",
    role_en: null,
    styles_fr: ["Électro", "Funk", "French Touch"],
    styles_en: ["Electro", "Funk", "French Touch"],
    accroche_fr: "Né en 1992, il baigne dans la musique depuis toujours.",
    accroche_en: "Born in 1992, he has grown up surrounded by music.",
    presentation_fr:
      "Il découvre le DJing à 13 ans et bricole ses premiers mix dans sa chambre. La French Touch et ses voyages lui donnent son univers : électro et funk, avec quelques percussions à l'esprit tribal.\n\nRepéré pour son charisme et l'originalité de ses mix, il joue dans les plus grands clubs parisiens et des lieux reconnus, du Rex Club au Palace. En 2019, il fait partie du jury du Lab Festival Paris, dédié à la nouvelle scène DJ parisienne.",
    presentation_en:
      "He discovered DJing at 13 and made his first mixes in his bedroom. French Touch and his travels shaped his sound: electro and funk, with a touch of tribal percussion.\n\nNoticed for his charisma and original mixes, he has played the biggest Paris clubs and renowned venues, from the Rex Club to Le Palace. In 2019 he sat on the jury of the Lab Festival Paris, devoted to the new Paris DJ scene.",
    lieux_fr: "Amante (Ibiza), Rex Club, La Machine du Moulin Rouge, InterContinental Paris Le Grand, The Westin, Pavillon Cambon Capucines, Tour Montparnasse, Musée Rodin",
    lieux_en: null,
    lien_url: MIXCLOUD_KEVIN,
    lien_libelle_fr: "Sa page Mixcloud",
    lien_libelle_en: "His Mixcloud page",
    photo_chemin: "/images/dj-kevin-r.jpg",
    photo_largeur: 1244,
    photo_hauteur: 1244,
    photo_cadrage: "50% 8%",
  },
  {
    ...VIDE,
    id: "6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e03",
    groupe: "dj",
    ordre: 30,
    nom: "DJ Pan's",
    alias: "Aurélien",
    role_fr: "DJ, avec guitariste",
    role_en: "DJ, with guitarist",
    styles_fr: ["Rock", "Pop", "New wave", "Rockabilly"],
    styles_en: ["Rock", "Pop", "New wave", "Rockabilly"],
    accroche_fr: "Let's rock !",
    accroche_en: "Let's rock!",
    presentation_fr:
      "Du rockabilly à l'électro-rock, en passant par la pop, la new wave et le surf : aucune branche du rock ne manque à sa playlist.\n\nMajor de sa promotion à l'école des Deejays de l'UCPA, rodé par des centaines de clubs en France et à l'étranger, et passé par la radio, il propose un vrai show pop-rock accompagné d'un guitariste : nouveautés et classiques, pépites et raretés, entrecoupés de riffs ravageurs.",
    presentation_en:
      "From rockabilly to electro-rock, by way of pop, new wave and surf: no branch of rock is missing from his playlist.\n\nTop of his class at the UCPA DJ school, seasoned by hundreds of clubs in France and abroad and by radio work, he offers a real pop-rock show with a live guitarist: new releases and classics, gems and rarities, cut with blistering riffs.",
    avis_texte_fr: "Aurélien nous a fait danser toute la nuit en s'adaptant à nos goûts. Il a été extrêmement gentil et arrangeant !",
    avis_texte_en: "Aurélien kept us dancing all night, adapting to our tastes. He was extremely kind and accommodating!",
    avis_auteur_fr: "Juliette, mariage de septembre 2022",
    avis_auteur_en: "Juliette, September 2022 wedding",
    lien_url: FACEBOOK_PANS,
    lien_libelle_fr: "Sa page Facebook",
    lien_libelle_en: "His Facebook page",
    photo_chemin: "/images/dj-pans.jpg",
    photo_largeur: 1200,
    photo_hauteur: 1800,
    photo_cadrage: "50% 30%",
  },
  {
    ...VIDE,
    id: "6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e04",
    groupe: "dj",
    ordre: 40,
    nom: "David G.",
    role_fr: "DJ",
    role_en: null,
    styles_fr: ["House", "Deep house", "Mariages"],
    styles_en: ["House", "Deep house", "Weddings"],
    accroche_fr: "Depuis ses 15 ans, David vous fait danser.",
    accroche_en: "David has been getting people dancing since he was 15.",
    presentation_fr:
      "Il commence par les soirées de son entourage, puis mixe dès 18 ans dans des discothèques parisiennes comme le Duplex ou le Mix Club, avant de se consacrer aux mariages.\n\nSes mariages l'ont mené aux quatre coins de la France, du bassin parisien à la Bretagne, et jusque sur des îles comme l'île d'Yeu ou le Frioul. Sa motivation : partager sa passion et mettre le feu jusqu'au bout de la nuit.",
    presentation_en:
      "He started with parties for friends and family, then played Paris clubs such as Le Duplex and the Mix Club from the age of 18, before focusing on weddings.\n\nWeddings have taken him all over France, from Paris to Brittany and out to islands such as Île d'Yeu and Frioul. What drives him: sharing his passion and keeping the party going until dawn.",
    photo_chemin: "/images/dj-david-g.jpg",
    photo_largeur: 1800,
    photo_hauteur: 1350,
    photo_cadrage: "55% 30%",
  },
  {
    ...VIDE,
    id: "6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e05",
    groupe: "dj",
    ordre: 50,
    nom: "Lucas M.",
    role_fr: "DJ et musicien",
    role_en: "DJ and musician",
    styles_fr: ["Funk", "Rock", "Disco", "Actuel"],
    styles_en: ["Funk", "Rock", "Disco", "Current hits"],
    accroche_fr: "De la technique à la magie.",
    accroche_en: "From technique to magic.",
    presentation_fr:
      "Émerveillé depuis toujours par l'événementiel, Lucas mixe depuis plus de 10 ans dans des soirées privées avant de se tourner vers les mariages.\n\nMusicien de la première heure, il mêle les ambiances, du funk au rock en passant par le disco et les musiques actuelles, pour garder la piste pleine jusqu'au petit matin.",
    presentation_en:
      "Always fascinated by events, Lucas has been DJing private parties for more than 10 years before turning to weddings.\n\nA musician through and through, he blends moods, from funk to rock by way of disco and current hits, to keep the dance floor full until the small hours.",
    photo_chemin: "/images/dj-lucas-m.jpg",
    photo_largeur: 484,
    photo_hauteur: 600,
    photo_cadrage: "50% 22%",
  },
  {
    ...VIDE,
    id: "6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e06",
    groupe: "musicien",
    ordre: 60,
    nom: "Angel",
    role_fr: "Saxophoniste",
    role_en: "Saxophonist",
    styles_fr: ["Vin d'honneur", "Soirée"],
    styles_en: ["Drinks reception", "Party"],
    accroche_fr: "Le live qui fait lever les invités.",
    accroche_en: "The live touch that gets guests on their feet.",
    presentation_fr: "Angel accompagne le DJ au saxophone, pour un cocktail élégant ou une soirée qui monte encore d'un cran.",
    presentation_en: "Angel plays saxophone alongside the DJ, for an elegant drinks reception or a party that goes up another notch.",
    avis_texte_fr: "Cédric et Angel ont été fantastiques et ont rendu l'après-midi et la soirée inoubliables pour le mariage.",
    avis_texte_en: "Cedric and Angel were fantastic and made the afternoon and evening a wedding to remember.",
    avis_auteur_fr: "Lucy, mariage de juillet 2026",
    avis_auteur_en: "Lucy, July 2026 wedding",
  },
];
