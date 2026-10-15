import type { MetadataRoute } from "next";
import { articles } from "@/lib/journal/articles";
import { planDuSite } from "@/lib/seo/plan";

export default function sitemap(): MetadataRoute.Sitemap {
  return planDuSite(articles().map(({ slug, date }) => ({ slug, date })));
}
