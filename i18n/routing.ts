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
  pathnames: {
    "/": "/",
    "/mariages": { fr: "/mariages", en: "/weddings" },
    "/animations": { fr: "/animations", en: "/entertainment" },
    "/animations/[option]": { fr: "/animations/[option]", en: "/entertainment/[option]" },
    "/evenementiel": { fr: "/evenementiel", en: "/events" },
    "/a-propos": { fr: "/a-propos", en: "/about" },
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

/** Pages publiées seulement en français (le journal et le recrutement). */
export const PAGES_FR_SEULEMENT: readonly Chemin[] = ["/journal", "/journal/[slug]", "/recrutement"];

/** Chemins sans paramètre (utilisables directement dans un lien). */
export type CheminStatique = Exclude<Chemin, `${string}[${string}]${string}`>;
