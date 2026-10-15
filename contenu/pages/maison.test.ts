import { describe, expect, it } from "vitest";
import brut from "../avis.generated.json";
import traductions from "../avis.en.json";
import { IMAGES } from "@/lib/images";
import { A_PROPOS } from "./a-propos";
import { FAQ } from "./faq";
import { GALERIE, PHOTOS_EVENEMENTS, PHOTOS_MARIAGES } from "./galerie";
import { CONFIDENTIALITE, MENTIONS_LEGALES } from "./legal";

const EN = traductions as Record<string, { texte: string; role?: string }>;

describe("traduction des avis", () => {
  it("chaque auteur a sa traduction, avec un rôle seulement pour les avis professionnels", () => {
    for (const a of brut as { auteurs: string; role?: string }[]) {
      expect(EN[a.auteurs]?.texte, a.auteurs).toBeTruthy();
      expect(Boolean(EN[a.auteurs].role), a.auteurs).toBe(Boolean(a.role));
    }
  });
});

describe("FAQ", () => {
  it("a les mêmes thèmes et le même nombre de questions en français et en anglais", () => {
    expect(FAQ.en.themes.map((t) => t.id)).toEqual(FAQ.fr.themes.map((t) => t.id));
    FAQ.fr.themes.forEach((t, i) => expect(FAQ.en.themes[i].questions).toHaveLength(t.questions.length));
  });
  it("n'a pas de question en double", () => {
    const toutes = FAQ.fr.themes.flatMap((t) => t.questions.map((q) => q.question));
    expect(new Set(toutes).size).toBe(toutes.length);
  });
});

describe("galerie", () => {
  it("n'utilise que des photos existantes, sans doublon", () => {
    const toutes = [...PHOTOS_MARIAGES, ...PHOTOS_EVENEMENTS];
    for (const cle of toutes) expect(IMAGES[cle], cle).toBeDefined();
    expect(new Set(toutes).size).toBe(toutes.length);
  });
});

describe("métadonnées", () => {
  it("titres et descriptions uniques", () => {
    const seo = (["fr", "en"] as const).flatMap((l) =>
      [A_PROPOS, FAQ, GALERIE, MENTIONS_LEGALES, CONFIDENTIALITE].map((p) => p[l].seo),
    );
    expect(new Set(seo.map((s) => s.titre)).size).toBe(seo.length);
    expect(new Set(seo.map((s) => s.description)).size).toBe(seo.length);
  });
});
