import { describe, expect, it } from "vitest";
import { DUREE_MINIMALE_MS, LIMITE_CONNEXION, debutFenetreConnexion, empreinteTentative, tentativeAutorisee } from "./limite";

describe("empreinteTentative", () => {
  it("produit une empreinte hexadécimale de 64 caractères, sans la valeur en clair", () => {
    const e = empreinteTentative("compte", "cedric@spiceevents.fr", "secret");
    expect(e).toMatch(/^[0-9a-f]{64}$/);
    expect(e).not.toContain("cedric");
  });

  it("est stable, mais dépend du secret et du type", () => {
    expect(empreinteTentative("ip", "203.0.113.7", "s")).toBe(empreinteTentative("ip", "203.0.113.7", "s"));
    expect(empreinteTentative("ip", "203.0.113.7", "s")).not.toBe(empreinteTentative("ip", "203.0.113.7", "t"));
    expect(empreinteTentative("ip", "x", "s")).not.toBe(empreinteTentative("compte", "x", "s"));
  });

  it("refuse un secret vide", () => {
    expect(() => empreinteTentative("ip", "203.0.113.7", "")).toThrow();
  });
});

describe("limites", () => {
  it("compte sur 15 minutes", () => {
    expect(debutFenetreConnexion(Date.parse("2026-10-18T10:00:00Z")).toISOString()).toBe("2026-10-18T09:45:00.000Z");
  });

  it(`accepte ${LIMITE_CONNEXION.parIp} tentatives par IP et ${LIMITE_CONNEXION.parCompte} échecs par compte`, () => {
    expect(tentativeAutorisee(LIMITE_CONNEXION.parIp - 1, LIMITE_CONNEXION.parCompte - 1)).toBe(true);
    expect(tentativeAutorisee(LIMITE_CONNEXION.parIp, 0)).toBe(false);
    expect(tentativeAutorisee(0, LIMITE_CONNEXION.parCompte)).toBe(false);
  });

  it("répond en 1,5 s au minimum", () => {
    expect(DUREE_MINIMALE_MS).toBeGreaterThanOrEqual(1500);
  });
});
