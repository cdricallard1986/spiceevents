import { describe, expect, it } from "vitest";
import { entetesSecurite, politiqueContenu } from "./entetes";

const valeur = (prod: boolean, cle: string) => entetesSecurite(prod).find((e) => e.key === cle)?.value;

describe("entetesSecurite", () => {
  it("interdit l'affichage du site dans un cadre", () => {
    expect(valeur(true, "X-Frame-Options")).toBe("DENY");
    expect(politiqueContenu(true)).toContain("frame-ancestors 'none'");
  });

  it("n'envoie HSTS qu'en production", () => {
    expect(valeur(true, "Strict-Transport-Security")).toMatch(/max-age=\d+/);
    expect(valeur(false, "Strict-Transport-Security")).toBeUndefined();
  });

  it("ne permet eval qu'en développement", () => {
    expect(politiqueContenu(true)).not.toContain("unsafe-eval");
    expect(politiqueContenu(false)).toContain("unsafe-eval");
  });

  it("ferme les sources par défaut et les objets", () => {
    const csp = politiqueContenu(true);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("protège les URL contenant un jeton et coupe les capteurs", () => {
    expect(valeur(true, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(valeur(true, "Permissions-Policy")).toContain("camera=()");
    expect(valeur(true, "X-Content-Type-Options")).toBe("nosniff");
  });
});
