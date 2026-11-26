import { describe, expect, it } from "vitest";
import { SEINE_ET_MARNE } from "./seine-et-marne";
import { planDuSite } from "@/lib/seo/plan";

describe("page Seine-et-Marne", () => {
  it("garde un titre et une description à la longueur affichée par Google", () => {
    expect(SEINE_ET_MARNE.seo.titre.length).toBeLessThanOrEqual(60);
    expect(SEINE_ET_MARNE.seo.description.length).toBeLessThanOrEqual(158);
  });

  it("présente des lieux réels, chacun avec sa commune, et des avis rattachés à un lieu", () => {
    expect(SEINE_ET_MARNE.lieux.liste.length).toBeGreaterThanOrEqual(4);
    for (const l of SEINE_ET_MARNE.lieux.liste) expect(l.commune && l.texte && l.mariages).toBeTruthy();
    for (const a of SEINE_ET_MARNE.avis.liste) expect(a.lieu).toBeTruthy();
  });

  it("n’affiche que des prénoms (règle : pas de nom de famille de client)", () => {
    for (const a of SEINE_ET_MARNE.avis.liste) expect(a.auteurs).toMatch(/^[\p{Lu}][\p{L}-]+( & [\p{Lu}][\p{L}-]+)?$/u);
  });

  it("n’est publiée qu’en français dans le plan du site", () => {
    const urls = planDuSite().map((e) => e.url);
    expect(urls).toContain("https://www.spiceevents.fr/mariages/seine-et-marne");
    expect(urls.some((u) => u.includes("/en/") && u.includes("seine-et-marne"))).toBe(false);
  });
});
