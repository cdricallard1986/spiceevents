/**
 * Redirections 301 des anciennes adresses Strikingly vers le nouveau site.
 * Branchées dans `next.config.ts` ; chaque ligne est vérifiée par les tests.
 * Ne jamais retirer une ligne : des liens externes et Google pointent encore dessus.
 */

export type Redirection = {
  source: string;
  destination: string;
  permanent: true;
  has?: { type: "host"; value: string }[];
};

/**
 * spiceevents.uk (et www) n’est pas un second site : toute adresse renvoie vers
 * la version anglaise de spiceevents.fr, qui garde seule l’autorité du domaine.
 * La règle ne s’applique que lorsque ce domaine est branché sur Vercel.
 */
export const DOMAINE_ANGLAIS = { hote: "(www\\.)?spiceevents\\.uk", destination: "https://www.spiceevents.fr/en" };

/** Ancienne page d’option → slug français de la nouvelle page `/animations/<slug>`. */
export const ANCIENNES_OPTIONS: Record<string, string> = {
  "/photobooth": "photobooth",
  "/bar-a-vinyles": "bar-a-vinyles",
  "/livre-d-or-audio": "livre-d-or-audio",
  "/ouverture-de-bal-spectaculaire": "ouverture-de-bal",
  "/guirlandes-lumineuses": "guirlandes-lumineuses",
  "/sonorisation-ceremonie-laique": "sonorisation-ceremonie-laique",
  "/sonorisation-deportee": "sonorisation-deportee",
  // Versions plus anciennes du site, encore citées dans le texte des articles.
  "/le-photobooth": "photobooth",
  "/le-bar-a-vinyles": "bar-a-vinyles",
};

/** Anciennes pages fusionnées ou renommées. */
export const ANCIENNES_PAGES: Record<string, string> = {
  "/accueil": "/",
  "/pourquoi-nous-choisir": "/",
  "/test": "/",
  "/booking-dj": "/mariages",
  "/accompagnement": "/mariages#methode",
  "/performances-techniques-son-and-lumieres": "/son-et-lumiere",
  "/cedric-allard": "/a-propos",
  "/temoignages": "/avis",
  "/galerie-photo-mariage": "/galerie",
  "/galerie-photo-evenementiel": "/galerie",
  "/contactez-nous": "/contact",
  "/animations-tendances": "/animations",
  "/on-recrute": "/recrutement",
  "/blog": "/journal",
  "/_blog": "/journal",
  // Murs d’eau & végétaux : prestation retirée (novembre 2026).
  "/mur-d-eau-and-vegetal": "/animations",
  // Versions plus anciennes du site (liens dans le texte des articles du journal,
  // et peut-être sur d’autres sites) : toutes testées en 404 en novembre 2026.
  "/vos-thematiques-au-choix": "/mariages",
  "/mariage-exception-paris": "/mariages",
  "/animations-mariage-celebration": "/animations",
  "/animations-soiree-privee": "/animations",
  "/options-mariage-eclairage-son": "/son-et-lumiere",
  "/notre-materiel": "/son-et-lumiere",
  "/materiel": "/son-et-lumiere",
  "/options-soiree-privee": "/evenementiel",
  "/private-party-formules": "/evenementiel",
  "/formule-soiree-corporate": "/evenementiel",
  "/nos-dj-d-exception": "/nos-dj",
  "/galerie-mariage": "/galerie",
  "/on-vous-rappelle": "/contact",
  "/des-evenements-plus-green": "/a-propos",
  "/amis-partenaires": "/a-propos",
  // Adresses Strikingly terminées par un tiret, relevées en 404 par Google.
  "/options-mariage-": "/animations",
  "/animations-": "/animations",
};

/** Pages d’option retirées du nouveau site (adresse FR et EN) → page Animations de la même langue. */
export const OPTIONS_RETIREES: Record<string, string> = {
  "/animations/murs-d-eau-et-vegetaux": "/animations",
  "/en/entertainment/water-and-green-walls": "/en/entertainment",
};

