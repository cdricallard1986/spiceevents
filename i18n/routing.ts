import { defineRouting } from "next-intl/routing";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

/**
 * Français à la racine (`/mariages`), anglais sous `/en` avec des adresses
 * traduites (`/en/weddings`). Les clés sont les chemins internes (français).
 */
export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
  localePrefix: "as-needed",
  // Pas d’en-tête HTTP « Link » de traductions : next-intl y garde le slug de la
  // page d’origine (/en/entertainment/feux-d-artifice-de-jour, /en/journal/…),
  // des adresses qui n’existent pas et que Google a relevées en 404 (nov. 2026).
  // Les vraies traductions sont déclarées par chaque page (balises hreflang).
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/mariages": { fr: "/mariages", en: "/weddings" },
    "/mariages/seine-et-marne": "/mariages/seine-et-marne",
    "/mariages/essonne": "/mariages/essonne",
    "/mariages/chateau-de-vauchelles": { fr: "/mariages/chateau-de-vauchelles", en: "/weddings/chateau-de-vauchelles" },
    "/animations": { fr: "/animations", en: "/entertainment" },
    "/animations/[option]": { fr: "/animations/[option]", en: "/entertainment/[option]" },
    "/evenementiel": { fr: "/evenementiel", en: "/events" },
    "/son-et-lumiere": { fr: "/son-et-lumiere", en: "/sound-and-lighting" },
    "/a-propos": { fr: "/a-propos", en: "/about" },
    "/nos-dj": { fr: "/nos-dj", en: "/our-djs" },
    "/avis": { fr: "/avis", en: "/reviews" },
    "/galerie": { fr: "/galerie", en: "/gallery" },
    "/faq": "/faq",
    "/contact": "/contact",
    "/journal": "/journal",
    "/journal/[slug]": "/journal/[slug]",
    "/recrutement": { fr: "/recrutement", en: "/careers" },
    "/mentions-legales": { fr: "/mentions-legales", en: "/legal-notice" },
    "/confidentialite": { fr: "/confidentialite", en: "/privacy" },
  },
});

export type Chemin = keyof typeof routing.pathnames;

/** Pages publiées seulement en français (journal, recrutement, pages locales des départements). */
export const PAGES_FR_SEULEMENT: readonly Chemin[] = ["/journal", "/journal/[slug]", "/recrutement", "/mariages/seine-et-marne", "/mariages/essonne"];

/** Chemins sans paramètre (utilisables directement dans un lien). */
export type CheminStatique = Exclude<Chemin, `${string}[${string}]${string}`>;
