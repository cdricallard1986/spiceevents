import { describe, expect, it } from "vitest";
import { lireConnexion, validerConnexion } from "./schema";

describe("validerConnexion", () => {
  it("normalise l'email (espaces, majuscules)", () => {
    expect(validerConnexion({ email: "  Cedric@SpiceEvents.fr ", motDePasse: "secret" })).toEqual({
      ok: true,
      identifiants: { email: "cedric@spiceevents.fr", motDePasse: "secret" },
    });
  });

  it("garde le mot de passe tel quel (espaces compris)", () => {
    const v = validerConnexion({ email: "a@b.fr", motDePasse: " mot de passe " });
    expect(v.ok && v.identifiants.motDePasse).toBe(" mot de passe ");
  });

  it("signale les champs manquants ou invalides", () => {
    const v = validerConnexion({ email: "pas-un-email", motDePasse: "" });
    expect(v).toEqual({ ok: false, erreurs: { email: "Indiquez une adresse email valide.", motDePasse: "Indiquez votre mot de passe." } });
  });

  it("refuse les saisies démesurées", () => {
    expect(validerConnexion({ email: `${"a".repeat(250)}@b.fr`, motDePasse: "x" }).ok).toBe(false);
    expect(validerConnexion({ email: "a@b.fr", motDePasse: "x".repeat(201) }).ok).toBe(false);
  });

  it("refuse une entrée qui n'est pas un objet", () => {
    expect(validerConnexion(null).ok).toBe(false);
    expect(validerConnexion("a@b.fr").ok).toBe(false);
  });
});

describe("lireConnexion", () => {
  it("ne garde que des chaînes", () => {
    const fd = new FormData();
    fd.set("email", "a@b.fr");
    fd.set("motDePasse", new Blob(["x"]));
    expect(lireConnexion(fd)).toEqual({ email: "a@b.fr", motDePasse: "" });
  });
});
