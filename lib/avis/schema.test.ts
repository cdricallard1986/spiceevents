import { describe, expect, it } from "vitest";
import { LIMITES_AVIS } from "./constantes";
import { FORMULAIRE_VIDE, formulaireDepuisAvis, normaliserLien, premiereErreur, schemaEchange, schemaIdAvis, schemaPublication, validerChampsAvis, type FormulaireAvis } from "./schema";
import type { Avis } from "./types";

const valide: FormulaireAvis = { ...FORMULAIRE_VIDE, auteurs: "  Pierre & Nina ", texte_fr: "Merci pour tout !" };

function erreurs(champs: Partial<FormulaireAvis> | Record<string, unknown>) {
  const r = validerChampsAvis({ ...valide, ...champs });
  return r.ok ? {} : r.erreurs;
}

describe("validation d'un avis", () => {
  it("accepte une fiche minimale : espaces retirés, champs vides → null, emplacements dédoublonnés", () => {
    const r = validerChampsAvis({ ...valide, role_en: "   ", emplacements: ["accueil", "accueil", "option:photobooth"] });
    expect(r).toEqual({
      ok: true,
      champs: {
        auteurs: "Pierre & Nina",
        role_fr: null,
        role_en: null,
        categorie: "mariage",
        texte_fr: "Merci pour tout !",
        texte_en: null,
        citation_fr: null,
        citation_en: null,
        source: "site",
        date_avis: null,
        lien_source: null,
        emplacements: ["accueil", "option:photobooth"],
      },
    });
  });

  it("exige les auteurs et le texte français", () => {
    expect(erreurs({ auteurs: "  " }).auteurs).toBe("Indiquez les auteurs de l'avis.");
    expect(erreurs({ texte_fr: "" }).texte_fr).toBe("Le texte français de l'avis est obligatoire.");
    expect(erreurs({ auteurs: undefined }).auteurs).toBe("Indiquez les auteurs de l'avis.");
  });

  it("applique les longueurs de la base, en caractères (un émoji compte pour un)", () => {
    expect(erreurs({ auteurs: "a".repeat(LIMITES_AVIS.auteurs) }).auteurs).toBeUndefined();
    expect(erreurs({ auteurs: "a".repeat(LIMITES_AVIS.auteurs + 1) }).auteurs).toContain("120 caractères au maximum");
    expect(erreurs({ role_fr: "a".repeat(121) }).role_fr).toContain("Rôle (français)");
    expect(erreurs({ role_en: "a".repeat(121) }).role_en).toContain("Rôle (anglais)");
    expect(erreurs({ texte_fr: "a".repeat(5001) }).texte_fr).toContain("5000");
    expect(erreurs({ texte_en: "a".repeat(5001) }).texte_en).toContain("5000");
    expect(erreurs({ citation_fr: "a".repeat(601) }).citation_fr).toContain("600");
    expect(erreurs({ citation_en: "a".repeat(601) }).citation_en).toContain("600");
    expect(erreurs({ citation_fr: "🎉".repeat(600) }).citation_fr).toBeUndefined();
  });

  it("n'accepte que les catégories et sources de la base", () => {
    expect(erreurs({ categorie: "anniversaire" }).categorie).toBeDefined();
    expect(erreurs({ source: "facebook" }).source).toBeDefined();
    for (const source of ["site", "mariages_net", "google", "autre"]) expect(erreurs({ source }).source).toBeUndefined();
    expect(erreurs({ categorie: "evenement" }).categorie).toBeUndefined();
  });

  it("date : vide ou une vraie date AAAA-MM-JJ", () => {
    expect(validerChampsAvis({ ...valide, date_avis: "2025-06-14" })).toMatchObject({ ok: true, champs: { date_avis: "2025-06-14" } });
    expect(erreurs({ date_avis: "2025-02-30" }).date_avis).toBe("Date invalide.");
    expect(erreurs({ date_avis: "14/06/2025" }).date_avis).toBe("Date invalide.");
  });

  it("emplacements : seulement ceux du site (une option inexistante est refusée)", () => {
    expect(erreurs({ emplacements: ["option:inconnue"] }).emplacements).toContain("option:inconnue");
    expect(erreurs({ emplacements: ["pied_de_page"] }).emplacements).toBeDefined();
    expect(erreurs({ emplacements: "accueil" }).emplacements).toBeDefined();
    expect(erreurs({ emplacements: ["accueil_grand", "mariages_grand", "option:sonorisation-deportee"] }).emplacements).toBeUndefined();
  });

  it("refuse une entrée qui n'est pas une fiche", () => {
    expect(validerChampsAvis(null)).toMatchObject({ ok: false });
    expect(validerChampsAvis("texte")).toMatchObject({ ok: false });
  });

  it("premier message d'erreur, pour le toast", () => {
    expect(premiereErreur({ texte_fr: "A", auteurs: "B" })).toBe("A");
    expect(premiereErreur({})).toBe("Fiche invalide.");
  });
});

