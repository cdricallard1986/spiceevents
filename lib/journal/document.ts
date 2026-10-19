import { z } from "zod";
import { LIMITES_ARTICLES, estCheminImage, longueur } from "./constantes";

/**
 * Contenu d'un article : le document JSON de l'éditeur visuel (Tiptap /
 * ProseMirror), colonne `contenu` de la table `articles`.
 *
 * Seul un petit sous-ensemble est autorisé — celui des articles d'aujourd'hui
 * et de l'éditeur à venir : paragraphes, intertitres (niveaux 2 et 3), listes,
 * citation, séparateur, saut de ligne, photos, et du texte en gras, en
 * italique ou en lien. Le validateur (`validerDocument`) est STRICT : tout
 * nœud, marque ou attribut inconnu est refusé, et un lien ne peut viser
 * qu'une adresse web, un email, un téléphone ou une page du site. Il sert à
 * la lecture publique ET aux Server Actions de l'éditeur : le rendu
 * (components/journal/ContenuArticle.tsx) ne reçoit jamais autre chose.
 */

// --- Types --------------------------------------------------------------------

export type MarqueGras = { type: "bold" };
export type MarqueItalique = { type: "italic" };
/**
 * Lien. `target`, `rel` et `class` sont les attributs que l'extension Link de
 * Tiptap écrit toujours dans son JSON : seuls `null` (ou leur absence) sont
 * acceptés — le rendu choisit lui-même (nouvel onglet pour l'extérieur).
 */
export type MarqueLien = { type: "link"; attrs: { href: string; target?: null; rel?: null; class?: null } };
export type Marque = MarqueGras | MarqueItalique | MarqueLien;

export type NoeudTexte = { type: "text"; text: string; marks?: Marque[] };
export type SautDeLigne = { type: "hardBreak"; marks?: Marque[] };
export type NoeudEnLigne = NoeudTexte | SautDeLigne;

export type Paragraphe = { type: "paragraph"; content?: NoeudEnLigne[] };
export type Intertitre = { type: "heading"; attrs: { level: 2 | 3 }; content?: NoeudEnLigne[] };
/** Élément de liste : un paragraphe, puis éventuellement d'autres blocs (schéma ProseMirror `paragraph block*`). */
export type ElementListe = { type: "listItem"; content: [Paragraphe, ...Bloc[]] };
export type ListePuces = { type: "bulletList"; content: ElementListe[] };
export type ListeNumerotee = { type: "orderedList"; attrs?: { start?: number; type?: null }; content: ElementListe[] };
export type Citation = { type: "blockquote"; content: Bloc[] };
export type Separateur = { type: "horizontalRule" };
/**
 * Photo : fichier du site (`/journal/…`) ou du bucket `medias` (`journal/…`),
 * dimensions réelles en pixels, texte alternatif obligatoire, légende
 * facultative (`title`, affichée sous la photo).
 */
export type AttributsImage = { src: string; width: number; height: number; alt: string; title?: string | null };
export type Image = { type: "image"; attrs: AttributsImage };
export type Bloc = Paragraphe | Intertitre | ListePuces | ListeNumerotee | Citation | Separateur | Image;
export type DocumentArticle = { type: "doc"; content: Bloc[] };

/** Document d'un article neuf (valeur par défaut de la colonne). */
export const DOCUMENT_VIDE: DocumentArticle = { type: "doc", content: [] };

// --- Liens ----------------------------------------------------------------------

/**
 * Adresse acceptée pour un lien du texte :
 * - une page du site : `/…` (jamais `//…`, qui viserait un autre domaine) ;
 * - une adresse web `https://…` ou `http://…` (les deux sont sans danger pour
 *   un lien de navigation ; `http://` est gardé pour deux liens externes des
 *   articles d'origine, dont la version https n'est pas vérifiée) ;
 * - `mailto:` (une adresse avec @) ou `tel:` (chiffres, +, points, tirets, parenthèses).
 * Tout le reste est refusé : `javascript:`, `data:`, `vbscript:`, ancre seule, espaces…
 */
export function estLienAutorise(href: string): boolean {
  if (typeof href !== "string" || href.length === 0 || longueur(href) > LIMITES_ARTICLES.lien) return false;
  // Aucun espace ni caractère de contrôle (les navigateurs les ignorent : `java\tscript:`).
  if (/[\s\u0000-\u001f\u007f\\]/.test(href)) return false;
  if (href.startsWith("/")) return !href.startsWith("//");
  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") && !url.username && !url.password;
    } catch {
      return false;
    }
  }
  if (href.startsWith("mailto:")) return /^mailto:[^@/:]+@[^@/:]+\.[^@/:]+$/.test(href);
  if (href.startsWith("tel:")) return /^tel:\+?[0-9().-]{3,30}$/.test(href);
  return false;
}

