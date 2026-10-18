import { describe, expect, it } from "vitest";
import { MOTIF_CHEMIN_STOCKAGE, TAILLE_MAX_OCTETS, altDepuisNomFichier, cheminEnvoi, dimensionsReduites, estCheminStockage, estTypeImage, formaterTaille } from "./envoi";

describe("cheminEnvoi", () => {
  const le = new Date("2026-10-18T22:15:00.123Z");

  it("range l'envoi par année et mois, avec horodatage et aléa, extension tirée du type MIME", () => {
    expect(cheminEnvoi("image/jpeg", le, "a1b2c3d4e5f6")).toBe(`galeries/2026/10/${le.getTime()}-a1b2c3d4e5f6.jpg`);
    expect(cheminEnvoi("image/webp", le, "a1b2c3d4e5f6").endsWith(".webp")).toBe(true);
    expect(cheminEnvoi("image/avif", le, "a1b2c3d4e5f6").endsWith(".avif")).toBe(true);
  });

  it("produit toujours un chemin accepté par la base (CHECK de la migration 0006)", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"] as const) {
      const chemin = cheminEnvoi(type, le, "ABC-123/../x");
      expect(chemin).toMatch(MOTIF_CHEMIN_STOCKAGE);
      expect(estCheminStockage(chemin)).toBe(true);
    }
  });

  it("refuse un aléa trop court", () => {
    expect(() => cheminEnvoi("image/png", le, "../")).toThrow();
  });
});

describe("estCheminStockage", () => {
  it("n'accepte que les envois du back office", () => {
    expect(estCheminStockage("galeries/2026/10/1-abcdef.jpg")).toBe(true);
    for (const refuse of [
      "/images/hero.jpg",
      "galeries/../secret.jpg",
      "galeries//x.jpg",
      "autre/x.jpg",
      "galeries/x.svg",
      "galeries/x.JPG",
      "galeries/x.jpg?y",
      " galeries/x.jpg",
      "galeries/x.html",
    ]) {
      expect(estCheminStockage(refuse), refuse).toBe(false);
    }
  });
});

describe("types et tailles", () => {
  it("accepte les formats du bucket, et eux seuls", () => {
    expect(["image/jpeg", "image/png", "image/webp", "image/avif"].every(estTypeImage)).toBe(true);
    expect(["image/svg+xml", "image/gif", "text/html", "image/heic", "toString", ""].some(estTypeImage)).toBe(false);
  });

  it("limite à 15 Mo, comme le bucket", () => {
    expect(TAILLE_MAX_OCTETS).toBe(15728640);
    expect(formaterTaille(TAILLE_MAX_OCTETS)).toBe("15 Mo");
    expect(formaterTaille(4.25 * 1024 * 1024)).toBe("4,3 Mo");
    expect(formaterTaille(850 * 1024)).toBe("850 ko");
  });
});

describe("dimensionsReduites", () => {
  it("réduit au plus long côté de 3 000 px, en gardant les proportions", () => {
    expect(dimensionsReduites(6000, 4000)).toEqual({ largeur: 3000, hauteur: 2000 });
    expect(dimensionsReduites(4000, 6000)).toEqual({ largeur: 2000, hauteur: 3000 });
    expect(dimensionsReduites(9000, 3)).toEqual({ largeur: 3000, hauteur: 1 });
  });

  it("ne touche pas une photo déjà assez petite", () => {
    expect(dimensionsReduites(3000, 2000)).toBeNull();
    expect(dimensionsReduites(1200, 800)).toBeNull();
  });
});

describe("altDepuisNomFichier", () => {
  it("propose un texte lisible à partir du nom du fichier", () => {
    expect(altDepuisNomFichier("premiere-danse_chateau.jpg")).toBe("Premiere danse chateau");
    expect(altDepuisNomFichier("Mariés sur la piste.JPEG")).toBe("Mariés sur la piste");
  });

  it("ne propose rien pour un nom d'appareil photo", () => {
    for (const nom of ["IMG_1234.jpg", "DSC01234.JPG", "PXL_20250612_183012345.jpg", "20250612_183012.jpg", "IMG_1234 (2).jpeg", ".jpg"]) {
      expect(altDepuisNomFichier(nom), nom).toBe("");
    }
  });

  it("ne dépasse jamais la limite de la base", () => {
    expect(Array.from(altDepuisNomFichier(`${"a".repeat(400)}.jpg`)).length).toBe(300);
  });
});
