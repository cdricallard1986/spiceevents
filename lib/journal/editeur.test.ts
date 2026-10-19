import { Editor, type JSONContent } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";
import { documentDepuisEditeur } from "./admin";
import { urlPublique } from "@/lib/photos/constantes";
import { validerDocument, type DocumentArticle } from "./document";
import { MARQUES_EDITEUR, NOEUDS_EDITEUR, contenuPourEditeur, extensionsArticle, preparerHtmlColle } from "./editeur";
import { lignesDeRepli } from "./repli";

// L'éditeur réel (extensions de l'admin) dans jsdom, sans React.

const editeurs: Editor[] = [];

function editeur(content: JSONContent | string = { type: "doc", content: [] }): Editor {
  const e = new Editor({ extensions: extensionsArticle(), content: typeof content === "string" ? content : contenuPourEditeur(content), element: document.createElement("div") });
  editeurs.push(e);
  return e;
}

afterEach(() => {
  editeurs.splice(0).forEach((e) => e.destroy());
});

/** Ce que l'éditeur enregistre : son JSON mis en forme. */
function sortie(e: Editor): unknown {
  return documentDepuisEditeur(e.getJSON());
}

/** Collage réel (logique de collage de ProseMirror et des extensions), sans presse-papiers : jsdom n'a pas de ClipboardEvent. */
function collerHtml(e: Editor, html: string) {
  e.view.pasteHTML(preparerHtmlColle(html).html, Object.assign(new Event("paste"), { clipboardData: null }) as ClipboardEvent);
}

/** Position d'un texte dans le document. */
function trouver(e: Editor, texte: string): { from: number; to: number } {
  let trouve: { from: number; to: number } | null = null;
  e.state.doc.descendants((n, pos) => {
    if (trouve || !n.isText) return !trouve;
    const i = n.text!.indexOf(texte);
    if (i >= 0) trouve = { from: pos + i, to: pos + i + texte.length };
    return false;
  });
  if (!trouve) throw new Error(`Texte introuvable : ${texte}`);
  return trouve;
}

function selectionner(e: Editor, texte: string) {
  return e.chain().focus().setTextSelection(trouver(e, texte));
}

function types(doc: unknown): string[] {
  const vus = new Set<string>();
  const parcourir = (n: unknown) => {
    if (!n || typeof n !== "object") return;
    const noeud = n as { type?: string; content?: unknown[]; marks?: { type: string }[] };
    if (noeud.type) vus.add(noeud.type);
    noeud.marks?.forEach((m) => vus.add(`marque:${m.type}`));
    noeud.content?.forEach(parcourir);
  };
  parcourir(doc);
  return [...vus].sort();
}

describe("éditeur des articles : schéma", () => {
  it("ne connaît que les nœuds et marques du document", () => {
    const e = editeur();
    expect(Object.keys(e.schema.nodes).sort()).toEqual([...NOEUDS_EDITEUR].sort());
    expect(Object.keys(e.schema.marks).sort()).toEqual([...MARQUES_EDITEUR].sort());
    expect(e.schema.nodes.heading.spec.parseDOM?.map((r) => r.tag)).toEqual(["h2", "h3"]);
  });
});

