import { fromMarkdown } from "mdast-util-from-markdown";
import { z } from "zod";
import { uuidV5 } from "@/lib/uuid";
import { CATEGORIES, LIMITES_ARTICLES, estCheminImage, longueur } from "./constantes";
import type { Bloc, DocumentArticle, ElementListe, Marque, NoeudEnLigne, Paragraphe } from "./document";
import type { LigneArticle } from "./types";

/**
 * Conversion des articles MDX d'avant le back office (`contenu/journal/*.mdx`,
 * écrits par `outils/convertir_journal.py`) au format de la table `articles` :
 * en-tête → colonnes, corps Markdown → document de l'éditeur (lib/journal/document.ts).
 *
 * Logique pure (sans lecture de fichier) : elle produit l'import en base
 * (migration 0009, `outils/convertir_articles.mjs`) ET les données de secours
 * lues sans Supabase (`repli.ts`), pour qu'il n'y ait qu'un seul rendu.
 *
 * Le corps est lu par le même analyseur Markdown que MDX (micromark, via
 * `mdast-util-from-markdown`). Les articles n'utilisent que du Markdown simple
 * et le composant `<PhotoArticle … />` : toute autre construction (code,
 * tableau, image Markdown, HTML…) fait échouer la conversion, en nommant le
 * fichier et la ligne, plutôt que d'être perdue en silence.
 */

// --- En-tête --------------------------------------------------------------------

