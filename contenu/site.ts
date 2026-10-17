/** Informations de l'entreprise, communes à tout le site. */
export const SITE = {
  nom: "Spice Events",
  url: "https://www.spiceevents.fr",
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
  weddingAwards: [2022, 2024, 2025],
  /** Chiffres tirés des textes de l'ancien site (biographie de Cédric). */
  chiffres: { anneesExperience: 20, evenements: 350 },
} as const;
