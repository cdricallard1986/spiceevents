import { afterEach, describe, expect, it } from "vitest";
import { appliquerCouleur, couleurAuPoint } from "./SelecteurPiment";

afterEach(() => appliquerCouleur(null));

describe("sélecteur de couleur en forme de piment", () => {
  it("la teinte suit la hauteur du piment, la clarté reste lisible", () => {
    expect(couleurAuPoint(12, 7)).toMatch(/^hsl\(0 95% \d+%\)$/);
    expect(couleurAuPoint(12, 27)).toMatch(/^hsl\(180 95% \d+%\)$/);
    for (const x of [0, 5, 12, 19, 24]) {
      const clarte = Number(/(\d+)%\)$/.exec(couleurAuPoint(x, 20))![1]);
      expect(clarte).toBeGreaterThanOrEqual(35);
      expect(clarte).toBeLessThanOrEqual(70);
    }
  });

  it("remplace l'accent du site, puis rend le piment d'origine", () => {
    appliquerCouleur("hsl(200 95% 50%)");
    expect(document.documentElement.style.getPropertyValue("--color-or")).toBe("hsl(200 95% 50%)");
    expect(document.documentElement.style.getPropertyValue("--color-or-clair")).toContain("hsl(200 95% 50%)");
    appliquerCouleur(null);
    expect(document.documentElement.style.getPropertyValue("--color-or")).toBe("");
  });
});
