import type { MetadataRoute } from "next";
import { planDuSite } from "@/lib/seo/plan";

export default function sitemap(): MetadataRoute.Sitemap {
  // Les articles du journal sont ajoutés quand le journal est en place.
  return planDuSite([]);
}
