import { describe, expect, it } from "vitest";
import {
  DOCUMENT_VIDE,
  PROFONDEUR_MAX_DOCUMENT,
  estLienAutorise,
  imagesDuDocument,
  liensDuDocument,
  tempsDeLecture,
  texteBrut,
  validerDocument,
  type DocumentArticle,
} from "./document";

const texte = (t: string, marks?: unknown[]) => (marks ? { type: "text", text: t, marks } : { type: "text", text: t });
const lien = (href: string) => ({ type: "link", attrs: { href } });
const para = (...content: unknown[]) => ({ type: "paragraph", content });
const doc = (...content: unknown[]) => ({ type: "doc", content });
const image = (attrs: Record<string, unknown> = {}) => ({
  type: "image",
  attrs: { src: "/journal/se-marier-en-hiver/1.jpg", width: 1200, height: 800, alt: "Mariés sous la neige", ...attrs },
});

/** Un document comme l'éditeur les écrit : tous les nœuds autorisés. */
const COMPLET = doc(
  { type: "heading", attrs: { level: 2 }, content: [texte("Le lieu")] },
  para(texte("Un "), texte("DJ", [lien("/mariages"), { type: "bold" }]), texte(" et "), texte("vous", [{ type: "italic" }]), { type: "hardBreak" }, texte("ensuite.")),
  { type: "heading", attrs: { level: 3 }, content: [texte("Détails")] },
  { type: "bulletList", content: [{ type: "listItem", content: [para(texte("un"))] }, { type: "listItem", content: [para(texte("deux")), { type: "bulletList", content: [{ type: "listItem", content: [para(texte("deux bis"))] }] }] }] },
  { type: "orderedList", attrs: { start: 1, type: null }, content: [{ type: "listItem", content: [para(texte("premier"))] }] },
  { type: "blockquote", content: [para(texte("Une citation."))] },
  { type: "horizontalRule" },
  image({ title: null }),
  image({ src: "journal/2026/10/abc-def.webp", title: "La légende" }),
  { type: "paragraph" },
);

const refus = (brut: unknown) => {
  const r = validerDocument(brut);
  return r.ok ? null : r.message;
};

describe("validerDocument", () => {
  it("accepte tous les nœuds autorisés, et le document vide", () => {
    expect(validerDocument(COMPLET)).toEqual({ ok: true, document: COMPLET });
    expect(validerDocument(DOCUMENT_VIDE).ok).toBe(true);
    expect(validerDocument({ type: "doc", content: [{ type: "paragraph" }] }).ok).toBe(true);
  });

  it("accepte les attributs que l'extension Link de Tiptap écrit, à null seulement", () => {
    const tiptap = { type: "link", attrs: { href: "https://mxevenement.com/", target: null, rel: null, class: null } };
    expect(validerDocument(doc(para(texte("MX", [tiptap])))).ok).toBe(true);
    expect(refus(doc(para(texte("MX", [{ type: "link", attrs: { href: "https://mxevenement.com/", target: "_self" } }]))))).toMatch(/target/);
  });

  it("refuse tout nœud, marque ou attribut inconnu", () => {
    expect(refus(doc({ type: "codeBlock", content: [texte("x")] }))).toMatch(/Contenu invalide/);
    expect(refus(doc({ type: "heading", attrs: { level: 1 }, content: [texte("x")] }))).toMatch(/niveau 2 ou 3/);
    expect(refus(doc({ type: "heading", attrs: { level: 4 } }))).toMatch(/niveau 2 ou 3/);
    expect(refus(doc({ type: "heading", attrs: { level: 2, textAlign: "left" } }))).toMatch(/textAlign/);
    expect(refus(doc(para(texte("x", [{ type: "underline" }]))))).not.toBeNull();
    expect(refus(doc(para(texte("x", [{ type: "bold", attrs: {} }]))))).not.toBeNull();
    expect(refus(doc(para({ type: "text", text: "x", style: "color:red" })))).not.toBeNull();
    expect(refus(doc(image({ onerror: "alert(1)" })))).toMatch(/onerror/);
    expect(refus({ type: "doc", content: [], attrs: {} })).not.toBeNull();
    expect(refus({ type: "paragraph" })).not.toBeNull();
    expect(refus(null)).not.toBeNull();
    expect(refus("<p>Bonjour</p>")).not.toBeNull();
  });

  it("refuse les structures que l'éditeur ne produit pas", () => {
    expect(refus(doc({ type: "bulletList", content: [] }))).not.toBeNull();
    expect(refus(doc({ type: "bulletList", content: [{ type: "listItem", content: [image()] }] }))).not.toBeNull();
    expect(refus(doc({ type: "blockquote", content: [] }))).not.toBeNull();
    expect(refus(doc(para(texte(""))))).toMatch(/Texte vide/);
    expect(refus(doc(para(texte("x", [{ type: "bold" }, { type: "bold" }]))))).toMatch(/deux fois/);
    expect(refus(doc(para(para(texte("x")))))).not.toBeNull();
    expect(refus(doc(texte("hors paragraphe")))).not.toBeNull();
  });

  it("n'accepte que des photos du site ou du stockage, avec dimensions et texte alternatif", () => {
    expect(refus(doc(image({ src: "https://exemple.com/photo.jpg" })))).toMatch(/Photo : fichier du site/);
    expect(refus(doc(image({ src: "/journal/../images/x.jpg" })))).toMatch(/Photo/);
    expect(refus(doc(image({ src: "/images/hero.jpg" })))).toMatch(/Photo/);
    expect(refus(doc(image({ src: "journal/a.gif" })))).toMatch(/Photo/);
    expect(refus(doc(image({ src: "javascript:alert(1)" })))).toMatch(/Photo/);
    expect(refus(doc(image({ alt: "  " })))).toMatch(/texte alternatif obligatoire/);
    expect(refus(doc(image({ alt: null })))).toMatch(/texte alternatif obligatoire/);
    expect(refus(doc(image({ alt: "a".repeat(301) })))).toMatch(/300/);
    expect(refus(doc(image({ width: 0 })))).not.toBeNull();
    expect(refus(doc(image({ height: 12.5 })))).not.toBeNull();
    expect(refus(doc(image({ width: "1200" })))).not.toBeNull();
  });

  it("borne la taille et l'imbrication (document hostile)", () => {
    expect(refus(doc(para(texte("a".repeat(1_000_001)))))).toBe("Contenu trop long.");
    let profond: unknown = para(texte("fond"));
    for (let i = 0; i < PROFONDEUR_MAX_DOCUMENT; i++) profond = { type: "blockquote", content: [profond] };
    expect(refus(doc(profond))).toMatch(/trop imbriqué/);
  });

  it("indique l'endroit fautif", () => {
    expect(refus(doc(para(texte("ok")), para(texte("x", [lien("javascript:alert(1)")]))))).toMatch(/^Contenu invalide \(content\.1\.content\.0\.marks\.0\.attrs\.href\) : Lien refusé/);
  });
});

