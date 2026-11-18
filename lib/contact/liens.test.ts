import { describe, expect, it } from "vitest";
import { lienAppel, lienWhatsAppSite } from "./liens";

describe("liens de contact direct", () => {
  it("appel : le numéro international du site", () => {
    expect(lienAppel()).toBe("tel:+33676403776");
  });

  it("WhatsApp : numéro sans « + », message d’ouverture dans la langue de la page", () => {
    const fr = lienWhatsAppSite("fr");
    expect(fr.startsWith("https://wa.me/33676403776?text=")).toBe(true);
    expect(decodeURIComponent(fr.split("text=")[1])).toBe("Bonjour Cédric, je vous écris depuis votre site spiceevents.fr.");
    expect(decodeURIComponent(lienWhatsAppSite("en").split("text=")[1])).toContain("Hello Cédric");
  });
});