// --- Validateur Zod -------------------------------------------------------------

const MESSAGE_LIEN = "Lien refusé : seules les adresses https://, http://, mailto:, tel: et les pages du site (/…) sont acceptées.";

const schemaMarque = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("bold") }),
  z.strictObject({ type: z.literal("italic") }),
  z.strictObject({
    type: z.literal("link"),
    attrs: z.strictObject({
      href: z.string().refine(estLienAutorise, MESSAGE_LIEN),
      target: z.null().optional(),
      rel: z.null().optional(),
      class: z.null().optional(),
    }),
  }),
]);

const schemaMarques = z
  .array(schemaMarque)
  .max(3)
  .refine((marques) => new Set(marques.map((m) => m.type)).size === marques.length, "Une même marque est appliquée deux fois.")
  .optional();

const schemaEnLigne = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("text"), text: z.string().min(1, "Texte vide."), marks: schemaMarques }),
  z.strictObject({ type: z.literal("hardBreak"), marks: schemaMarques }),
]);

const contenuEnLigne = z.array(schemaEnLigne).optional();

const schemaParagraphe = z.strictObject({ type: z.literal("paragraph"), content: contenuEnLigne });

const schemaIntertitre = z.strictObject({
  type: z.literal("heading"),
  attrs: z.strictObject({ level: z.union([z.literal(2), z.literal(3)], "Intertitre : niveau 2 ou 3 seulement.") }),
  content: contenuEnLigne,
});

const schemaSeparateur = z.strictObject({ type: z.literal("horizontalRule") });

const dimension = z.number().int().min(1).max(20000);

const schemaImage = z.strictObject({
  type: z.literal("image"),
  attrs: z.strictObject({
    src: z.string().refine(estCheminImage, "Photo : fichier du site (/journal/…) ou du stockage (journal/…) seulement."),
    width: dimension,
    height: dimension,
    alt: z
      .string("Photo : texte alternatif obligatoire.")
      .refine((v) => v.trim().length > 0, "Photo : texte alternatif obligatoire.")
      .refine((v) => longueur(v) <= LIMITES_ARTICLES.altImage, `Photo : texte alternatif de ${LIMITES_ARTICLES.altImage} caractères au maximum.`),
    title: z
      .string()
      .refine((v) => longueur(v) <= LIMITES_ARTICLES.legendeImage, `Photo : légende de ${LIMITES_ARTICLES.legendeImage} caractères au maximum.`)
      .nullable()
      .optional(),
  }),
});

// Récursion (listes et citations contiennent des blocs) : `z.lazy`.
const schemaBloc: z.ZodType<Bloc> = z.lazy(() =>
  z.discriminatedUnion("type", [schemaParagraphe, schemaIntertitre, schemaListePuces, schemaListeNumerotee, schemaCitation, schemaSeparateur, schemaImage]),
);

const schemaElementListe = z.strictObject({ type: z.literal("listItem"), content: z.tuple([schemaParagraphe], schemaBloc) });

const schemaListePuces = z.strictObject({ type: z.literal("bulletList"), content: z.array(schemaElementListe).min(1) });

const schemaListeNumerotee = z.strictObject({
  type: z.literal("orderedList"),
  attrs: z.strictObject({ start: z.number().int().min(1).max(10000).optional(), type: z.null().optional() }).optional(),
  content: z.array(schemaElementListe).min(1),
});

const schemaCitation = z.strictObject({ type: z.literal("blockquote"), content: z.array(schemaBloc).min(1) });

export const schemaDocument: z.ZodType<DocumentArticle> = z.strictObject({ type: z.literal("doc"), content: z.array(schemaBloc) });

/** Taille maximale du document (JSON, en caractères) et profondeur d'imbrication des blocs. */
export const TAILLE_MAX_DOCUMENT = 1_000_000;
export const PROFONDEUR_MAX_DOCUMENT = 12;

/** Profondeur d'imbrication des nœuds, sans récursion (un document hostile ne fait pas déborder la pile). */
function profondeur(racine: unknown): number {
  let max = 0;
  const pile: [unknown, number][] = [[racine, 0]];
  while (pile.length) {
    const [noeud, n] = pile.pop()!;
    max = Math.max(max, n);
    if (max > PROFONDEUR_MAX_DOCUMENT) return max;
    const contenu = noeud && typeof noeud === "object" ? (noeud as { content?: unknown }).content : undefined;
    if (Array.isArray(contenu)) for (const enfant of contenu) pile.push([enfant, n + 1]);
  }
  return max;
}

export type ValidationDocument = { ok: true; document: DocumentArticle } | { ok: false; message: string };

