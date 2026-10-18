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
 * spiceevents.uk (et www) n'est pas un second site : toute adresse renvoie vers
 * la version anglaise de spiceevents.fr, qui garde seule l'autorité du domaine.
 * La règle ne s'applique que lorsque ce domaine est branché sur Vercel.
 */
export const DOMAINE_ANGLAIS = { hote: "(www\\.)?spiceevents\\.uk", destination: "https://www.spiceevents.fr/en" };

/** Ancienne page d'option → slug français de la nouvelle page `/animations/<slug>`. */
export const ANCIENNES_OPTIONS: Record<string, string> = {
  "/photobooth": "photobooth",
  "/bar-a-vinyles": "bar-a-vinyles",
  "/livre-d-or-audio": "livre-d-or-audio",
  "/ouverture-de-bal-spectaculaire": "ouverture-de-bal",
  "/guirlandes-lumineuses": "guirlandes-lumineuses",
  "/mur-d-eau-and-vegetal": "murs-d-eau-et-vegetaux",
  "/sonorisation-ceremonie-laique": "sonorisation-ceremonie-laique",
  "/sonorisation-deportee": "sonorisation-deportee",
};

/** Anciennes pages fusionnées ou renommées. */
export const ANCIENNES_PAGES: Record<string, string> = {
  "/accueil": "/",
  "/pourquoi-nous-choisir": "/",
  "/test": "/",
  "/booking-dj": "/mariages",
  "/accompagnement": "/mariages#methode",
  "/performances-techniques-son-and-lumieres": "/a-propos",
  "/cedric-allard": "/a-propos",
  "/temoignages": "/avis",
  "/galerie-photo-mariage": "/galerie",
  "/galerie-photo-evenementiel": "/galerie",
  "/contactez-nous": "/contact",
  "/animations-tendances": "/animations",
  "/on-recrute": "/recrutement",
  "/blog": "/journal",
};

/** Articles retirés du journal (datés ou hors sujet) → page la plus proche. */
export const ARTICLES_RETIRES: Record<string, string> = {
  "nouvel-arrivage-de-materiel-l-acoustics": "/a-propos",
  "nouvel-arrivage-de-materiel-l-acoustics-et-yamaha": "/a-propos",
  "nouvelle-regie-pioneer-blanche-edition-limitee": "/a-propos",
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
  for (const [source, slug] of Object.entries(ANCIENNES_OPTIONS)) {
    liste.push({ source, destination: `/animations/${slug}`, permanent: true });
  }
  for (const [slug, destination] of Object.entries(ARTICLES_RETIRES)) {
    liste.push({ source: `/blog/${slug}`, destination, permanent: true });
  }
  liste.push({ source: "/blog/categories/:categorie*", destination: "/journal", permanent: true });
  // Articles conservés : même slug, nouveau dossier.
  liste.push({ source: "/blog/:slug", destination: "/journal/:slug", permanent: true });
  return liste;
}
