import { OPTIONS } from "@/contenu/options";
import { PAGES_FR_SEULEMENT, routing, type Chemin, type Locale } from "@/i18n/routing";
import { SITE } from "@/contenu/site";
import { adresse } from "./metadonnees";

type Href = Parameters<typeof adresse>[0];

export type EntreePlan = {
  url: string;
  alternates?: { languages: Record<string, string> };
  changeFrequency?: "weekly" | "monthly" | "yearly";
  priority?: number;
  lastModified?: string;
};

/** Pages sans paramètre publiées, par ordre d'importance. */
const PAGES: { chemin: Chemin; priorite: number }[] = [
  { chemin: "/", priorite: 1 },
  { chemin: "/mariages", priorite: 0.95 },
  { chemin: "/contact", priorite: 0.9 },
  { chemin: "/animations", priorite: 0.8 },
  { chemin: "/avis", priorite: 0.8 },
  { chemin: "/evenementiel", priorite: 0.7 },
  { chemin: "/a-propos", priorite: 0.7 },
  { chemin: "/galerie", priorite: 0.6 },
  { chemin: "/faq", priorite: 0.6 },
  { chemin: "/journal", priorite: 0.6 },
  { chemin: "/recrutement", priorite: 0.3 },
  { chemin: "/mentions-legales", priorite: 0.1 },
  { chemin: "/confidentialite", priorite: 0.1 },
];

/** Une entrée par page et par langue, avec ses équivalents (hreflang). */
function entrees(alternatives: Partial<Record<Locale, Href>>, priorite: number, extra: Partial<EntreePlan> = {}): EntreePlan[] {
  const langues: Record<string, string> = {};
  for (const [l, href] of Object.entries(alternatives) as [Locale, Href][]) langues[l] = SITE.url + adresse(href, l);
  if (langues.fr && langues.en) langues["x-default"] = langues.fr;
  return (Object.keys(alternatives) as Locale[]).map((l) => ({
    url: langues[l],
    alternates: Object.keys(langues).length > 1 ? { languages: langues } : undefined,
    priority: l === "fr" ? priorite : Math.round(priorite * 0.9 * 100) / 100,
    changeFrequency: "monthly",
    ...extra,
  }));
}

export function planDuSite(articles: { slug: string; date: string }[] = []): EntreePlan[] {
  const liste: EntreePlan[] = [];
  for (const { chemin, priorite } of PAGES) {
    const langues = PAGES_FR_SEULEMENT.includes(chemin) ? (["fr"] as const) : routing.locales;
    const alt = Object.fromEntries(langues.map((l) => [l, chemin])) as Partial<Record<Locale, Href>>;
    liste.push(...entrees(alt, priorite));
  }
  for (const o of OPTIONS) {
    liste.push(
      ...entrees(
        {
          fr: { pathname: "/animations/[option]", params: { option: o.slug.fr } },
          en: { pathname: "/animations/[option]", params: { option: o.slug.en } },
        },
        0.7,
      ),
    );
  }
  for (const a of articles) {
    liste.push(...entrees({ fr: { pathname: "/journal/[slug]", params: { slug: a.slug } } }, 0.5, { lastModified: a.date, changeFrequency: "yearly" }));
  }
  return liste;
}
