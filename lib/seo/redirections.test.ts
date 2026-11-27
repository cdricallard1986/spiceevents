import { describe, expect, it } from "vitest";
import { OPTIONS } from "@/contenu/options";
import { routing } from "@/i18n/routing";
import { ANCIENNES_OPTIONS, ANCIENNES_PAGES, ARTICLES_RETIRES, DOMAINE_ANGLAIS, OPTIONS_RETIREES, SLUGS_OPTIONS, redirections, redirectionsTraductions } from "./redirections";

/** Chemins internes FR valides, dynamiques résolus avec les vrais slugs d’options. */
const cheminsValides = new Set<string>([
  ...Object.keys(routing.pathnames).filter((c) => !c.includes("[")),
  ...OPTIONS.map((o) => `/animations/${o.slug.fr}`),
]);

// Les 51 adresses d’articles de l’ancien sitemap.
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
      expect(conservee || redirigee, `${a} n’est ni conservée ni redirigée`).toBe(true);
    }
  });

  it("mènent vers des pages qui existent", () => {
    for (const r of liste) {
      if (r.destination.includes(":")) continue; // motifs (/journal/:slug)
      if (r.source in OPTIONS_RETIREES) continue; // vérifiées à part (adresses anglaises)
      if (r.destination.startsWith("/en/")) continue; // fausses traductions : vérifiées à part
      const page = r.destination.split("#")[0];
      expect(cheminsValides.has(page), `${r.source} → ${r.destination}`).toBe(true);
    }
  });

  it("envoient chaque ancienne option vers une option existante", () => {
    const slugs = OPTIONS.map((o) => o.slug.fr);
    for (const slug of Object.values(ANCIENNES_OPTIONS)) expect(slugs).toContain(slug);
  });

  it("envoient chaque option retirée vers la page Animations de sa langue, sans masquer une option existante", () => {
    const animations = routing.pathnames["/animations"];
    expect(OPTIONS_RETIREES).toEqual({
      "/animations/murs-d-eau-et-vegetaux": animations.fr,
      "/en/entertainment/water-and-green-walls": `/en${animations.en}`,
    });
    const existantes = OPTIONS.flatMap((o) => [`/animations/${o.slug.fr}`, `/en/entertainment/${o.slug.en}`]);
    for (const source of Object.keys(OPTIONS_RETIREES)) expect(existantes).not.toContain(source);
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

  it("envoient tout spiceevents.uk vers la version anglaise, avant toute autre règle", () => {
    const [premiere] = liste;
    expect(premiere.has).toEqual([{ type: "host", value: DOMAINE_ANGLAIS.hote }]);
    expect(premiere.destination).toBe("https://www.spiceevents.fr/en/:chemin*");
    const hote = new RegExp(`^${DOMAINE_ANGLAIS.hote}$`);
    for (const h of ["spiceevents.uk", "www.spiceevents.uk"]) expect(hote.test(h)).toBe(true);
    for (const h of ["spiceevents.fr", "www.spiceevents.fr", "spiceevents.vercel.app", "spiceeventsXuk"]) expect(hote.test(h)).toBe(false);
    expect(liste.slice(1).every((r) => !r.has)).toBe(true);
  });

  it("recopient fidèlement les slugs des options", () => {
    expect(SLUGS_OPTIONS).toEqual(OPTIONS.map((o) => [o.slug.fr, o.slug.en]));
  });

  it("rattrapent les fausses traductions relevées en 404 par Google, sans masquer une vraie page", () => {
    const r = Object.fromEntries(redirectionsTraductions().map((x) => [x.source, x.destination]));
    expect(r["/animations/vinyl-bar"]).toBe("/animations/bar-a-vinyles");
    expect(r["/en/entertainment/feux-d-artifice-de-jour"]).toBe("/en/entertainment/daytime-fireworks");
    expect(r["/en/journal/:slug"]).toBe("/journal/:slug");
    expect(r["/en/journal"]).toBe("/journal");
    expect(r["/animations/photobooth"]).toBeUndefined();
    const existantes = OPTIONS.flatMap((o) => [`/animations/${o.slug.fr}`, `/en/entertainment/${o.slug.en}`]);
    for (const destination of Object.values(r)) if (!destination.includes(":") && destination !== "/journal") expect(existantes).toContain(destination);
    for (const source of Object.keys(r)) expect(existantes).not.toContain(source);
  });

  it("envoient les anciennes versions AMP des articles vers l’article, avant la règle générique", async () => {
    // Le même moteur d’adresses que Next (non typé) : on teste la règle telle qu’elle sera lue.
    // @ts-expect-error module interne de Next sans déclaration de types
    const { match } = (await import("next/dist/compiled/path-to-regexp")) as { match: (motif: string) => (adresse: string) => unknown };
    const amp = liste.findIndex((r) => r.source.endsWith("\\.amp"));
    expect(amp).toBeGreaterThanOrEqual(0);
    expect(amp).toBeLessThan(liste.findIndex((r) => r.source === "/blog/:slug"));
    expect(liste[amp].destination).toBe("/journal/:slug");
    expect(match(liste[amp].source)("/blog/livre-d-or-audio.amp")).toMatchObject({ params: { slug: "livre-d-or-audio" } });
    expect(match(liste[amp].source)("/blog/livre-d-or-audio")).toBe(false);
    const retire = Object.keys(ARTICLES_RETIRES)[0];
    expect(liste.find((r) => r.source === `/blog/${retire}.amp`)?.destination).toBe(ARTICLES_RETIRES[retire]);
  });

  it("ne redirigent pas une page vers elle-même", () => {
    for (const [source, destination] of Object.entries(ANCIENNES_PAGES)) expect(source).not.toBe(destination);
  });
});
