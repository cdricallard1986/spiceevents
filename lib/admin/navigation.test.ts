import { describe, expect, it } from "vitest";
import { MENU, estActive, sectionDe } from "./navigation";

describe("navigation du back office", () => {
  it("propose les sections prévues au plan, dans l'ordre", () => {
    expect(MENU.map((s) => s.libelle)).toEqual(["Accueil", "Avis", "Journal", "Photos", "Demandes", "Tests", "Emails"]);
    expect(new Set(MENU.map((s) => s.href)).size).toBe(MENU.length);
  });

  it("n'allume l'accueil que sur /admin", () => {
    expect(estActive("/admin", "/admin")).toBe(true);
    expect(estActive("/admin", "/admin/avis")).toBe(false);
    expect(estActive("/admin/avis", "/admin/avis/12")).toBe(true);
    expect(estActive("/admin/avis", "/admin/avisx")).toBe(false);
  });

  it("retrouve une section par son adresse", () => {
    expect(sectionDe("/admin/photos").libelle).toBe("Photos");
    expect(() => sectionDe("/admin/inconnue")).toThrow();
  });
});