describe("éditeur des articles : document édité", () => {
  it("un article neuf s'ouvre avec un paragraphe où écrire, et s'enregistre vide", () => {
    const e = editeur({ type: "doc", content: [] });
    expect(e.getJSON()).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(() => e.state.doc.check()).not.toThrow();
    expect(sortie(e)).toEqual({ type: "doc", content: [] });
    e.chain().focus().insertContent("Premier mot").run();
    expect(sortie(e)).toEqual({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Premier mot" }] }] });
  });

  it("un document écrit avec les commandes de la barre d'outils passe validerDocument (brut et mis en forme)", () => {
    const e = editeur();
    e.commands.insertContent("<p>Intertitre</p><p>Un texte en gras et en italique, puis un lien.</p><p>Sous-intertitre</p><p>Premier point</p><p>Étape</p><p>Une citation</p><p>Fin</p>");
    expect(selectionner(e, "Intertitre").setHeading({ level: 2 }).run()).toBe(true);
    expect(selectionner(e, "en gras").toggleBold().run()).toBe(true);
    expect(selectionner(e, "en italique").toggleItalic().run()).toBe(true);
    expect(selectionner(e, "un lien").setLink({ href: "/mariages" }).run()).toBe(true);
    expect(selectionner(e, "Sous-intertitre").setHeading({ level: 3 }).run()).toBe(true);
    expect(selectionner(e, "Premier point").toggleBulletList().run()).toBe(true);
    expect(selectionner(e, "Étape").toggleOrderedList().run()).toBe(true);
    expect(selectionner(e, "Une citation").toggleBlockquote().run()).toBe(true);
    // Saut de ligne au milieu d'un paragraphe, séparateur et photos à la fin.
    const fin = trouver(e, "Fin");
    e.chain().setTextSelection(fin.from + 1).setHardBreak().run();
    e.chain().setTextSelection(e.state.doc.content.size - 1).setHorizontalRule().run();
    e.chain()
      .focus("end")
      .insertContent({ type: "image", attrs: { src: "journal/2026/10/1760000000000-abcdef.jpg", width: 1600, height: 1067, alt: "Piste de danse", title: "Le bal" } })
      .run();
    e.chain().focus("end").insertContent({ type: "image", attrs: { src: "/journal/exemple/photo.jpg", width: 800, height: 1200, alt: "Portrait" } }).run();
    // Annuler / rétablir.
    expect(e.commands.undo()).toBe(true);
    expect(e.commands.redo()).toBe(true);

    const brut = e.getJSON();
    const v = validerDocument(brut);
    expect(v.ok, v.ok ? "" : v.message).toBe(true);
    const propre = sortie(e);
    const w = validerDocument(propre);
    expect(w.ok, w.ok ? "" : w.message).toBe(true);
    expect(types(propre)).toEqual(
      [
        "blockquote",
        "bulletList",
        "doc",
        "hardBreak",
        "heading",
        "horizontalRule",
        "image",
        "listItem",
        "marque:bold",
        "marque:italic",
        "marque:link",
        "orderedList",
        "paragraph",
        "text",
      ].sort(),
    );
    // Forme enregistrée : plus d'attributs à null.
    const texte = JSON.stringify(propre);
    expect(texte).not.toContain("null");
    expect(texte).toContain('"attrs":{"href":"/mariages"}');
    expect(texte).toContain('"title":"Le bal"');
  });

  it("refuse un lien que le document refuserait (javascript:, data:, //autre-site)", () => {
    const e = editeur("<p>texte</p>");
    e.commands.selectAll();
    expect(e.commands.setLink({ href: "javascript:alert(1)" })).toBe(false);
    expect(e.commands.setLink({ href: "data:text/html,x" })).toBe(false);
    expect(e.commands.setLink({ href: "//exemple.fr" })).toBe(false);
    expect(e.commands.setLink({ href: "https://www.mariages.net" })).toBe(true);
    expect(validerDocument(e.getJSON()).ok).toBe(true);
  });
});

describe("éditeur des articles : les 37 articles importés", () => {
  const lignes = lignesDeRepli();

  it("sont bien 37", () => {
    expect(lignes).toHaveLength(37);
  });

  it.each(lignes.map((l) => [l.slug, l.contenu] as const))("%s : chargé dans l'éditeur, il ressort identique", (_slug, contenu) => {
    const e = editeur(contenu as JSONContent);
    // Document conforme au schéma de l'éditeur (rien n'a été écarté ni réparé au chargement).
    expect(() => e.state.doc.check()).not.toThrow();
    expect(validerDocument(e.getJSON()).ok).toBe(true);
    expect(sortie(e)).toEqual(contenu);
  });

  it("copier-coller d'un article entier dans l'éditeur (HTML de l'éditeur) ne perd rien", () => {
    const source = lignes.find((l) => JSON.stringify(l.contenu).includes('"image"') && JSON.stringify(l.contenu).includes('"link"'))!;
    expect(source).toBeDefined();
    const html = editeur(source.contenu as JSONContent).getHTML();
    const cible = editeur();
    collerHtml(cible, html);
    expect(sortie(cible)).toEqual(source.contenu);
  });
});

describe("éditeur des articles : collage depuis Word, Google Docs, une page web", () => {
  it("garde le texte et la mise en forme connue, écarte le reste (titres 1/4, souligné, barré, code, tableaux, styles)", () => {
    const e = editeur();
    collerHtml(
      e,
      `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1234"><h1 style="font-size:20pt">Grand titre</h1>
      <p dir="ltr" style="line-height:1.38"><span style="font-weight:700">Gras Docs</span><span style="font-style:italic"> italique Docs</span> <u>souligné</u> <s>barré</s> <code>code</code></p>
      <h4>Petit titre</h4>
      <p class=MsoNormal>Paragraphe <o:p></o:p>Word<sup>1</sup></p>
      <table><tr><td>cellule A</td><td>cellule B</td></tr></table>
      <pre>bloc de code</pre>
      <ul><li><p>point</p></li></ul></b>`,
    );
    const doc = sortie(e) as DocumentArticle;
    const v = validerDocument(doc);
    expect(v.ok, v.ok ? "" : v.message).toBe(true);
    const texte = JSON.stringify(doc);
    for (const morceau of ["Grand titre", "Gras Docs", "italique Docs", "souligné", "barré", "code", "Petit titre", "Word", "cellule A", "cellule B", "bloc de code", "point"])
      expect(texte).toContain(morceau);
    expect(doc.content[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(doc.content.some((b) => b.type === "heading" && b.attrs.level === 3)).toBe(true);
    expect(types(doc)).toEqual(expect.arrayContaining(["marque:bold", "marque:italic", "bulletList"]));
  });

  it("refuse les images collées en data: ou venues d'un autre site, et les liens dangereux", () => {
    const e = editeur();
    const html = `<p>Avant</p>
      <img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10" alt="pixel">
      <p><img src="https://autre-site.fr/photo.jpg" width="800" height="600" alt="ailleurs"> au milieu</p>
      <figure><img src="https://autre-site.fr/b.jpg" alt="b"><figcaption>Légende d'ailleurs</figcaption></figure>
      <p><a href="javascript:alert(1)">piège</a> <a href="file:///C:/doc.docx">fichier</a> <a href="https://www.spiceevents.fr/mariages" title="t" target="_blank" rel="noopener">bon lien</a></p>
      <p>Après</p>`;
    expect(preparerHtmlColle(html).imagesRefusees).toBe(3);
    collerHtml(e, html);
    const doc = sortie(e) as DocumentArticle;
    const v = validerDocument(doc);
    expect(v.ok, v.ok ? "" : v.message).toBe(true);
    const texte = JSON.stringify(doc);
    expect(texte).not.toContain('"image"');
    expect(texte).not.toContain("data:");
    expect(texte).not.toContain("javascript:");
    expect(texte).not.toContain("file:");
    expect(texte).toContain("piège");
    expect(texte).toContain('{"type":"link","attrs":{"href":"https://www.spiceevents.fr/mariages"}}');
  });

  it("reprend une photo du journal collée sous son adresse publique (copie depuis l'éditeur ou le site)", () => {
    const e = editeur();
    collerHtml(e, `<img src="${urlPublique("journal/2026/10/1760000000000-abcdef.webp")}" width="1200" height="800" alt="Salle" title="Légende">`);
    expect(sortie(e)).toEqual({
      type: "doc",
      content: [{ type: "image", attrs: { src: "journal/2026/10/1760000000000-abcdef.webp", width: 1200, height: 800, alt: "Salle", title: "Légende" } }],
    });
  });

  it("la syntaxe Markdown d'image tapée au clavier ne crée pas de photo", () => {
    const e = editeur();
    e.chain().focus().insertContent("![x](https://autre-site.fr/a.jpg)", { applyInputRules: true }).run();
    expect(JSON.stringify(e.getJSON())).not.toContain('"image"');
  });
});