/** Articles retirés du journal (datés ou hors sujet) → page la plus proche. */
export const ARTICLES_RETIRES: Record<string, string> = {
  "nouvel-arrivage-de-materiel-l-acoustics": "/son-et-lumiere",
  "nouvel-arrivage-de-materiel-l-acoustics-et-yamaha": "/son-et-lumiere",
  "nouvelle-regie-pioneer-blanche-edition-limitee": "/son-et-lumiere",
  "location-enceinte-batterie-maui5go": "/animations/sonorisation-deportee",
  "celebrer-les-10-ans-de-la-jungle-au-showroom-01": "/evenementiel",
  "amnesty-international-a-la-marche-des-fiertes-2019": "/evenementiel",
  "soiree-blanche-a-lagny-sur-marne": "/evenementiel",
  "un-anniversaire-de-30-ans-dont-on-se-souviendra": "/evenementiel",
  "un-anniversaire-de-talent": "/evenementiel",
  "ouverture-de-bal-spectaculaire": "/animations/ouverture-de-bal",
  "les-robes-tendances-pour-2026": "/journal",
  "quelles-sont-les-tendances-mariage-pour-2025": "/journal",
  "3-bonnes-raisons-d-engager-un-magicien-pour-votre-evenement": "/animations",
  "enterrer-sa-vie-de-celibataire": "/journal",
};

/**
 * Slugs [fr, en] des pages d’option, recopiés de `contenu/options.ts` (ce fichier
 * est chargé par `next.config.ts`, qui ne résout pas les alias `@/`). Un test
 * vérifie qu’ils restent identiques.
 */
export const SLUGS_OPTIONS: readonly (readonly [string, string])[] = [
  ["ouverture-de-bal", "first-dance-effects"],
  ["bar-a-vinyles", "vinyl-bar"],
  ["livre-d-or-audio", "audio-guestbook"],
  ["photobooth", "photobooth"],
  ["guirlandes-lumineuses", "string-lights"],
  ["feux-d-artifice-de-jour", "daytime-fireworks"],
  ["sonorisation-ceremonie-laique", "ceremony-sound"],
  ["sonorisation-deportee", "multi-room-sound"],
];

/**
 * Adresses de traduction fausses, annoncées à Google jusqu’en novembre 2026 par
 * l’en-tête « Link » de next-intl (slug de l’autre langue gardé tel quel) :
 * option sous le slug de l’autre langue → bonne page ; journal en anglais
 * (inexistant, le journal est en français) → article français.
 */
export function redirectionsTraductions(): Redirection[] {
  const liste: Redirection[] = [];
  for (const [fr, en] of SLUGS_OPTIONS) {
    if (fr === en) continue;
    liste.push({ source: `/animations/${en}`, destination: `/animations/${fr}`, permanent: true });
    liste.push({ source: `/en/entertainment/${fr}`, destination: `/en/entertainment/${en}`, permanent: true });
  }
  liste.push({ source: "/en/journal", destination: "/journal", permanent: true });
  liste.push({ source: "/en/journal/:slug", destination: "/journal/:slug", permanent: true });
  return liste;
}

export function redirections(): Redirection[] {
  const liste: Redirection[] = [
    {
      source: "/:chemin*",
      has: [{ type: "host", value: DOMAINE_ANGLAIS.hote }],
      destination: `${DOMAINE_ANGLAIS.destination}/:chemin*`,
      permanent: true,
    },
  ];
  for (const [source, destination] of Object.entries(ANCIENNES_PAGES)) {
    liste.push({ source, destination, permanent: true });
  }
  for (const [source, destination] of Object.entries(OPTIONS_RETIREES)) {
    liste.push({ source, destination, permanent: true });
  }
  for (const [source, slug] of Object.entries(ANCIENNES_OPTIONS)) {
    liste.push({ source, destination: `/animations/${slug}`, permanent: true });
  }
  for (const [slug, destination] of Object.entries(ARTICLES_RETIRES)) {
    liste.push({ source: `/blog/${slug}`, destination, permanent: true });
    liste.push({ source: `/blog/${slug}.amp`, destination, permanent: true });
  }
  liste.push(...redirectionsTraductions());
  liste.push({ source: "/blog/categories/:categorie*", destination: "/journal", permanent: true });
  // Versions AMP des articles Strikingly (« /blog/<slug>.amp », relevées par Google) :
  // vers l’article, sans le « .amp ». Avant la règle générique, qui les prendrait sinon.
  liste.push({ source: "/blog/:slug([^/]+)\\.amp", destination: "/journal/:slug", permanent: true });
  // Articles conservés : même slug, nouveau dossier.
  liste.push({ source: "/blog/:slug", destination: "/journal/:slug", permanent: true });
  return liste;
}
