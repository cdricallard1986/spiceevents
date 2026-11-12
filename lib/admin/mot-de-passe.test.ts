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
