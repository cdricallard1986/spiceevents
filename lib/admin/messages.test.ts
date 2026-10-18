import { describe, expect, it } from "vitest";
import { RAISONS, messageRaison } from "./messages";

describe("messageRaison", () => {
  it("explique chaque raison connue", () => {
    expect(messageRaison("session_expiree")).toBe(RAISONS.session_expiree);
    expect(messageRaison("deconnecte")).toBe(RAISONS.deconnecte);
    expect(messageRaison("acces_refuse")).toBe("Ce compte n'a pas accès au back office.");
  });

  it("ignore une raison inconnue ou absente", () => {
    expect(messageRaison("nimporte")).toBeNull();
    expect(messageRaison("")).toBeNull();
    expect(messageRaison(undefined)).toBeNull();
    expect(messageRaison(null)).toBeNull();
  });

  it("ne renvoie jamais une propriété héritée (Object.hasOwn)", () => {
    for (const piege of ["toString", "constructor", "__proto__", "hasOwnProperty", "valueOf"]) {
      expect(messageRaison(piege)).toBeNull();
    }
  });

  it("prend la première valeur d'un paramètre répété", () => {
    expect(messageRaison(["deconnecte", "session_expiree"])).toBe(RAISONS.deconnecte);
  });
});
