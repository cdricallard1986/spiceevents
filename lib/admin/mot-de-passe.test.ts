import { describe, expect, it, vi } from "vitest";
import { traiterChangement } from "./mot-de-passe";

const valide = "Piment!Rouge2026";

describe("changement de mot de passe", () => {
  it("refuse un mot de passe trop faible, sans appeler Supabase", async () => {
    const maj = vi.fn();
    for (const faible of ["court1!A", "sansmajuscule12!", "SANSMINUSCULE12!", "SansChiffre!!!!", "SansSymbole1234"]) {
      const etat = await traiterChangement({ nouveau: faible, confirmation: faible }, maj);
      expect(etat.statut, faible).toBe("erreur");
    }
    expect(maj).not.toHaveBeenCalled();
  });

  it("refuse deux saisies différentes", async () => {
    const etat = await traiterChangement({ nouveau: valide, confirmation: `${valide}x` }, vi.fn());
    expect(etat).toMatchObject({ statut: "erreur", erreurs: { confirmation: expect.any(String) } });
  });

  it("met à jour et signale les refus de Supabase", async () => {
    const maj = vi.fn().mockResolvedValueOnce("ok").mockResolvedValueOnce("identique").mockResolvedValueOnce("refuse");
    expect(await traiterChangement({ nouveau: valide, confirmation: valide }, maj)).toEqual({ statut: "ok" });
    expect(maj).toHaveBeenCalledWith(valide);
    expect((await traiterChangement({ nouveau: valide, confirmation: valide }, maj)).statut).toBe("erreur");
    expect((await traiterChangement({ nouveau: valide, confirmation: valide }, maj)).statut).toBe("erreur");
  });
});

describe("règles cochées pendant la frappe", () => {
  it("coche chaque règle respectée", async () => {
    const { criteresMotDePasse } = await import("./mot-de-passe");
    expect(criteresMotDePasse("").every((c) => !c.ok)).toBe(true);
    expect(criteresMotDePasse("abcD1").map((c) => [c.cle, c.ok])).toEqual([
      ["longueur", false],
      ["minuscule", true],
      ["majuscule", true],
      ["chiffre", true],
      ["symbole", false],
    ]);
    expect(criteresMotDePasse(valide).every((c) => c.ok)).toBe(true);
  });

  it("accord des deux saisies : rien tant que la confirmation est vide", async () => {
    const { accordSaisies } = await import("./mot-de-passe");
    expect(accordSaisies("abc", "")).toBe("vide");
    expect(accordSaisies("abc", "abc")).toBe("identiques");
    expect(accordSaisies("abc", "ab")).toBe("differents");
  });

  it("les règles affichées sont celles du schéma : un mot de passe qui les coche toutes passe", async () => {
    const { criteresMotDePasse, traiterChangement } = await import("./mot-de-passe");
    for (const essai of ["Aa1!aaaaaaaa", "court1!A", "x".repeat(11) + "A1!"]) {
      const toutes = criteresMotDePasse(essai).every((c) => c.ok);
      const r = await traiterChangement({ nouveau: essai, confirmation: essai }, async () => "ok");
      expect(r.statut === "ok", essai).toBe(toutes);
    }
  });
});
