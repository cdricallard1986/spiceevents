import { describe, expect, it } from "vitest";
import { lignesDeRepli } from "./repli";
import { estSlugValide, slugDepuisTitre, slugLibre } from "./slug";

describe("slugDepuisTitre", () => {
  it("retire accents et majuscules, remplace espaces, apostrophes et ponctuation par un tiret", () => {
    expect(slugDepuisTitre("Comment choisir l’ambiance musicale de votre mariage ?")).toBe("comment-choisir-l-ambiance-musicale-de-votre-mariage");
    expect(slugDepuisTitre("S'offrir un mariage 100 % responsable")).toBe("s-offrir-un-mariage-100-responsable");
    expect(slugDepuisTitre("Mariage de C&N au château de Sauvebœuf")).toBe("mariage-de-c-n-au-chateau-de-sauveboeuf");
    expect(slugDepuisTitre("  Été, Noël & « fêtes » — à Paris !  ")).toBe("ete-noel-fetes-a-paris");
    expect(slugDepuisTitre("Ex æquo, Straße")).toBe("ex-aequo-strasse");
  });

  it("rend une chaîne vide sans lettre ni chiffre", () => {
    expect(slugDepuisTitre("")).toBe("");
    expect(slugDepuisTitre(" ?! … ")).toBe("");
  });

  it("coupe à 120 caractères, entre deux mots quand c'est possible", () => {
    const titre = Array(40).fill("musique").join(" "); // 319 caractères
    const slug = slugDepuisTitre(titre);
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(slug).toBe(Array(15).fill("musique").join("-")); // 119 caractères : « musique » n'est pas coupé
    expect(estSlugValide(slug)).toBe(true);
    expect(slugDepuisTitre("a".repeat(130))).toBe("a".repeat(120));
    // La coupe tombe juste avant un tiret : le mot entier est gardé.
    expect(slugDepuisTitre(`${"a".repeat(120)} b`)).toBe("a".repeat(120));
  });

  it("produit toujours une adresse acceptée par la table", () => {
    for (const titre of ["Un titre", "L’été 2026 : 10 idées", "---", "Ça marche ?", "Œuvre"]) {
      const slug = slugDepuisTitre(titre);
      if (slug) expect(estSlugValide(slug), titre).toBe(true);
    }
  });
});

describe("estSlugValide", () => {
  it("suit la contrainte de la table", () => {
    expect(estSlugValide("se-marier-en-hiver")).toBe(true);
    expect(estSlugValide("a".repeat(120))).toBe(true);
    for (const s of ["", "a".repeat(121), "Se-marier", "se--marier", "-se", "se-", "se marier", "été", "se_marier", "../x"]) expect(estSlugValide(s), s).toBe(false);
  });

  it("accepte les adresses des 37 articles importés", () => {
    for (const l of lignesDeRepli()) expect(estSlugValide(l.slug), l.slug).toBe(true);
  });
});

describe("slugLibre", () => {
  it("ajoute -2, -3… si l'adresse est prise, sans dépasser 120 caractères", () => {
    expect(slugLibre("hiver", new Set())).toBe("hiver");
    expect(slugLibre("hiver", new Set(["hiver"]))).toBe("hiver-2");
    expect(slugLibre("hiver", new Set(["hiver", "hiver-2"]))).toBe("hiver-3");
    const long = Array(15).fill("musique").join("-");
    const libre = slugLibre(long, new Set([long]));
    expect(libre).toBe(`${Array(14).fill("musique").join("-")}-2`);
    expect(estSlugValide(libre)).toBe(true);
  });
});
