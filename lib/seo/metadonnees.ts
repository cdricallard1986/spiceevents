import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { PAGES_FR_SEULEMENT, routing, type Chemin, type Locale } from "@/i18n/routing";
import { SITE } from "@/contenu/site";
import type { Seo } from "@/contenu/types";
import { IMAGES, type CleImage } from "@/lib/images";

type Href = Parameters<typeof getPathname>[0]["href"];

/** Adresse publique d'une page dans une langue (avec `/en` pour l'anglais). */
export function adresse(href: Href, locale: Locale): string {
  return getPathname({ href, locale });
}

type Options = {
  locale: Locale;
  href: Href;
  seo: Seo;
  image?: CleImage;
  /** Équivalents de la page dans chaque langue, si les paramètres diffèrent (slug traduit). */
  alternatives?: Partial<Record<Locale, Href>>;
  type?: "website" | "article";
};

/**
 * Métadonnées d'une page : titre, description, adresse canonique, équivalents
 * linguistiques (hreflang, lus aussi par le sélecteur de langue), partage.
 */
export function metadonnees({ locale, href, seo, image, alternatives, type = "website" }: Options): Metadata {
  const chemin = (typeof href === "string" ? href : href.pathname) as Chemin;
  const frSeulement = PAGES_FR_SEULEMENT.includes(chemin);
  const langues: Record<string, string> = {};
  for (const l of routing.locales) {
    if (frSeulement && l !== "fr") continue;
    langues[l] = adresse(alternatives?.[l] ?? href, l);
  }
  if (!frSeulement) langues["x-default"] = langues.fr;

  const visuel = image ? IMAGES[image] : IMAGES["hero-premiere-danse"];
  return {
    title: seo.titre,
    description: seo.description,
    alternates: { canonical: adresse(href, locale), languages: langues },
    openGraph: {
      type,
      siteName: SITE.nom,
      locale: locale === "fr" ? "fr_FR" : "en_GB",
      title: seo.titre,
      description: seo.description,
      url: adresse(href, locale),
      images: [{ url: visuel.src, width: visuel.width, height: visuel.height, alt: visuel.alt[locale] }],
    },
    twitter: { card: "summary_large_image", title: seo.titre, description: seo.description },
  };
}
