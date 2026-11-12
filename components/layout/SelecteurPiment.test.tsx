import { afterEach, describe, expect, it } from "vitest";
import { appliquerCouleur } from "./SelecteurPiment";

afterEach(() => appliquerCouleur(null));

describe("sélecteur de couleur en forme de piment", () => {
  it("remplace l'accent du site, puis rend le piment d'origine", () => {
    appliquerCouleur("hsl(200 95% 50%)");
    expect(document.documentElement.style.getPropertyValue("--color-or")).toBe("hsl(200 95% 50%)");
    expect(document.documentElement.style.getPropertyValue("--color-or-clair")).toContain("hsl(200 95% 50%)");
    appliquerCouleur(null);
    expect(document.documentElement.style.getPropertyValue("--color-or")).toBe("");
  });
});
