import type { MetadataRoute } from "next";
import { articlesPublies } from "@/lib/journal/lecture";
import { planDuSite } from "@/lib/seo/plan";

// Articles lus à la même source que les pages du journal (base, ou fichiers de secours) :
// un article publié dans le back office entre dans le plan du site à la revalidation « articles ».
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return planDuSite((await articlesPublies()).map(({ slug, date }) => ({ slug, date })));
}
