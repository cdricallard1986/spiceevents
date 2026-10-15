import { describe, expect, it } from "vitest";
import { planDuSite } from "./plan";

describe("plan du site", () => {
  const plan = planDuSite([{ slug: "un-article", date: "2026-01-01" }]);
  const urls = plan.map((e) => e.url);

  it("liste les pages dans les deux langues avec des adresses traduites", () => {
    expect(urls).toContain("https://www.spiceevents.fr/");
    expect(urls).toContain("https://www.spiceevents.fr/en");
    expect(urls).toContain("https://www.spiceevents.fr/mariages");
    expect(urls).toContain("https://www.spiceevents.fr/en/weddings");
    expect(urls).toContain("https://www.spiceevents.fr/en/entertainment/vinyl-bar");
  });

  it("ne publie le journal et le recrutement qu'en français", () => {
    expect(urls).toContain("https://www.spiceevents.fr/journal/un-article");
    expect(urls.some((u) => u.includes("/en/journal") || u.includes("/en/careers"))).toBe(false);
  });

  it("relie chaque page à son équivalent (hreflang)", () => {
    const mariages = plan.find((e) => e.url.endsWith("/mariages"));
    expect(mariages?.alternates?.languages).toMatchObject({
      fr: "https://www.spiceevents.fr/mariages",
      en: "https://www.spiceevents.fr/en/weddings",
      "x-default": "https://www.spiceevents.fr/mariages",
    });
  });

  it("n'a pas de doublon", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});
