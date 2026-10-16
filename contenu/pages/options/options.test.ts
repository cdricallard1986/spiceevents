import { describe, expect, it } from "vitest";
import { OPTIONS } from "@/contenu/options";
import { avis } from "@/contenu/avis";
import { ANIMATIONS } from "@/contenu/pages/animations";
import { EVENEMENTIEL } from "@/contenu/pages/evenementiel";
import { MARIAGES } from "@/contenu/pages/mariages";
import { CONTENUS_OPTIONS } from "./index";

describe("pages d'option", () => {
  it("chaque option a son contenu, et inversement", () => {
    expect(Object.keys(CONTENUS_OPTIONS).sort()).toEqual(OPTIONS.map((o) => o.slug.fr).sort());
  });

  it("chaque galerie est vide (masquée) ou compte 2 à 6 photos distinctes", () => {
    for (const [slug, c] of Object.entries(CONTENUS_OPTIONS)) {
      expect(c.galerie.length === 0 || c.galerie.length >= 2, slug).toBe(true);
      expect(c.galerie.length, slug).toBeLessThanOrEqual(6);
      expect(new Set(c.galerie).size, slug).toBe(c.galerie.length);
    }
  });

  it("les avis cités existent, et la phrase de départ s'y trouve dans chaque langue renseignée", () => {
    for (const [slug, c] of Object.entries(CONTENUS_OPTIONS)) {
      if (!c.avis) continue;
      const { auteurs, depuis } = c.avis;
      if (depuis) expect(depuis.fr, slug).toBeTruthy();
      for (const l of ["fr", "en"] as const) {
        if (depuis && !depuis[l]) continue;
        const trouves = avis(l, "mariage").filter((a) => a.auteurs === auteurs && (!depuis || a.texte.includes(depuis[l]!)));
        expect(trouves.length, `${slug} (${l})`).toBeGreaterThan(0);
      }
    }
  });

  it("les slugs sont uniques dans chaque langue", () => {
    for (const l of ["fr", "en"] as const) {
      const slugs = OPTIONS.map((o) => o.slug[l]);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("référencement des pages prestations", () => {
  const seos = [
    ...(["fr", "en"] as const).flatMap((l) => [MARIAGES[l].seo, ANIMATIONS[l].seo, EVENEMENTIEL[l].seo]),
    ...Object.values(CONTENUS_OPTIONS).flatMap((c) => [c.textes.fr.seo, c.textes.en.seo]),
  ];

  it("titres et descriptions uniques", () => {
    expect(new Set(seos.map((s) => s.titre)).size).toBe(seos.length);
    expect(new Set(seos.map((s) => s.description)).size).toBe(seos.length);
  });

  it("descriptions de longueur raisonnable pour Google (≤ 200 caractères)", () => {
    for (const s of seos) expect(s.description.length, s.titre).toBeLessThanOrEqual(200);
  });

  it("les moments de la journée pointent vers des options existantes", () => {
    for (const l of ["fr", "en"] as const) {
      for (const m of MARIAGES[l].journee.moments) {
        for (const slug of m.options) expect(OPTIONS.some((o) => o.slug.fr === slug), slug).toBe(true);
      }
    }
  });
});
