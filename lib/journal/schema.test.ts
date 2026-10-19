import { describe, expect, it } from "vitest";
import { LIMITES_ARTICLES } from "./constantes";
import { FORMULAIRE_VIDE, premiereErreur, schemaIdArticle, validerChampsArticle, verifierPublication, type FormulaireArticle } from "./schema";

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour" }] }] };
const brouillon: FormulaireArticle = { ...FORMULAIRE_VIDE, slug: "nouvel-article" };
const complet: FormulaireArticle = {
  slug: "se-marier-en-hiver",
  titre: "  Se marier en hiver ",
  sous_titre: "",
  description: "Nos conseils pour un mariage d’hiver réussi.",
  categorie: "Conseils mariage",
  date_publication: "2026-10-18",
  couverture: "journal/2026/10/couverture-hiver.jpg",
  couverture_alt: "Mariés sous la neige",
  contenu: doc,
};

function erreurs(champs: Partial<Record<keyof FormulaireArticle, unknown>>) {
  const r = validerChampsArticle({ ...complet, ...champs });
  return r.ok ? {} : r.erreurs;
}

describe("validation d'un article (éditeur)", () => {
  it("accepte un brouillon presque vide : seule l'adresse est obligatoire", () => {
    expect(validerChampsArticle(brouillon)).toEqual({
      ok: true,
      champs: {
        slug: "nouvel-article",
        titre: "",
        sous_titre: null,
        description: null,
        categorie: null,
        date_publication: null,
        couverture: null,
        couverture_alt: null,
        contenu: { type: "doc", content: [] },
      },
    });
  });

  it("accepte un article complet : espaces retirés, champs vides → null", () => {
    const r = validerChampsArticle(complet);
    expect(r).toEqual({
      ok: true,
      champs: {
        slug: "se-marier-en-hiver",
        titre: "Se marier en hiver",
        sous_titre: null,
        description: "Nos conseils pour un mariage d’hiver réussi.",
        categorie: "Conseils mariage",
        date_publication: "2026-10-18",
        couverture: "journal/2026/10/couverture-hiver.jpg",
        couverture_alt: "Mariés sous la neige",
        contenu: doc,
      },
    });
    if (r.ok) expect(verifierPublication(r.champs)).toEqual({});
  });

  it("contrôle l'adresse comme la table : format et 120 caractères", () => {
    expect(erreurs({ slug: "" }).slug).toBe("Indiquez l'adresse de l'article.");
    expect(erreurs({ slug: "Se marier" }).slug).toMatch(/minuscules sans accents/);
    expect(erreurs({ slug: "a".repeat(121) }).slug).toMatch(/120 caractères/);
    expect(erreurs({ slug: undefined }).slug).toBeDefined();
  });

  it("contrôle les longueurs de la table (en caractères, accents compris)", () => {
    expect(erreurs({ titre: "é".repeat(LIMITES_ARTICLES.titre) })).toEqual({});
    expect(erreurs({ titre: "é".repeat(201) }).titre).toMatch(/200/);
    expect(erreurs({ sous_titre: "a".repeat(301) }).sous_titre).toMatch(/300/);
    expect(erreurs({ description: "é".repeat(160) })).toEqual({});
    expect(erreurs({ description: "é".repeat(161) }).description).toMatch(/160/);
    expect(erreurs({ couverture_alt: "a".repeat(301) }).couverture_alt).toMatch(/300/);
  });

  it("contrôle catégorie, date et couverture", () => {
    expect(erreurs({ categorie: "Divers" }).categorie).toBe("Catégorie inconnue.");
    expect(erreurs({ date_publication: "2026-02-30" }).date_publication).toBe("Date invalide.");
    expect(erreurs({ date_publication: "18/10/2026" }).date_publication).toBe("Date invalide.");
    for (const couverture of ["/journal/se-marier-en-hiver/couverture.jpg", "journal/2026/10/a.avif"]) expect(erreurs({ couverture }), couverture).toEqual({});
    for (const couverture of ["https://exemple.com/a.jpg", "/images/a.jpg", "journal/a.gif", "/journal/../a.jpg", "journal/A.jpg"]) {
      expect(erreurs({ couverture }).couverture, couverture).toMatch(/Couverture/);
    }
  });

  it("valide le document de l'éditeur avec le validateur strict", () => {
    expect(erreurs({ contenu: { type: "doc", content: [{ type: "iframe" }] } }).contenu).toMatch(/Contenu invalide/);
    expect(erreurs({ contenu: "<p>x</p>" }).contenu).toMatch(/Contenu invalide/);
    expect(erreurs({ contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] } }).contenu).toMatch(/Lien refusé/);
  });

  it("dit ce qui manque pour publier (contrainte « publié complet » de la table)", () => {
    const r = validerChampsArticle(brouillon);
    if (!r.ok) throw new Error("brouillon refusé");
    expect(Object.keys(verifierPublication(r.champs)).sort()).toEqual(["categorie", "couverture", "couverture_alt", "date_publication", "description", "titre"]);
    expect(premiereErreur(verifierPublication(r.champs))).toBe("Donnez un titre à l'article avant de le publier.");
    expect(premiereErreur({})).toBe("Article invalide.");
  });

  it("identifiant d'article : un UUID", () => {
    expect(schemaIdArticle.safeParse("baddac3b-196a-5ccd-9f8f-e5c9cc7fe856").success).toBe(true);
    expect(schemaIdArticle.safeParse("1 or 1=1").success).toBe(false);
  });
});
