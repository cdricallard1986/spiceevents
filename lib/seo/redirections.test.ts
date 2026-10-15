import { describe, expect, it } from "vitest";
import { OPTIONS } from "@/contenu/options";
import { routing } from "@/i18n/routing";
import { ANCIENNES_OPTIONS, ANCIENNES_PAGES, ARTICLES_RETIRES, redirections } from "./redirections";

/** Chemins internes FR valides, dynamiques résolus avec les vrais slugs d'options. */
const cheminsValides = new Set<string>([
  ...Object.keys(routing.pathnames).filter((c) => !c.includes("[")),
  ...OPTIONS.map((o) => `/animations/${o.slug.fr}`),
]);

// Les 51 adresses d'articles de l'ancien sitemap.
const ANCIENS_ARTICLES_RETIRES = 14;

describe("redirections 301", () => {
  const liste = redirections();

  it("sont toutes permanentes et sans doublon de source", () => {
    expect(liste.every((r) => r.permanent)).toBe(true);
    const sources = liste.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("couvrent toutes les anciennes pages Strikingly", () => {
    const anciennes = [
      "/accueil", "/faq", "/contactez-nous", "/pourquoi-nous-choisir", "/test", "/accompagnement", "/evenementiel",
      "/blog", "/booking-dj", "/mariages", "/galerie-photo-mariage", "/galerie-photo-evenementiel", "/temoignages",
      "/animations-tendances", "/bar-a-vinyles", "/photobooth", "/livre-d-or-audio", "/ouverture-de-bal-spectaculaire",
      "/guirlandes-lumineuses", "/performances-techniques-son-and-lumieres", "/cedric-allard", "/mur-d-eau-and-vegetal",
      "/on-recrute", "/sonorisation-deportee", "/sonorisation-ceremonie-laique",
    ];
    for (const a of anciennes) {
      const conservee = cheminsValides.has(a);
      const redirigee = liste.some((r) => r.source === a);
      expect(conservee || redirigee, `${a} n'est ni conservée ni redirigée`).toBe(true);
    }
  });

  it("mènent vers des pages qui existent", () => {
    for (const r of liste) {
      if (r.destination.includes(":")) continue; // motifs (/journal/:slug)
      expect(cheminsValides.has(r.destination), `${r.source} → ${r.destination}`).toBe(true);
    }
  });

  it("envoient chaque ancienne option vers une option existante", () => {
    const slugs = OPTIONS.map((o) => o.slug.fr);
    for (const slug of Object.values(ANCIENNES_OPTIONS)) expect(slugs).toContain(slug);
    expect(Object.keys(ANCIENNES_OPTIONS)).toHaveLength(OPTIONS.length);
  });

  it("traitent les articles retirés avant la règle générique du blog", () => {
    expect(Object.keys(ARTICLES_RETIRES)).toHaveLength(ANCIENS_ARTICLES_RETIRES);
    const generique = liste.findIndex((r) => r.source === "/blog/:slug");
    expect(generique).toBe(liste.length - 1);
    for (const slug of Object.keys(ARTICLES_RETIRES)) {
      const i = liste.findIndex((r) => r.source === `/blog/${slug}`);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(generique);
    }
  });

  it("ne redirigent pas une page vers elle-même", () => {
    for (const [source, destination] of Object.entries(ANCIENNES_PAGES)) expect(source).not.toBe(destination);
  });
});
