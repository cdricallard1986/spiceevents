import { describe, expect, it } from "vitest";
import { etatConfiguration, nomEnvironnement } from "./configuration";
import { configEmail } from "@/lib/contact/config-email";

describe("etatConfiguration", () => {
  const env = {
    supabase_service_role_key: "sb_secret_TRES_SECRET",
    resend_api_key: "",
    contact_secret_ip: "secret-ip-123",
    contact_destinataire: "cedric@exemple.fr",
  };
  const lignes = etatConfiguration(env);
  const ligne = (nom: string) => lignes.find((l) => l.nom === nom)!;

  it("ne renvoie jamais la valeur d'un secret, seulement sa présence", () => {
    expect(JSON.stringify(lignes)).not.toContain("TRES_SECRET");
    expect(JSON.stringify(lignes)).not.toContain("secret-ip-123");
    expect(ligne("supabase_service_role_key")).toMatchObject({ secret: true, presente: true, valeur: null });
    expect(ligne("contact_secret_ip")).toMatchObject({ secret: true, presente: true, valeur: null });
  });

  it("une variable vide compte comme absente (comme dans le code qui la lit)", () => {
    expect(ligne("resend_api_key")).toMatchObject({ presente: false, valeur: null });
  });

  it("affiche les adresses, ou la valeur par défaut utilisée", () => {
    expect(ligne("contact_destinataire")).toMatchObject({ presente: true, valeur: "cedric@exemple.fr", parDefaut: false });
    expect(ligne("contact_expediteur")).toMatchObject({ presente: false, valeur: configEmail({}).expediteur, parDefaut: true });
  });

  it("nomme l'environnement", () => {
    expect(nomEnvironnement({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe("preview");
    expect(nomEnvironnement({ NODE_ENV: "development" })).toBe("development");
  });
});

describe("configEmail", () => {
  it("lit les variables et retombe sur les adresses du site", () => {
    expect(configEmail({})).toEqual({ destinataire: "cedric@spiceevents.fr", expediteur: "Spice Events <contact@spiceevents.fr>" });
    expect(configEmail({ contact_destinataire: "a@b.fr", contact_expediteur: "X <x@b.fr>" })).toEqual({ destinataire: "a@b.fr", expediteur: "X <x@b.fr>" });
  });
});
