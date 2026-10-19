import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_RETIRES } from "@/lib/seo/redirections";
import { ancreCategorie, articleDepuisLigne, articlesLies, derniersArticles, formaterDate, trierParDate } from "./articles";
import { CATEGORIES, CATEGORIES_EVENEMENT, CATEGORIES_MARIAGE } from "./constantes";
import { imagesDuDocument, liensDuDocument, type DocumentArticle } from "./document";
import { hrefInterne } from "./liens";
import { lignesDeRepli } from "./repli";
import type { LigneArticle } from "./types";

const ligne = (champs: Partial<LigneArticle> = {}): LigneArticle => ({
  id: "4a1b8c2e-0000-5000-8000-000000000001",
  statut: "publie",
  publie_le: "2026-02-03T12:00:00+01:00",
  slug: "comment-un-dj-lit-il-une-piste-de-danse",
  titre: "Comment un DJ lit-il une piste de danse ?",
  sous_titre: null,
  description: "Lire une piste de danse est l’une des compétences les plus importantes du métier de DJ.",
  categorie: "Musique & ambiance",
  date_publication: "2026-02-03",
  couverture: "/journal/comment-un-dj-lit-il-une-piste-de-danse/couverture.jpg",
  couverture_alt: "Piste de danse pleine devant la régie DJ",
  contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Trois petits mots" }] }] },
  ...champs,
});

describe("articleDepuisLigne", () => {
  it("met en forme une ligne publiée : champs des pages, document validé, temps de lecture", () => {
    expect(articleDepuisLigne(ligne({ sous_titre: "Le métier" }))).toEqual({
      id: "4a1b8c2e-0000-5000-8000-000000000001",
      slug: "comment-un-dj-lit-il-une-piste-de-danse",
      titre: "Comment un DJ lit-il une piste de danse ?",
      sousTitre: "Le métier",
      description: "Lire une piste de danse est l’une des compétences les plus importantes du métier de DJ.",
      categorie: "Musique & ambiance",
      date: "2026-02-03",
      couverture: "/journal/comment-un-dj-lit-il-une-piste-de-danse/couverture.jpg",
      couvertureAlt: "Piste de danse pleine devant la régie DJ",
      contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Trois petits mots" }] }] },
      lecture: 1,
    });
    expect(articleDepuisLigne(ligne())).not.toHaveProperty("sousTitre");
  });

  it("refuse un contenu que le rendu ne connaît pas, en nommant l'article", () => {
    const script = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] };
    expect(() => articleDepuisLigne(ligne({ contenu: script }))).toThrow(/comment-un-dj-lit-il-une-piste-de-danse.*Lien refusé/);
    expect(() => articleDepuisLigne(ligne({ contenu: { type: "doc", content: [{ type: "codeBlock" }] } }))).toThrow(/Contenu invalide/);
  });

  it("refuse un article publié incomplet (la contrainte de la table l'interdit déjà)", () => {
    expect(() => articleDepuisLigne(ligne({ description: null }))).toThrow(/sans description/);
    expect(() => articleDepuisLigne(ligne({ categorie: null }))).toThrow(/catégorie/);
    expect(() => articleDepuisLigne(ligne({ couverture: null }))).toThrow(/couverture/);
  });
});

describe("trierParDate", () => {
  it("met les plus récents en premier, sans modifier la liste reçue", () => {
    const liste = [
      { titre: "B", date: "2021-01-01" },
      { titre: "A", date: "2026-03-01" },
      { titre: "C", date: "2026-03-01" },
    ];
    expect(trierParDate(liste).map((a) => a.titre)).toEqual(["A", "C", "B"]);
    expect(liste[0].titre).toBe("B");
  });
});

describe("outils de présentation", () => {
  it("donne une ancre lisible à chaque catégorie", () => {
    expect(CATEGORIES.map(ancreCategorie)).toEqual([
      "conseils-mariage",
      "musique-ambiance",
      "technique",
      "animations",
      "mariages-realises",
    ]);
  });

  it("écrit la date en toutes lettres", () => {
    expect(formaterDate("2026-02-03")).toBe("3 février 2026");
  });

  it("propose d'abord les articles de la même catégorie", () => {
    const a = (slug: string, categorie: string, date: string) => ({ slug, categorie, date, titre: slug });
    const tous = [a("x", "Technique", "2026-01-01"), a("y", "Animations", "2026-04-01"), a("z", "Technique", "2025-01-01"), a("w", "Animations", "2026-02-01")];
    expect(articlesLies(tous, tous[0]).map((l) => l.slug)).toEqual(["z", "y", "w"]);
  });
});

describe("articles du dépôt (données de secours)", () => {
  const lignes = lignesDeRepli();
  const doc = (l: LigneArticle) => l.contenu as DocumentArticle;

  it("contient les 37 articles conservés, aucun article retiré, tous valides", () => {
    expect(lignes).toHaveLength(37);
    for (const l of lignes) {
      expect(Object.keys(ARTICLES_RETIRES)).not.toContain(l.slug);
      expect(() => articleDepuisLigne(l)).not.toThrow();
    }
  });

  it("a des couvertures et des photos présentes dans public/", () => {
    for (const l of lignes) {
      expect(fs.existsSync(path.join("public", l.couverture!)), l.couverture!).toBe(true);
      for (const { src } of imagesDuDocument(doc(l))) expect(fs.existsSync(path.join("public", src)), src).toBe(true);
    }
  });

  it("ne pointe plus vers l'ancien site et n'a que des liens internes connus", () => {
    for (const l of lignes) {
      for (const { href } of liensDuDocument(doc(l))) {
        expect(href, l.slug).not.toMatch(/spiceevents\.fr\/|strikingly/);
        if (href.startsWith("/")) expect(hrefInterne(href), `${l.slug} → ${href}`).not.toBeNull();
      }
    }
  });

  it("ne renvoie qu'à des articles existants", () => {
    const slugs = new Set(lignes.map((l) => l.slug));
    for (const l of lignes) {
      for (const { href } of liensDuDocument(doc(l))) {
        const cible = /^\/journal\/([^/#?]+)$/.exec(href)?.[1];
        if (cible) expect(slugs.has(cible), cible).toBe(true);
      }
    }
  });
});

describe("derniersArticles (rangées de l'accueil, de Mariages et d'Événementiel)", () => {
  const liste = [
    { titre: "A", categorie: "Technique", date: "2026-01-01" },
    { titre: "B", categorie: "Conseils mariage", date: "2026-03-01" },
    { titre: "C", categorie: "Mariages réalisés", date: "2025-06-01" },
    { titre: "D", categorie: "Animations", date: "2026-02-01" },
    { titre: "E", categorie: "Conseils mariage", date: "2026-04-01" },
    { titre: "F", categorie: "Musique & ambiance", date: "2025-01-01" },
  ];

  it("garde les 5 plus récents, toutes catégories confondues", () => {
    expect(derniersArticles(liste).map((a) => a.titre)).toEqual(["E", "B", "D", "A", "C"]);
  });

  it("filtre sur les catégories mariage, puis événement", () => {
    expect(derniersArticles(liste, CATEGORIES_MARIAGE).map((a) => a.titre)).toEqual(["E", "B", "C"]);
    expect(derniersArticles(liste, CATEGORIES_EVENEMENT).map((a) => a.titre)).toEqual(["D", "A", "F"]);
  });

  it("répartit chaque catégorie dans exactement un des deux filtres", () => {
    for (const c of CATEGORIES) {
      expect(Number(CATEGORIES_MARIAGE.includes(c)) + Number(CATEGORIES_EVENEMENT.includes(c)), c).toBe(1);
    }
  });
});