describe("lien vers l'avis d'origine", () => {
  it("vide → aucun lien", () => {
    expect(normaliserLien("  ")).toEqual({ ok: true, lien: null });
  });

  it("garde une adresse https, complète un domaine saisi sans schéma", () => {
    expect(normaliserLien(" https://www.mariages.net/avis/123 ")).toEqual({ ok: true, lien: "https://www.mariages.net/avis/123" });
    expect(normaliserLien("HTTPS://g.page/r/abc")).toEqual({ ok: true, lien: "https://g.page/r/abc" });
    expect(normaliserLien("www.mariages.net/avis")).toEqual({ ok: true, lien: "https://www.mariages.net/avis" });
    expect(normaliserLien("//exemple.fr/a")).toEqual({ ok: true, lien: "https://exemple.fr/a" });
    expect(normaliserLien("exemple.fr:8443/a")).toEqual({ ok: true, lien: "https://exemple.fr:8443/a" });
  });

  it("refuse http et tout autre schéma (javascript:, data:, mailto:…)", () => {
    expect(normaliserLien("http://exemple.fr")).toMatchObject({ ok: false });
    for (const lien of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "mailto:a@b.fr", "ftp://exemple.fr"]) {
      expect(normaliserLien(lien), lien).toMatchObject({ ok: false, message: "Lien refusé : seules les adresses https:// sont acceptées." });
    }
  });

  it("refuse une adresse avec espace, sans domaine ou trop longue", () => {
    expect(normaliserLien("https://exemple.fr/a b")).toMatchObject({ ok: false });
    expect(normaliserLien("localhost")).toMatchObject({ ok: false });
    expect(normaliserLien(`https://exemple.fr/${"a".repeat(500)}`)).toMatchObject({ ok: false, message: expect.stringContaining("trop long") });
  });

  it("le schéma de l'avis applique ces règles", () => {
    expect(validerChampsAvis({ ...valide, lien_source: "www.google.com/maps" })).toMatchObject({ ok: true, champs: { lien_source: "https://www.google.com/maps" } });
    expect(erreurs({ lien_source: "javascript:alert(1)" }).lien_source).toContain("https://");
  });
});

describe("autres entrées des Server Actions", () => {
  const id = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";

  it("identifiant : un uuid seulement", () => {
    expect(schemaIdAvis.safeParse(id).success).toBe(true);
    expect(schemaIdAvis.safeParse("1 or 1=1").success).toBe(false);
    expect(schemaIdAvis.safeParse(42).success).toBe(false);
  });

  it("publication : un identifiant et un booléen", () => {
    expect(schemaPublication.safeParse({ id, publie: true }).success).toBe(true);
    expect(schemaPublication.safeParse({ id, publie: "oui" }).success).toBe(false);
  });

  it("échange : deux avis différents et un sens", () => {
    const autre = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
    expect(schemaEchange.safeParse({ id, avecId: autre, sens: "monter" }).success).toBe(true);
    expect(schemaEchange.safeParse({ id, avecId: id, sens: "monter" }).success).toBe(false);
    expect(schemaEchange.safeParse({ id, avecId: autre, sens: "sauter" }).success).toBe(false);
  });
});

describe("fiche de la modale", () => {
  it("un avis existant devient des chaînes (null → vide), et revient à l'identique après validation", () => {
    const a: Avis = {
      id: "1",
      auteurs: "Juliette",
      role_fr: "Responsable communication",
      role_en: null,
      categorie: "evenement",
      texte_fr: "Texte.",
      texte_en: null,
      citation_fr: null,
      citation_en: "Quote.",
      source: "google",
      date_avis: "2024-05-01",
      lien_source: "https://g.page/r/abc",
      publie: true,
      ordre: 10,
      emplacements: ["accueil"],
    };
    const f = formulaireDepuisAvis(a);
    expect(f.role_en).toBe("");
    expect(f.texte_en).toBe("");
    const r = validerChampsAvis(f);
    expect(r.ok && r.champs).toEqual({
      auteurs: "Juliette",
      role_fr: "Responsable communication",
      role_en: null,
      categorie: "evenement",
      texte_fr: "Texte.",
      texte_en: null,
      citation_fr: null,
      citation_en: "Quote.",
      source: "google",
      date_avis: "2024-05-01",
      lien_source: "https://g.page/r/abc",
      emplacements: ["accueil"],
    });
    // La fiche ne partage pas le tableau de l'avis.
    f.emplacements.push("mariages");
    expect(a.emplacements).toEqual(["accueil"]);
  });
});
