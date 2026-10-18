import type { MetadataRoute } from "next";
import { SITE } from "@/contenu/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Le back office n'a rien à faire dans un moteur de recherche (ses pages sont aussi en noindex).
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