/** En-tête d'un fichier MDX, validé à la lecture. */
export const schemaEnTete = z.object({
  titre: z.string().min(1).max(LIMITES_ARTICLES.titre),
  sousTitre: z.string().min(1).max(LIMITES_ARTICLES.sousTitre).optional(),
  description: z.string().min(1).refine((v) => longueur(v) <= LIMITES_ARTICLES.description, "160 caractères au maximum"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date attendue au format AAAA-MM-JJ"),
  categorie: z.enum(CATEGORIES),
  couverture: z.string().startsWith("/journal/").refine(estCheminImage, "chemin de couverture invalide"),
  couvertureAlt: z.string().min(1).max(LIMITES_ARTICLES.couvertureAlt),
});

export type EnTeteArticle = z.infer<typeof schemaEnTete>;

/**
 * Lit l'en-tête d'un fichier MDX. Le script de conversion écrit une valeur JSON par
 * ligne (`cle: "valeur"`), ce qui est aussi du YAML valide.
 */
export function lireEnTete(source: string): { donnees: Record<string, unknown>; corps: string } {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error("En-tête manquant (bloc --- … --- en début de fichier)");
  const donnees: Record<string, unknown> = {};
  for (const ligne of m[1].split(/\r?\n/)) {
    if (!ligne.trim()) continue;
    const i = ligne.indexOf(":");
    if (i < 1) throw new Error(`Ligne d'en-tête illisible : ${ligne}`);
    const valeur = ligne.slice(i + 1).trim();
    try {
      donnees[ligne.slice(0, i).trim()] = JSON.parse(valeur);
    } catch {
      donnees[ligne.slice(0, i).trim()] = valeur;
    }
  }
  return { donnees, corps: source.slice(m[0].length) };
}

/** Valide un en-tête ; l'erreur nomme le fichier et le champ fautif. */
export function validerEnTete(donnees: unknown, fichier = "article"): EnTeteArticle {
  const resultat = schemaEnTete.safeParse(donnees);
  if (!resultat.success) {
    const detail = resultat.error.issues.map((e) => `${e.path.join(".") || "(racine)"} : ${e.message}`).join(" ; ");
    throw new Error(`En-tête invalide dans ${fichier} — ${detail}`);
  }
  return resultat.data;
}

// --- Corps ----------------------------------------------------------------------

/** Nœud de l'arbre Markdown (mdast), lu champ par champ : tout type inattendu est refusé. */
type NoeudMd = { type: string; children?: NoeudMd[]; position?: { start: { line: number } }; [champ: string]: unknown };

/** Ordre des marques dans le JSON : celui de l'éditeur (le lien d'abord, puis gras, italique). */
const RANG_MARQUE: Record<Marque["type"], number> = { link: 0, bold: 1, italic: 2 };

function memesMarques(a: Marque[] = [], b: Marque[] = []): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

class ErreurConversion extends Error {}

function echec(fichier: string, noeud: { position?: { start: { line: number } } }, message: string): never {
  const ligne = noeud.position ? `, ligne ${noeud.position.start.line} du corps` : "";
  throw new ErreurConversion(`${fichier}${ligne} : ${message}`);
}

/** Texte en ligne (enfants d'un paragraphe ou d'un intertitre) → nœuds `text` / `hardBreak` avec leurs marques. */
function enLigne(enfants: NoeudMd[], marques: Marque[], fichier: string, sortie: NoeudEnLigne[] = []): NoeudEnLigne[] {
  const avec = (m: Marque) =>
    [...marques.filter((x) => x.type !== m.type), m].sort((a, b) => RANG_MARQUE[a.type] - RANG_MARQUE[b.type]);
  for (const n of enfants) {
    if (n.type === "text") {
      // Un retour à la ligne simple dans un paragraphe Markdown s'affiche comme une espace.
      const texte = String(n.value).replace(/[ \t]*\n[ \t]*/g, " ");
      if (!texte) continue;
      const precedent = sortie[sortie.length - 1];
      if (precedent?.type === "text" && memesMarques(precedent.marks, marques)) precedent.text += texte;
      else sortie.push(marques.length ? { type: "text", text: texte, marks: marques } : { type: "text", text: texte });
    } else if (n.type === "strong") enLigne(n.children ?? [], avec({ type: "bold" }), fichier, sortie);
    else if (n.type === "emphasis") enLigne(n.children ?? [], avec({ type: "italic" }), fichier, sortie);
    else if (n.type === "link") {
      if (n.title) echec(fichier, n, `lien avec un titre (« ${String(n.title)} ») : non pris en charge`);
      enLigne(n.children ?? [], avec({ type: "link", attrs: { href: String(n.url) } }), fichier, sortie);
    } else if (n.type === "break") sortie.push(marques.length ? { type: "hardBreak", marks: marques } : { type: "hardBreak" });
    else echec(fichier, n, `élément « ${n.type} » non pris en charge dans le texte`);
  }
  return sortie;
}

function paragraphe(n: NoeudMd, fichier: string): Paragraphe {
  const contenu = enLigne(n.children ?? [], [], fichier);
  return contenu.length ? { type: "paragraph", content: contenu } : { type: "paragraph" };
}

/** `<PhotoArticle src="…" width={1200} height={800} alt="…" />` → nœud `image`. */
function photo(n: NoeudMd, fichier: string): Bloc {
  const html = String(n.value ?? "").trim();
  const m = html.match(/^<PhotoArticle\s+([\s\S]*?)\s*\/>$/);
  if (!m) echec(fichier, n, `HTML ou composant non pris en charge : ${html.slice(0, 80)}`);
  const attributs: Record<string, string | number> = {};
  let reste = m[1];
  for (const a of m[1].matchAll(/(\w+)=(?:"([^"]*)"|\{(\d+)\})/g)) {
    if (a[1] in attributs) echec(fichier, n, `attribut « ${a[1]} » en double`);
    attributs[a[1]] = a[2] ?? Number(a[3]);
    reste = reste.replace(a[0], "");
  }
  if (reste.trim()) echec(fichier, n, `PhotoArticle : attributs illisibles (${reste.trim()})`);
  const { src, width, height, alt, ...autres } = attributs;
  if (Object.keys(autres).length) echec(fichier, n, `PhotoArticle : attribut inconnu (${Object.keys(autres).join(", ")})`);
  if (typeof src !== "string" || !estCheminImage(src)) echec(fichier, n, `PhotoArticle : src invalide (${String(src)})`);
  if (typeof width !== "number" || typeof height !== "number") echec(fichier, n, "PhotoArticle : width et height attendus en nombres ({1200})");
  // Une entité HTML (&amp;…) serait décodée par MDX : aucune n'est attendue, on refuse plutôt que de changer le texte.
  if (typeof alt !== "string" || !alt.trim() || alt.includes("&")) echec(fichier, n, "PhotoArticle : alt manquant ou avec une entité HTML");
  return { type: "image", attrs: { src, width, height, alt } };
}

function bloc(n: NoeudMd, fichier: string): Bloc {
  const enfants = n.children ?? [];
  switch (n.type) {
    case "paragraph":
      return paragraphe(n, fichier);
    case "heading": {
      if (n.depth !== 2 && n.depth !== 3) echec(fichier, n, `intertitre de niveau ${String(n.depth)} : seuls ## et ### sont pris en charge`);
      const contenu = enLigne(enfants, [], fichier);
      return { type: "heading", attrs: { level: n.depth as 2 | 3 }, ...(contenu.length ? { content: contenu } : {}) };
    }
    case "list": {
      const elements = enfants.map((li): ElementListe => {
        if (li.type !== "listItem") echec(fichier, li, `élément de liste inattendu (${li.type})`);
        const blocs = (li.children ?? []).map((b) => bloc(b, fichier));
        const [premier, ...suite] = blocs;
        if (premier?.type !== "paragraph") echec(fichier, li, "un élément de liste doit commencer par du texte");
        return { type: "listItem", content: [premier, ...suite] };
      });
      if (!n.ordered) return { type: "bulletList", content: elements };
      const debut = typeof n.start === "number" ? n.start : 1;
      return { type: "orderedList", attrs: { start: debut }, content: elements };
    }
    case "blockquote":
      return { type: "blockquote", content: enfants.map((b) => bloc(b, fichier)) };
    case "thematicBreak":
      return { type: "horizontalRule" };
    case "html":
      return photo(n, fichier);
    default:
      return echec(fichier, n, `bloc « ${n.type} » non pris en charge`);
  }
}

/** Corps Markdown d'un article (sans l'en-tête) → document de l'éditeur. */
export function documentDepuisMarkdown(corps: string, fichier = "article"): DocumentArticle {
  const racine = fromMarkdown(corps);
  return { type: "doc", content: (racine.children as unknown as NoeudMd[]).map((n) => bloc(n, fichier)) };
}

// --- Article complet ------------------------------------------------------------

/** Espace de noms des identifiants des articles importés (UUID v5 du slug). */
export const ESPACE_ARTICLES = "8f3c2a71-5d4e-4b9a-a6c8-2e1f0d7b3c95";

/** Identifiant fixe d'un article importé : l'import en base et les données de secours portent le même. */
export function idArticle(slug: string): string {
  return uuidV5(slug, ESPACE_ARTICLES);
}

/**
 * Horodatage de publication d'un article importé : sa date, à midi heure de
 * Paris (`2026-01-27T12:00:00+01:00`, `2026-07-14T12:00:00+02:00`).
 */
export function publieLeMidiParis(date: string): string {
  const parties = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "longOffset" }).formatToParts(
    new Date(`${date}T12:00:00Z`),
  );
  const decalage = parties.find((p) => p.type === "timeZoneName")?.value.replace(/^GMT/, "") || "+00:00";
  return `${date}T12:00:00${decalage}`;
}

/** Un fichier MDX (`<slug>.mdx`) → ligne de la table `articles`, publiée. */
export function ligneDepuisMdx(slug: string, source: string): LigneArticle {
  const fichier = `contenu/journal/${slug}.mdx`;
  const { donnees, corps } = lireEnTete(source);
  const e = validerEnTete(donnees, fichier);
  return {
    id: idArticle(slug),
    statut: "publie",
    publie_le: publieLeMidiParis(e.date),
    slug,
    titre: e.titre,
    sous_titre: e.sousTitre ?? null,
    description: e.description,
    categorie: e.categorie,
    date_publication: e.date,
    couverture: e.couverture,
    couverture_alt: e.couvertureAlt,
    contenu: documentDepuisMarkdown(corps, fichier),
  };
}
