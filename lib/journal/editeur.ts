import type { Extensions, JSONContent } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { cheminDepuisSrc } from "./admin";
import { srcImage } from "./constantes";
import { estLienAutorise } from "./document";

/**
 * Extensions Tiptap de l'éditeur des articles, réglées pour ne produire QUE
 * le format du document (lib/journal/document.ts) : paragraphes, intertitres
 * de niveau 2 et 3, listes, citation, séparateur, saut de ligne, photos, et du
 * texte en gras, en italique ou en lien. Tout le reste (code, texte barré ou
 * souligné, titres 1 et 4 à 6, tableaux…) n'est pas dans le schéma :
 * ProseMirror l'écarte d'un texte collé (le texte, lui, est gardé).
 *
 * Partagé par le composant de l'éditeur (navigateur, chargé seulement sur
 * /admin/journal/[id]) et ses tests (jsdom).
 */

/** Ce que le schéma de l'éditeur peut contenir (vérifié par les tests). */
export const NOEUDS_EDITEUR = ["doc", "paragraph", "text", "heading", "bulletList", "orderedList", "listItem", "blockquote", "horizontalRule", "hardBreak", "image"];
export const MARQUES_EDITEUR = ["link", "bold", "italic"];

function nombre(valeur: string | null): number | null {
  if (!valeur || !/^\d+$/.test(valeur)) return null;
  const n = Number(valeur);
  return n >= 1 && n <= 20000 ? n : null;
}

/** Attributs d'une photo lus dans le HTML (collage, copie dans l'éditeur), ou `false` : refusée. */
function attributsPhoto(img: HTMLImageElement | null) {
  if (!img) return false;
  const src = cheminDepuisSrc(img.getAttribute("src"));
  const width = nombre(img.getAttribute("width"));
  const height = nombre(img.getAttribute("height"));
  const alt = img.getAttribute("alt")?.trim();
  // Sans dimensions ni texte alternatif, la photo ne serait pas enregistrable : on ne la reprend pas.
  if (!src || !width || !height || !alt) return false;
  return { src, width, height, alt, title: img.getAttribute("title")?.trim() || null };
}

/**
 * Photo du texte : un bloc (jamais dans une ligne), chemin enregistré
 * (`/journal/…` ou `journal/…`) affiché par son adresse publique, dimensions
 * réelles, texte alternatif, légende facultative (`title`). Pas de poignées de
 * taille : comme sur le site, la photo occupe la largeur du texte. Pas de
 * syntaxe Markdown `![…](…)` ni d'image collée d'un autre site ou en `data:`.
 */
export const NoeudPhoto = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      src: { default: null, parseHTML: (el) => cheminDepuisSrc(el.getAttribute("src")), renderHTML: (a) => ({ src: a.src ? srcImage(String(a.src)) : null }) },
      // Lus tels quels (sans conversion en nombre d'un texte comme « 2024 »).
      alt: { default: null, parseHTML: (el) => el.getAttribute("alt") },
      title: { default: null, parseHTML: (el) => el.getAttribute("title") || null },
      width: { default: null, parseHTML: (el) => nombre(el.getAttribute("width")) },
      height: { default: null, parseHTML: (el) => nombre(el.getAttribute("height")) },
    };
  },

  parseHTML() {
    return [
      // Photo copiée dans l'éditeur : <figure data-photo-article><img …><figcaption>…</figcaption></figure>.
      { tag: "figure[data-photo-article]", getAttrs: (el) => attributsPhoto((el as HTMLElement).querySelector("img")) },
      { tag: "img[src]", getAttrs: (el) => attributsPhoto(el as HTMLImageElement) },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const legende = typeof node.attrs.title === "string" && node.attrs.title ? node.attrs.title : null;
    return [
      "figure",
      { "data-photo-article": "", class: "photo-editeur" },
      ["img", { ...HTMLAttributes, draggable: "false" }],
      ...(legende ? [["figcaption", {}, legende]] : []),
    ];
  },

  addInputRules() {
    return [];
  },
}).configure({ inline: false, allowBase64: false, resize: false });

/**
 * Lien : seulement les adresses que le document accepte (https://, http://,
 * mailto:, tel:, page du site `/…`) — un lien collé `javascript:` ou
 * `file:` perd son lien, le texte reste. Pas d'ouverture au clic dans
 * l'éditeur, pas de lien créé tout seul pendant la frappe ; `target`, `rel` et
 * `class` restent à null (le site choisit à l'affichage) et l'attribut `title`
 * de Tiptap est retiré (le document ne le connaît pas).
 */
export const MarqueLien = Link.extend({
  addAttributes() {
    // Toujours null, même pour un lien collé avec target="_blank" ou une classe.
    const toujoursNull = { default: null, parseHTML: () => null };
    return { href: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("href") }, target: toujoursNull, rel: toujoursNull, class: toujoursNull };
  },
}).configure({
  openOnClick: false,
  enableClickSelection: false,
  autolink: false,
  linkOnPaste: true,
  markdownLinks: false,
  defaultProtocol: "https",
  HTMLAttributes: { target: null, rel: null, class: null },
  isAllowedUri: (url) => estLienAutorise(url),
  shouldAutoLink: (url) => estLienAutorise(url),
});

/** Les extensions de l'éditeur, dans l'ordre (le rang des marques — lien, gras, italique — en découle). */
export function extensionsArticle({ placeholder = "Écrivez l'article ici…" }: { placeholder?: string } = {}): Extensions {
  return [
    StarterKit.configure({
      code: false,
      codeBlock: false,
      strike: false,
      underline: false,
      link: false,
      heading: { levels: [2, 3] },
      dropcursor: { color: "#e2bd72", width: 2 },
    }),
    MarqueLien,
    NoeudPhoto,
    Placeholder.configure({ placeholder }),
  ];
}

/**
 * HTML collé (Word, Google Docs, page web) avant l'analyse : un titre 1
 * devient un intertitre (h2), un titre 4 à 6 un sous-intertitre (h3), au lieu
 * d'un simple paragraphe. Renvoie aussi le nombre d'images écartées (autre
 * site, `data:`, sans dimensions…) pour prévenir Cédric.
 */
export function preparerHtmlColle(html: string): { html: string; imagesRefusees: number } {
  const titres = html.replace(/<(\/?)h1(?=[\s>])/gi, "<$1h2").replace(/<(\/?)h[456](?=[\s>])/gi, "<$1h3");
  let imagesRefusees = 0;
  if (typeof DOMParser !== "undefined" && /<img/i.test(titres)) {
    const doc = new DOMParser().parseFromString(titres, "text/html");
    for (const img of doc.querySelectorAll("img")) if (!attributsPhoto(img)) imagesRefusees++;
  }
  return { html: titres, imagesRefusees };
}

/**
 * Document d'ouverture de l'éditeur : un article neuf (`content: []`) reçoit
 * un paragraphe vide — un document ProseMirror contient toujours au moins un
 * bloc, sinon on ne pourrait pas y écrire. Il disparaît à l'enregistrement
 * (`documentDepuisEditeur` retire les paragraphes vides de la fin).
 */
export function contenuPourEditeur(contenu: unknown): JSONContent {
  const doc = contenu as JSONContent | null;
  if (!doc || doc.type !== "doc" || !Array.isArray(doc.content) || doc.content.length === 0) return { type: "doc", content: [{ type: "paragraph" }] };
  return doc;
}
