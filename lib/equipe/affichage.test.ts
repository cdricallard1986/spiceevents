import { describe, expect, it } from "vitest";
import { EQUIPE_INITIALE } from "@/contenu/equipe";
import { carteEquipe, paragraphes } from "./affichage";

const PANS = EQUIPE_INITIALE.find((m) => m.nom === "DJ Pan's")!;
const KEVIN = EQUIPE_INITIALE.find((m) => m.nom === "Kevin R.")!;
const ANGEL = EQUIPE_INITIALE.find((m) => m.nom === "Angel")!;

describe("carte d’un membre sur la page Nos DJ", () => {
  it("français : textes, paragraphes, avis, lien, photo du site avec son cadrage", () => {
    const c = carteEquipe(PANS, "fr");
    expect(c).toMatchObject({ nom: "DJ Pan’s", alias: "Aurélien", role: "DJ, avec guitariste", accroche: "Let’s rock\u202F!", lien: { href: "https://www.facebook.com/djpans", libelle: "Sa page Facebook" } });
    expect(c.paragraphes).toHaveLength(2);
    expect(c.avis?.auteur).toBe("Juliette, mariage de septembre 2022");
    expect(c.photo).toEqual({ src: "/images/dj-pans.jpg", width: 1200, height: 1800, alt: "DJ Pan’s, DJ, avec guitariste de l’équipe Spice Events" });
    expect(c.cadrage).toBe("50% 30%");
  });

  it("anglais : champ anglais vide = texte français", () => {
    const c = carteEquipe(KEVIN, "en");
    expect(c.role).toBe("DJ");
    expect(c.lieux).toBe(KEVIN.lieux_fr);
    expect(c.styles).toEqual(["Electro", "Funk", "French Touch"]);
    expect(c.accroche).toBe("Born in 1992, he has grown up surrounded by music.");
  });

  it("sans photo : pas de photo ni de cadrage (monogramme sur la page)", () => {
    const c = carteEquipe(ANGEL, "fr");
    expect(c.photo).toBeUndefined();
    expect(c.cadrage).toBeUndefined();
  });

  it("photo envoyée : URL publique du bucket", () => {
    const c = carteEquipe({ ...ANGEL, photo_chemin: "equipe/2026/11/1-abcdef.jpg", photo_largeur: 800, photo_hauteur: 1000 }, "fr");
    expect(c.photo?.src).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/medias\/equipe\/2026\/11\/1-abcdef\.jpg$/);
  });

  it("liste blanche : aucun champ interne (ordre, publication, autres langues) ne sort", () => {
    const c = carteEquipe(KEVIN, "fr");
    expect(Object.keys(c).sort()).toEqual(["accroche", "cadrage", "groupe", "id", "lien", "lieux", "nom", "paragraphes", "photo", "role", "styles"]);
    expect(JSON.stringify(c)).not.toContain(KEVIN.accroche_en!);
  });

  it("paragraphes séparés par une ligne vide ; un simple retour à la ligne reste dans le paragraphe", () => {
    expect(paragraphes("Un\ndeux.\n\n\nTrois.")).toEqual(["Un deux.", "Trois."]);
  });
});
