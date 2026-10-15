import { describe, expect, it, vi } from "vitest";
import { LIMITE, debutFenetre, empreinteIp, ipDepuisEntetes, verifierLimite } from "./limite";

describe("ipDepuisEntetes", () => {
  it("prend la première adresse de x-forwarded-for (le visiteur)", () => {
    expect(ipDepuisEntetes("203.0.113.7, 10.0.0.1, 10.0.0.2")).toBe("203.0.113.7");
    expect(ipDepuisEntetes("  2001:db8::1  ")).toBe("2001:db8::1");
  });

  it("renvoie null sans en-tête exploitable", () => {
    expect(ipDepuisEntetes(null)).toBeNull();
    expect(ipDepuisEntetes("")).toBeNull();
    expect(ipDepuisEntetes(" , ")).toBeNull();
  });

  it("refuse une valeur qui n'a pas l'allure d'une adresse IP", () => {
    expect(ipDepuisEntetes("<script>")).toBeNull();
    expect(ipDepuisEntetes("x".repeat(100))).toBeNull();
  });
});

describe("empreinteIp", () => {
  it("est stable pour une même IP et un même secret", () => {
    expect(empreinteIp("203.0.113.7", "secret")).toBe(empreinteIp("203.0.113.7", "secret"));
  });

  it("ne contient jamais l'IP en clair", () => {
    const e = empreinteIp("203.0.113.7", "secret");
    expect(e).not.toContain("203.0.113.7");
    expect(e).toMatch(/^[0-9a-f]{64}$/);
  });

  it("dépend du secret (HMAC, pas un simple hachage)", () => {
    expect(empreinteIp("203.0.113.7", "secret-a")).not.toBe(empreinteIp("203.0.113.7", "secret-b"));
  });

  it("distingue deux IP", () => {
    expect(empreinteIp("203.0.113.7", "s")).not.toBe(empreinteIp("203.0.113.8", "s"));
  });

  it("refuse un secret vide", () => {
    expect(() => empreinteIp("203.0.113.7", "")).toThrow();
  });
});

describe("debutFenetre", () => {
  it("remonte d'une fenêtre (1 h)", () => {
    expect(debutFenetre(new Date("2026-10-15T10:00:00Z")).toISOString()).toBe("2026-10-15T09:00:00.000Z");
  });
});

describe("verifierLimite", () => {
  it(`autorise jusqu'à ${LIMITE.maximum} demandes par fenêtre`, async () => {
    expect(await verifierLimite(async () => LIMITE.maximum - 1)).toEqual({ autorise: true, degrade: false });
  });

  it("bloque au-delà", async () => {
    expect(await verifierLimite(async () => LIMITE.maximum)).toEqual({ autorise: false, degrade: false });
  });

  it("laisse passer si la base ne répond pas, et le journalise", async () => {
    const journal = vi.fn();
    const r = await verifierLimite(async () => {
      throw new Error("connexion refusée");
    }, journal);
    expect(r).toEqual({ autorise: true, degrade: true });
    expect(journal).toHaveBeenCalledOnce();
  });
});
