import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_RETIRES } from "@/lib/seo/redirections";
import {
  ancreCategorie,
  articles,
  articlesLies,
  CATEGORIES,
  formaterDate,
  lireEnTete,
  tempsDeLecture,
  trierParDate,
  validerEnTete,
} from "./articles";
import { hrefInterne } from "./liens";

const enTeteValide = {
  titre: "Comment un DJ lit-il une piste de danse ?",
  description: "Lire une piste de danse est l’une des compétences les plus importantes du métier de DJ.",
  date: "2026-02-03",
  categorie: "Musique & ambiance",
  couverture: "/journal/comment-un-dj-lit-il-une-piste-de-danse/couverture.jpg",
  couvertureAlt: "Piste de danse pleine devant la régie DJ",
};

describe("lireEnTete", () => {
  it("lit les valeurs JSON de l'en-tête et rend le corps", () => {
    const { donnees, corps } = lireEnTete('---\ntitre: "Un : titre"\ndate: "2026-01-01"\n---\nBonjour **vous**.\n');
    expect(donnees).toEqual({ titre: "Un : titre", date: "2026-01-01" });
    expect(corps).toBe("Bonjour **vous**.\n");
  });

  it("refuse un fichier sans en-tête", () => {
    expect(() => lireEnTete("# Titre\n")).toThrow(/En-tête manquant/);
  });
});

describe("validerEnTete", () => {
  it("accepte un en-tête complet", () => {
    expect(validerEnTete(enTeteValide).categorie).toBe("Musique & ambiance");
  });

  it("refuse une catégorie inconnue, une date mal écrite ou une description trop longue", () => {
    expect(() => validerEnTete({ ...enTeteValide, categorie: "Divers" }, "x.mdx")).toThrow(/x\.mdx.*categorie/);
    expect(() => validerEnTete({ ...enTeteValide, date: "03/02/2026" })).toThrow(/date/);
    expect(() => validerEnTete({ ...enTeteValide, description: "a".repeat(161) })).toThrow(/description/);
    expect(() => validerEnTete({ ...enTeteValide, couverture: undefined })).toThrow(/couverture/);
  });
});

describe("tempsDeLecture", () => {
  it("compte 200 mots par minute, au moins une minute", () => {
    expect(tempsDeLecture("Trois petits mots")).toBe(1);
    expect(tempsDeLecture(Array(401).fill("mot").join(" "))).toBe(3);
  });

  it("ignore les composants, les adresses des liens et la syntaxe Markdown", () => {
    const corps = '## Titre\n\n<PhotoArticle src="/a.jpg" width={10} height={10} alt="une longue description" />\n\n- [lien](/mariages) **gras**';
    expect(tempsDeLecture(corps)).toBe(1);
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

describe("articles du dépôt", () => {
  const liste = articles();

  it("contient les 37 articles conservés, aucun article retiré", () => {
    expect(liste).toHaveLength(37);
    for (const a of liste) expect(Object.keys(ARTICLES_RETIRES)).not.toContain(a.slug);
  });

  it("a des couvertures et des photos présentes dans public/", () => {
    for (const a of liste) {
      expect(fs.existsSync(path.join("public", a.couverture)), a.couverture).toBe(true);
      for (const [, src] of a.source.matchAll(/<PhotoArticle src="([^"]+)"/g)) {
        expect(fs.existsSync(path.join("public", src)), src).toBe(true);
      }
    }
  });

  it("ne pointe plus vers l'ancien site et n'a que des liens internes connus", () => {
    for (const a of liste) {
      expect(a.source, a.slug).not.toMatch(/spiceevents\.fr\/|strikingly/);
      for (const [, href] of a.source.matchAll(/\]\((\/[^)\s]*)\)/g)) {
        expect(hrefInterne(href), `${a.slug} → ${href}`).not.toBeNull();
      }
    }
  });

  it("ne renvoie qu'à des articles existants", () => {
    const slugs = new Set(liste.map((a) => a.slug));
    for (const a of liste) {
      for (const [, cible] of a.source.matchAll(/\]\(\/journal\/([^)\s]+)\)/g)) expect(slugs.has(cible), cible).toBe(true);
    }
  });
});
