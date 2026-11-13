/** Informations de l'entreprise, communes à tout le site. */
export const SITE = {
  nom: "Spice Events",
  url: "https://www.spiceevents.fr",
  /**
   * Logo des emails (lettres claires, 600 × 349) : adresse absolue sur le domaine
   * Vercel du site, en ligne dès aujourd'hui et qui le reste après la bascule de
   * www.spiceevents.fr (encore sur Strikingly en novembre 2026).
   */
  logoEmail: "https://spiceevents.vercel.app/marque/logo-spice-clair.png",
  telephone: "+33676403776",
  telephoneAffiche: "06 76 40 37 76",
  email: "cedric@spiceevents.fr",
  fondateur: "Cédric Allard",
  zone: { fr: "Île-de-France", en: "Paris & Île-de-France" },
  reseaux: {
    instagram: "https://www.instagram.com/_spiceevents",
    facebook: "https://www.facebook.com/spiceevents",
    youtube: "https://www.youtube.com/user/MrSpiceEvents",
    mariagesNet: "https://www.mariages.net/shared/rate/127122",
  },
  partenaireTechnique: { nom: "MX Événement", url: "https://mxevenement.com" },
  /** Spice Events est un nom commercial de la société MX ÉVÉNEMENT (informations fournies par Cédric). */
  societe: {
    raisonSociale: "MX ÉVÉNEMENT",
    forme: "SAS",
    capital: "21 600 €" as string | null,
    adresse: {
      ligne1: "ZAC du Clos Saint-Éloi, bâtiment C1",
      rue: "1 rue de la Persévérance",
      codePostal: "77144",
      ville: "Chalifert",
      pays: "France",
    },
    siren: "530 672 666",
    siret: "530 672 666 00043",
    tva: "FR78530672666",
    ape: "9002Z",
  },
  /** Distinctions réelles (badges Mariages.net présents sur l'ancien site). */
  weddingAwards: [2022, 2024, 2025, 2026],
  /** Note et nombre d'avis sur Mariages.net (donnés par Cédric le 12/11/2026, à mettre à jour à la main). */
  avisMariagesNet: { note: 4.9, nombre: 72, url: "https://www.mariages.net/musique-mariage/spice-events--e127122/avis" },
  /** Plateforme de préparation des mariages conçue par Spice Events (espace mariés, agence, DJ, technicien). */
  nuvio: "https://nuvio.disco-very.com/",
  /** Chiffres tirés des textes de l'ancien site (biographie de Cédric). */
  chiffres: { anneesExperience: 20, evenements: 600 },
} as const;