describe("estLienAutorise", () => {
  it("accepte les pages du site, le web, les emails et les téléphones", () => {
    for (const href of ["/", "/mariages", "/mariages#methode", "/journal/se-marier-en-hiver", "https://mxevenement.com/", "http://www.leshautsdepardaillan.com", "https://www.example.fr/a?b=c#d", "mailto:cedric@spiceevents.fr", "tel:+33612345678", "tel:01.23.45.67.89"]) {
      expect(estLienAutorise(href), href).toBe(true);
    }
  });

  it("refuse javascript:, data:, les adresses protocole-relatives, les espaces et le reste", () => {
    for (const href of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      " javascript:alert(1)",
      "java\tscript:alert(1)",
      "javascript&colon;alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox",
      "//exemple.com",
      "/\\exemple.com",
      "https://",
      "https://localhost",
      "https://utilisateur:motdepasse@exemple.com",
      "ftp://exemple.com",
      "#ancre",
      "mariages",
      "mailto:",
      "mailto:a@b",
      "tel:abc",
      "/mariages page",
      "",
      `https://exemple.com/${"a".repeat(2048)}`,
    ]) {
      expect(estLienAutorise(href), href).toBe(false);
    }
  });
});

describe("utilitaires", () => {
  const document = COMPLET as DocumentArticle;

  it("texte brut : un bloc par ligne, saut de ligne compris, sans les photos", () => {
    expect(texteBrut(document)).toBe(["Le lieu", "Un DJ et vous\nensuite.", "Détails", "un\ndeux\ndeux bis", "premier", "Une citation."].join("\n"));
    expect(texteBrut(DOCUMENT_VIDE)).toBe("");
  });

  it("temps de lecture : 200 mots par minute, au moins une minute, un tiret sépare deux mots", () => {
    expect(tempsDeLecture(DOCUMENT_VIDE)).toBe(1);
    expect(tempsDeLecture(doc(para(texte(Array(401).fill("mot").join(" ")))) as DocumentArticle)).toBe(3);
    expect(tempsDeLecture(doc(para(texte(Array(200).fill("peut-être").join(" ")))) as DocumentArticle)).toBe(2);
    // La ponctuation seule n'est pas un mot ; chaque morceau de texte est compté à part (« l’ » + « éclairage »).
    expect(tempsDeLecture(doc(para(texte(Array(200).fill("mot").join(" ") + " , ; !"))) as DocumentArticle)).toBe(1);
    expect(tempsDeLecture(doc(para(...Array(201).fill(0).map(() => texte("l’")), texte("éclairage"))) as DocumentArticle)).toBe(2);
  });

  it("liste les photos et les liens dans l'ordre de lecture", () => {
    expect(imagesDuDocument(document).map((i) => i.src)).toEqual(["/journal/se-marier-en-hiver/1.jpg", "journal/2026/10/abc-def.webp"]);
    const d = doc(para(texte("Notre "), texte("DJ", [lien("/mariages")]), texte(" pro", [lien("/mariages"), { type: "bold" }]), texte(" et "), texte("MX", [lien("https://mxevenement.com/")])));
    expect(liensDuDocument(d as DocumentArticle)).toEqual([
      { href: "/mariages", texte: "DJ pro" },
      { href: "https://mxevenement.com/", texte: "MX" },
    ]);
  });
});
