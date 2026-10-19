import { describe, expect, it } from "vitest";
import { documentDepuisMarkdown, idArticle, ligneDepuisMdx, lireEnTete, publieLeMidiParis, validerEnTete } from "./conversion";
import { validerDocument } from "./document";

const enTeteValide = {
  titre: "Comment un DJ lit-il une piste de danse ?",
  description: "Lire une piste de danse est l’une des compétences les plus importantes du métier de DJ.",
  date: "2026-02-03",
  categorie: "Musique & ambiance",
  couverture: "/journal/comment-un-dj-lit-il-une-piste-de-danse/couverture.jpg",
  couvertureAlt: "Piste de danse pleine devant la régie DJ",
};

describe("en-tête", () => {
  it("lit les valeurs JSON de l'en-tête et rend le corps", () => {
    const { donnees, corps } = lireEnTete('---\ntitre: "Un : titre"\ndate: "2026-01-01"\n---\nBonjour **vous**.\n');
    expect(donnees).toEqual({ titre: "Un : titre", date: "2026-01-01" });
    expect(corps).toBe("Bonjour **vous**.\n");
  });

  it("refuse un fichier sans en-tête", () => {
    expect(() => lireEnTete("# Titre\n")).toThrow(/En-tête manquant/);
  });

  it("accepte un en-tête complet, refuse une catégorie inconnue, une date mal écrite, une description trop longue", () => {
    expect(validerEnTete(enTeteValide).categorie).toBe("Musique & ambiance");
    expect(() => validerEnTete({ ...enTeteValide, categorie: "Divers" }, "x.mdx")).toThrow(/x\.mdx.*categorie/);
    expect(() => validerEnTete({ ...enTeteValide, date: "03/02/2026" })).toThrow(/date/);
    expect(() => validerEnTete({ ...enTeteValide, description: "é".repeat(161) })).toThrow(/description/);
    expect(validerEnTete({ ...enTeteValide, description: "é".repeat(160) }).description).toHaveLength(160);
    expect(() => validerEnTete({ ...enTeteValide, couverture: undefined })).toThrow(/couverture/);
    expect(() => validerEnTete({ ...enTeteValide, couverture: "/images/x.jpg" })).toThrow(/couverture/);
  });
});

