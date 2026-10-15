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
  /** Distinctions réelles (badges Mariages.net présents sur l'ancien site). */
  weddingAwards: [2022, 2024, 2025],
  /** Chiffres tirés des textes de l'ancien site (biographie de Cédric). */
  chiffres: { anneesExperience: 20, evenements: 350 },
} as const;
