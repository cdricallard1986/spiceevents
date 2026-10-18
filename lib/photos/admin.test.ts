import { describe, expect, it } from "vitest";
import { estSupprimable, galeriesDeLaPhoto, messageMinimum, nomPhoto, photosHorsGalerie, sousLeMinimum } from "./admin";
import type { Photo } from "./types";

const photo = (id: string, origine: Photo["origine"] = "stockage"): Photo => ({
  id,
  origine,
  chemin: origine === "site" ? `/images/${id}.jpg` : `galeries/${id}.jpg`,
  largeur: 10,
  hauteur: 10,
  alt_fr: `Photo ${id}`,
  alt_en: null,
  credit: null,
});

const LIAISONS = [
  { galerie: "galerie_mariages", photo_id: "a", ordre: 10 },
  { galerie: "option:bar-a-vinyles", photo_id: "a", ordre: 10 },
  { galerie: "galerie_mariages", photo_id: "b", ordre: 20 },
];

describe("photothèque", () => {
  it("compte les galeries d'une photo", () => {
    expect(galeriesDeLaPhoto(LIAISONS, "a")).toEqual(["galerie_mariages", "option:bar-a-vinyles"]);
    expect(galeriesDeLaPhoto(LIAISONS, "c")).toEqual([]);
  });

  it("propose à l'ajout les seules photos absentes de la galerie", () => {
    expect(photosHorsGalerie([photo("a"), photo("b"), photo("c")], LIAISONS, "galerie_mariages").map((p) => p.id)).toEqual(["c"]);
    expect(photosHorsGalerie([photo("a"), photo("b")], LIAISONS, "option:bar-a-vinyles").map((p) => p.id)).toEqual(["b"]);
  });

  it("seule une photo envoyée se supprime ; un fichier du site, jamais", () => {
    expect(estSupprimable(photo("a"))).toBe(true);
    expect(estSupprimable(photo("a", "site"))).toBe(false);
  });

  it("nomme une photo par le début de son texte alternatif", () => {
    expect(nomPhoto({ alt_fr: "Court" })).toBe("Court");
    expect(nomPhoto({ alt_fr: "x".repeat(80) }, 20)).toHaveLength(20);
  });
});

describe("minimum des pages d'animations", () => {
  it("une galerie d'option sous 2 photos ne s'affiche pas ; la page Galerie n'a pas de minimum", () => {
    expect(sousLeMinimum("option:bar-a-vinyles", 1)).toBe(true);
    expect(sousLeMinimum("option:bar-a-vinyles", 0)).toBe(true);
    expect(sousLeMinimum("option:bar-a-vinyles", 2)).toBe(false);
    expect(sousLeMinimum("galerie_mariages", 0)).toBe(false);
  });

  it("le dit clairement", () => {
    expect(messageMinimum("option:bar-a-vinyles", 1)).toBe(
      "Page Bar à vinyles : 1 photo. Il en faut au moins 2 — en attendant, la galerie ne s'affichera pas sur la page.",
    );
    expect(messageMinimum("option:photobooth", 0)).toContain("aucune photo");
  });
});
