import { describe, expect, it } from "vitest";
import { COUVERTURE_PROVISOIRE, apercuDepuisLigne } from "./apercu";
import { articleDepuisLigne } from "./articles";
import { lignesDeRepli } from "./repli";

describe("aperçu d'un article", () => {
  it("article complet : le même article que la page publique", () => {
    const [l] = lignesDeRepli();
    expect(apercuDepuisLigne(l)).toEqual({ ok: true, manques: [], article: articleDepuisLigne(l) });
  });

  it("brouillon incomplet : remplacements visibles et liste de ce qui manque", () => {
    const [l] = lignesDeRepli();
    const r = apercuDepuisLigne(
      { ...l, statut: "brouillon", publie_le: null, titre: " ", description: null, categorie: null, date_publication: null, couverture: null, couverture_alt: null, contenu: { type: "doc", content: [] } },
      new Date("2026-10-19T08:00:00Z"),
    );
    expect(r).toMatchObject({
      ok: true,
      manques: ["titre", "description", "catégorie", "date (celle du jour est affichée)", "photo de couverture (une photo provisoire est affichée)"],
      article: { titre: "Article sans titre", categorie: "Sans catégorie", date: "2026-10-19", couverture: COUVERTURE_PROVISOIRE, lecture: 1 },
    });
  });

  it("contenu invalide : jamais rendu", () => {
    const [l] = lignesDeRepli();
    expect(apercuDepuisLigne({ ...l, contenu: { type: "doc", content: [{ type: "script" }] } })).toMatchObject({ ok: false });
  });
});
