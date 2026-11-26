import { describe, expect, it } from "vitest";
import type { PageLocale } from "./types";
import { SEINE_ET_MARNE } from "./seine-et-marne";
import { ESSONNE } from "./essonne";
import { CHATEAU_DE_VAUCHELLES } from "./chateau-de-vauchelles";
import { planDuSite } from "@/lib/seo/plan";

const PAGES: [string, PageLocale][] = [
  ["Seine-et-Marne", SEINE_ET_MARNE],
  ["Essonne", ESSONNE],
  ["Vauchelles (fr)", CHATEAU_DE_VAUCHELLES.fr],
  ["Vauchelles (en)", CHATEAU_DE_VAUCHELLES.en],
];

describe.each(PAGES)("page locale %s", (_nom, c) => {
  it("garde un titre et une description à la longueur affichée par Google", () => {
    expect(c.seo.titre.length).toBeLessThanOrEqual(60);
    expect(c.seo.description.length).toBeLessThanOrEqual(158);
    expect(c.seo.description.length).toBeGreaterThanOrEqual(70);
  });

  it("présente des mariages réels et des avis rattachés", () => {
    expect(c.cartes.liste.length).toBeGreaterThanOrEqual(3);
    for (const x of c.cartes.liste) expect(x.surtitre && x.titre && x.detail && x.texte).toBeTruthy();
    expect(c.avis.liste.length).toBeGreaterThanOrEqual(3);
    for (const a of c.avis.liste) expect(a.contexte).toBeTruthy();
  });

  it("n’affiche que des prénoms (règle : pas de nom de famille de client)", () => {
    for (const a of c.avis.liste) expect(a.auteurs).toMatch(/^[\p{Lu}][\p{L}-]+( & [\p{Lu}][\p{L}-]+)?$/u);
  });

  it("ne parle des lieux que pour les mettre en valeur (règle de Cédric)", () => {
    const texte = JSON.stringify(c).toLowerCase();
    for (const mot of ["limiteur", "détecteur", "résonn", "contrainte", "imposé"]) expect(texte).not.toContain(mot);
  });
});

describe("plan du site", () => {
  const urls = planDuSite().map((e) => e.url);
  it("publie Seine-et-Marne et Essonne en français seulement, Vauchelles dans les deux langues", () => {
    expect(urls).toContain("https://www.spiceevents.fr/mariages/seine-et-marne");
    expect(urls).toContain("https://www.spiceevents.fr/mariages/essonne");
    expect(urls.some((u) => u.includes("/en/") && /seine-et-marne|essonne/.test(u))).toBe(false);
    expect(urls).toContain("https://www.spiceevents.fr/mariages/chateau-de-vauchelles");
    expect(urls).toContain("https://www.spiceevents.fr/en/weddings/chateau-de-vauchelles");
  });
});