describe("documentDepuisMarkdown", () => {
  it("convertit paragraphes, intertitres, listes, citation et séparateur", () => {
    const d = documentDepuisMarkdown("Intro.\n\n## Titre\n\n### Sous-titre\n\n- un\n- deux\n\n1. premier\n\n> Une **citation**.\n\n---\n");
    expect(d).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Intro." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Titre" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Sous-titre" }] },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "un" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "deux" }] }] },
          ],
        },
        { type: "orderedList", attrs: { start: 1 }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "premier" }] }] }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Une " }, { type: "text", text: "citation", marks: [{ type: "bold" }] }, { type: "text", text: "." }] }] },
        { type: "horizontalRule" },
      ],
    });
    expect(validerDocument(d).ok).toBe(true);
  });

  it("met les marques à plat, dans l'ordre de l'éditeur (lien, gras, italique), et réunit le texte contigu", () => {
    const d = documentDepuisMarkdown("Le [**MX ÉVÈNEMENT**](https://mxevenement.com/)**,** puis *voir : [l'article](/journal/x)* et larsen\\* (\\*déf).");
    expect(d.content[0]).toEqual({
      type: "paragraph",
      content: [
        { type: "text", text: "Le " },
        { type: "text", text: "MX ÉVÈNEMENT", marks: [{ type: "link", attrs: { href: "https://mxevenement.com/" } }, { type: "bold" }] },
        { type: "text", text: ",", marks: [{ type: "bold" }] },
        { type: "text", text: " puis " },
        { type: "text", text: "voir : ", marks: [{ type: "italic" }] },
        { type: "text", text: "l'article", marks: [{ type: "link", attrs: { href: "/journal/x" } }, { type: "italic" }] },
        { type: "text", text: " et larsen* (*déf)." },
      ],
    });
  });

  it("transforme <PhotoArticle /> en photo, avec ses dimensions", () => {
    const d = documentDepuisMarkdown('<PhotoArticle src="/journal/a/1.jpg" width={1200} height={799} alt="DJ aux platines, l\'été" />\n\nSuite.');
    expect(d.content[0]).toEqual({ type: "image", attrs: { src: "/journal/a/1.jpg", width: 1200, height: 799, alt: "DJ aux platines, l'été" } });
  });

  it("échoue en nommant le fichier et la ligne plutôt que de perdre du contenu", () => {
    expect(() => documentDepuisMarkdown("Texte.\n\n```\ncode\n```", "x.mdx")).toThrow("x.mdx, ligne 3 du corps : bloc « code » non pris en charge");
    expect(() => documentDepuisMarkdown("# Grand titre", "x.mdx")).toThrow(/niveau 1/);
    expect(() => documentDepuisMarkdown("Un `code`.", "x.mdx")).toThrow(/« inlineCode »/);
    expect(() => documentDepuisMarkdown("![photo](/a.jpg)", "x.mdx")).toThrow(/« image »/);
    expect(() => documentDepuisMarkdown("<div>html</div>", "x.mdx")).toThrow(/HTML ou composant non pris en charge/);
    expect(() => documentDepuisMarkdown('<PhotoArticle src="/journal/a/1.jpg" width={1} height={1} alt="x" style="y" />')).toThrow(/attribut inconnu/);
    expect(() => documentDepuisMarkdown('<PhotoArticle src="https://x.fr/a.jpg" width={1} height={1} alt="x" />')).toThrow(/src invalide/);
    expect(() => documentDepuisMarkdown('<PhotoArticle src="/journal/a/1.jpg" width="1" height={1} alt="x" />')).toThrow(/width et height/);
    expect(() => documentDepuisMarkdown('[lien](/a "titre")')).toThrow(/titre/);
  });
});

describe("article complet", () => {
  const source = `---\n${Object.entries(enTeteValide).map(([c, v]) => `${c}: ${JSON.stringify(v)}`).join("\n")}\n---\nBonjour **vous**.\n`;

  it("donne une ligne publiée, avec un identifiant fixe tiré du slug", () => {
    const l = ligneDepuisMdx("comment-un-dj-lit-il-une-piste-de-danse", source);
    expect(l).toEqual({
      id: idArticle("comment-un-dj-lit-il-une-piste-de-danse"),
      statut: "publie",
      publie_le: "2026-02-03T12:00:00+01:00",
      slug: "comment-un-dj-lit-il-une-piste-de-danse",
      titre: enTeteValide.titre,
      sous_titre: null,
      description: enTeteValide.description,
      categorie: "Musique & ambiance",
      date_publication: "2026-02-03",
      couverture: enTeteValide.couverture,
      couverture_alt: enTeteValide.couvertureAlt,
      contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour " }, { type: "text", text: "vous", marks: [{ type: "bold" }] }, { type: "text", text: "." }] }] },
    });
    expect(idArticle("comment-un-dj-lit-il-une-piste-de-danse")).toBe(l.id);
    expect(l.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(idArticle("autre")).not.toBe(l.id);
  });

  it("publie à midi heure de Paris, heure d'hiver comme d'été (changements d'heure compris)", () => {
    expect(publieLeMidiParis("2026-01-27")).toBe("2026-01-27T12:00:00+01:00");
    expect(publieLeMidiParis("2025-07-14")).toBe("2025-07-14T12:00:00+02:00");
    // Passage à l'heure d'été le 29 mars 2026, retour à l'heure d'hiver le 25 octobre 2026.
    expect(publieLeMidiParis("2026-03-28")).toBe("2026-03-28T12:00:00+01:00");
    expect(publieLeMidiParis("2026-03-29")).toBe("2026-03-29T12:00:00+02:00");
    expect(publieLeMidiParis("2026-10-25")).toBe("2026-10-25T12:00:00+01:00");
    expect(new Date(publieLeMidiParis("2026-03-29")).toISOString()).toBe("2026-03-29T10:00:00.000Z");
  });
});
