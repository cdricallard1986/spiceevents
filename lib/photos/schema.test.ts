import { describe, expect, it } from "vitest";
import { schemaAjoutGalerie, schemaDemandeEnvoi, schemaEchangePhotos, schemaEnregistrement, schemaPhotoDansGalerie, validerChampsPhoto } from "./schema";

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";

describe("validerChampsPhoto", () => {
  it("exige le texte alternatif français, nettoie et met à null les champs vides", () => {
    expect(validerChampsPhoto({ alt_fr: "  Mariés sur la piste ", alt_en: " ", credit: "" })).toEqual({
      ok: true,
      champs: { alt_fr: "Mariés sur la piste", alt_en: null, credit: null },
    });
    const r = validerChampsPhoto({ alt_fr: "   ", alt_en: "x".repeat(301), credit: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erreurs.alt_fr).toMatch(/obligatoire/);
      expect(r.erreurs.alt_en).toMatch(/300 caractères/);
    }
  });

  it("compte les caractères comme Postgres (un émoji = un)", () => {
    expect(validerChampsPhoto({ alt_fr: "🎉".repeat(300), alt_en: "", credit: "" }).ok).toBe(true);
    expect(validerChampsPhoto({ alt_fr: "a", alt_en: "", credit: "c".repeat(201) }).ok).toBe(false);
  });
});

describe("schemaDemandeEnvoi", () => {
  it("n'accepte que les types du bucket et 15 Mo au plus", () => {
    expect(schemaDemandeEnvoi.safeParse({ nomFichier: "a.jpg", type: "image/jpeg", taille: 1000 }).success).toBe(true);
    expect(schemaDemandeEnvoi.safeParse({ nomFichier: "a.svg", type: "image/svg+xml", taille: 1000 }).success).toBe(false);
    expect(schemaDemandeEnvoi.safeParse({ nomFichier: "a.jpg", type: "image/jpeg", taille: 15 * 1024 * 1024 + 1 }).success).toBe(false);
    expect(schemaDemandeEnvoi.safeParse({ nomFichier: "a.jpg", type: "image/jpeg", taille: 0 }).success).toBe(false);
    expect(schemaDemandeEnvoi.safeParse({ nomFichier: "", type: "image/jpeg", taille: 10 }).success).toBe(false);
  });
});

describe("schemaEnregistrement", () => {
  const base = { chemin: "galeries/2026/10/1-abcdef.jpg", largeur: 2400, hauteur: 1600, alt_fr: "Piste", alt_en: "", credit: "" };

  it("accepte un envoi du back office, avec ou sans galerie connue", () => {
    expect(schemaEnregistrement.parse(base)).toMatchObject({ galerie: null, alt_en: null });
    expect(schemaEnregistrement.parse({ ...base, galerie: "option:bar-a-vinyles" }).galerie).toBe("option:bar-a-vinyles");
  });

  it("refuse un chemin hors du dossier des envois, des dimensions absurdes, une galerie inconnue", () => {
    expect(schemaEnregistrement.safeParse({ ...base, chemin: "/images/hero-premiere-danse.jpg" }).success).toBe(false);
    expect(schemaEnregistrement.safeParse({ ...base, chemin: "galeries/../../x.jpg" }).success).toBe(false);
    expect(schemaEnregistrement.safeParse({ ...base, largeur: 0 }).success).toBe(false);
    expect(schemaEnregistrement.safeParse({ ...base, hauteur: 20001 }).success).toBe(false);
    expect(schemaEnregistrement.safeParse({ ...base, largeur: 12.5 }).success).toBe(false);
    expect(schemaEnregistrement.safeParse({ ...base, galerie: "option:inconnue" }).success).toBe(false);
    expect(schemaEnregistrement.safeParse({ ...base, galerie: "accueil" }).success).toBe(false);
  });
});

describe("galeries et ordre", () => {
  it("valide les galeries et les identifiants", () => {
    expect(schemaPhotoDansGalerie.safeParse({ galerie: "galerie_mariages", photoId: ID }).success).toBe(true);
    expect(schemaPhotoDansGalerie.safeParse({ galerie: "galerie_mariages", photoId: "1" }).success).toBe(false);
    expect(schemaAjoutGalerie.parse({ galerie: "galerie_evenements", photoIds: [ID, ID] }).photoIds).toEqual([ID]);
    expect(schemaAjoutGalerie.safeParse({ galerie: "galerie_evenements", photoIds: [] }).success).toBe(false);
  });

  it("une photo ne s'échange pas avec elle-même", () => {
    expect(schemaEchangePhotos.safeParse({ galerie: "galerie_mariages", photoId: ID, avecId: ID, sens: "monter" }).success).toBe(false);
  });
});
