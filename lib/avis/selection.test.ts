import { describe, expect, it } from "vitest";
import {
  avisDeCategorie,
  avisDeLEmplacement,
  avisUnique,
  citationAffichee,
  enLangue,
  extrait,
  grandAvis,
  grilleCitations,
  grilleTextes,
  publies,
} from "./selection";
import type { Avis } from "./types";

function avis(id: string, champs: Partial<Avis> = {}): Avis {
  return {
    id,
    auteurs: `Auteurs ${id}`,
    role_fr: null,
    role_en: null,
    categorie: "mariage",
    texte_fr: `Texte français ${id}.`,
    texte_en: `English text ${id}.`,
    citation_fr: null,
    citation_en: null,
    source: "site",
    date_avis: null,
    lien_source: null,
    publie: true,
    ordre: 10,
    emplacements: [],
    ...champs,
  };
}

describe("extrait", () => {
  it("garde un texte court tel quel", () => {
    expect(extrait("Court.", 220)).toBe("Court.");
  });

  it("coupe à la dernière phrase entière qui tient dans la longueur", () => {
    const texte = "Première phrase. Deuxième phrase un peu plus longue ! Troisième ?";
    expect(extrait(texte, 30)).toBe("Première phrase.");
    expect(extrait(texte, 55)).toBe("Première phrase. Deuxième phrase un peu plus longue !");
  });

  it("garde au moins la première phrase, même trop longue", () => {
    expect(extrait("Une seule phrase bien trop longue pour la limite. Puis une autre.", 10)).toBe("Une seule phrase bien trop longue pour la limite.");
  });
});

describe("choix des avis", () => {
  const liste = [
    avis("c", { ordre: 30, emplacements: ["accueil"] }),
    avis("a", { ordre: 10, emplacements: ["accueil", "accueil_grand"] }),
    avis("x", { ordre: 5, emplacements: ["accueil", "accueil_grand"], publie: false }),
    avis("b", { ordre: 20, emplacements: ["mariages"], categorie: "evenement" }),
    avis("d", { ordre: 30, emplacements: ["accueil_grand"] }),
  ];

  it("ne garde que les avis publiés, par ordre (puis identifiant)", () => {
    expect(publies(liste).map((a) => a.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("une grille = les avis publiés qui portent l'emplacement, dans l'ordre", () => {
    expect(avisDeLEmplacement(liste, "accueil").map((a) => a.id)).toEqual(["a", "c"]);
    expect(avisDeLEmplacement(liste, "option:photobooth")).toEqual([]);
  });

  it("un grand avis = le premier avis publié qui porte l'emplacement (un avis non publié ne compte pas)", () => {
    expect(avisUnique(liste, "accueil_grand")?.id).toBe("a");
    expect(avisUnique(liste, "mariages_grand")).toBeUndefined();
  });

  it("par catégorie, dans l'ordre", () => {
    expect(avisDeCategorie(liste, "mariage").map((a) => a.id)).toEqual(["a", "c", "d"]);
    expect(avisDeCategorie(liste, "evenement").map((a) => a.id)).toEqual(["b"]);
  });

  it("ne modifie pas la liste reçue", () => {
    const copie = liste.map((a) => a.id);
    publies(liste);
    expect(liste.map((a) => a.id)).toEqual(copie);
  });
});

describe("mise en forme par langue", () => {
  it("français : texte, rôle et citation français", () => {
    const a = avis("1", { role_fr: "Cheffe de projet", role_en: "Project manager", citation_fr: "Citation.", citation_en: "Quote." });
    expect(enLangue(a, "fr")).toEqual({ id: "1", auteurs: "Auteurs 1", role: "Cheffe de projet", texte: "Texte français 1.", citation: "Citation." });
  });

  it("anglais traduit : texte, rôle et citation anglais", () => {
    const a = avis("1", { role_fr: "Cheffe de projet", role_en: "Project manager", citation_fr: "Citation.", citation_en: "Quote." });
    expect(enLangue(a, "en")).toEqual({ id: "1", auteurs: "Auteurs 1", role: "Project manager", texte: "English text 1.", citation: "Quote." });
  });

  it("anglais sans rôle anglais : le rôle français", () => {
    expect(enLangue(avis("1", { role_fr: "Directeur marketing" }), "en").role).toBe("Directeur marketing");
  });

  it("anglais non traduit : le texte français ET sa citation française, marqués lang=fr", () => {
    const a = avis("1", { texte_en: null, citation_fr: "Citation.", citation_en: "Quote." });
    expect(enLangue(a, "en")).toEqual({ id: "1", auteurs: "Auteurs 1", texte: "Texte français 1.", citation: "Citation.", langue: "fr" });
  });

  it("anglais traduit sans citation anglaise : le début du texte anglais, jamais la citation française", () => {
    const a = avis("1", { citation_fr: "Citation." });
    expect(enLangue(a, "en").citation).toBeNull();
    expect(citationAffichee(enLangue(a, "en"), 260)).toBe("English text 1.");
  });

  it("sans rôle : pas de champ rôle", () => {
    expect(enLangue(avis("1"), "fr")).not.toHaveProperty("role");
  });
});

describe("textes affichés", () => {
  const long = "Une phrase. ".repeat(40).trim();

  it("citation choisie, sinon l'extrait du début du texte", () => {
    expect(citationAffichee({ id: "1", auteurs: "A", texte: long, citation: "Choisie." }, 30)).toBe("Choisie.");
    expect(citationAffichee({ id: "1", auteurs: "A", texte: long, citation: null }, 30)).toBe("Une phrase. Une phrase.");
  });

  it("grille de citations : clé = identifiant, citation ou extrait", () => {
    const liste = [avis("1", { texte_fr: long }), avis("2", { citation_fr: "Choisie.", role_fr: "Rôle" })];
    expect(grilleCitations(liste, "fr", 30)).toEqual([
      { cle: "1", auteurs: "Auteurs 1", texte: "Une phrase. Une phrase." },
      { cle: "2", auteurs: "Auteurs 2", role: "Rôle", texte: "Choisie." },
    ]);
  });

  it("grille des textes complets (page Avis) : jamais la citation", () => {
    expect(grilleTextes([avis("1", { texte_fr: long, citation_fr: "Choisie." })], "fr")[0].texte).toBe(long);
  });

  it("grand avis : citation de l'avis de l'emplacement, langue signalée si non traduit", () => {
    const liste = [avis("1", { emplacements: ["mariages_grand"], texte_en: null })];
    expect(grandAvis(liste, "mariages_grand", "en", 320)).toEqual({ cle: "1", auteurs: "Auteurs 1", texte: "Texte français 1.", langue: "fr" });
    expect(grandAvis(liste, "accueil_grand", "en", 320)).toBeUndefined();
  });
});