/** Valide un document (lecture en base, Server Actions) ; en erreur, un message en clair avec l'endroit fautif. */
export function validerDocument(brut: unknown): ValidationDocument {
  let taille: number;
  try {
    taille = JSON.stringify(brut)?.length ?? 0;
  } catch {
    return { ok: false, message: "Contenu illisible." };
  }
  if (taille > TAILLE_MAX_DOCUMENT) return { ok: false, message: "Contenu trop long." };
  if (profondeur(brut) > PROFONDEUR_MAX_DOCUMENT) return { ok: false, message: "Contenu trop imbriqué (listes ou citations)." };
  const r = schemaDocument.safeParse(brut);
  if (r.success) return { ok: true, document: r.data };
  const p = r.error.issues[0];
  const endroit = p.path.length ? ` (${p.path.join(".")})` : "";
  return { ok: false, message: `Contenu invalide${endroit} : ${p.message}` };
}

// --- Utilitaires ------------------------------------------------------------------

function texteEnLigne(contenu: NoeudEnLigne[] = []): string {
  return contenu.map((n) => (n.type === "text" ? n.text : "\n")).join("");
}

function texteBloc(b: Bloc): string {
  switch (b.type) {
    case "paragraph":
    case "heading":
      return texteEnLigne(b.content);
    case "bulletList":
    case "orderedList":
      return b.content.map((li) => li.content.map(texteBloc).join("\n")).join("\n");
    case "blockquote":
      return b.content.map(texteBloc).join("\n");
    case "horizontalRule":
    case "image":
      return "";
  }
}

/**
 * Texte brut du document : le texte de chaque bloc, un bloc par ligne (les
 * photos n'y figurent pas). Sert au temps de lecture et aux vérifications.
 */
export function texteBrut(document: DocumentArticle): string {
  return document.content
    .map(texteBloc)
    .filter((t) => t !== "")
    .join("\n");
}

export const MOTS_PAR_MINUTE = 200;

/**
 * Temps de lecture en minutes (au moins 1), à 200 mots par minute. Un mot
 * est une suite de caractères qui contient une lettre ou un chiffre. Les
 * mots sont comptés morceau de texte par morceau de texte, un tiret
 * séparant deux mots : c'est le compte d'avant le back office (calculé sur
 * le Markdown, où un lien ou du gras coupait le mot : « l’[éclairage](…) »),
 * pour que le temps affiché des articles importés ne change pas.
 */
export function tempsDeLecture(document: DocumentArticle): number {
  let mots = 0;
  const compter = (texte: string) => {
    mots += texte
      .replace(/[-_]/g, " ")
      .split(/\s+/)
      .filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
  };
  const parcourir = (blocs: Bloc[]) => {
    for (const b of blocs) {
      if (b.type === "paragraph" || b.type === "heading") for (const n of b.content ?? []) if (n.type === "text") compter(n.text);
      if (b.type === "bulletList" || b.type === "orderedList") for (const li of b.content) parcourir(li.content);
      if (b.type === "blockquote") parcourir(b.content);
    }
  };
  parcourir(document.content);
  return Math.max(1, Math.ceil(mots / MOTS_PAR_MINUTE));
}

function blocsAPlat(blocs: Bloc[]): Bloc[] {
  return blocs.flatMap((b) => {
    if (b.type === "bulletList" || b.type === "orderedList") return [b, ...b.content.flatMap((li) => blocsAPlat(li.content))];
    if (b.type === "blockquote") return [b, ...blocsAPlat(b.content)];
    return [b];
  });
}

/** Les photos du document, dans l'ordre de lecture (listes et citations comprises). */
export function imagesDuDocument(document: DocumentArticle): AttributsImage[] {
  return blocsAPlat(document.content).flatMap((b) => (b.type === "image" ? [b.attrs] : []));
}

/** Les liens du document dans l'ordre : adresse et texte (les morceaux contigus d'un même lien sont réunis). */
export function liensDuDocument(document: DocumentArticle): { href: string; texte: string }[] {
  const liens: { href: string; texte: string }[] = [];
  for (const b of blocsAPlat(document.content)) {
    if (b.type !== "paragraph" && b.type !== "heading") continue;
    let precedent: string | null = null;
    for (const n of b.content ?? []) {
      const lien = n.marks?.find((m): m is MarqueLien => m.type === "link");
      if (!lien) {
        precedent = null;
        continue;
      }
      const texte = n.type === "text" ? n.text : "\n";
      if (precedent === lien.attrs.href) liens[liens.length - 1].texte += texte;
      else liens.push({ href: lien.attrs.href, texte });
      precedent = lien.attrs.href;
    }
  }
  return liens;
}
