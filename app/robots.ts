import type { MetadataRoute } from "next";
import { SITE } from "@/contenu/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Le back office n'est PAS interdit ici : avec un Disallow, le robot ne lirait jamais son
    // « noindex » (en-tête X-Robots-Tag et balise meta) et pourrait indexer l'adresse quand même.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
