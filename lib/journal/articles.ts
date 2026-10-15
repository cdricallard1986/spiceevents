import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * Articles du journal (français seulement) : fichiers MDX de `contenu/journal/`,
 * produits par `outils/convertir_journal.py`. Lus au build (pages statiques).
 */

export const CATEGORIES = [
  "Conseils mariage",
  "Musique & ambiance",
  "Technique",
  "Animations",
  "Mariages réalisés",
] as const;

export type Categorie = (typeof CATEGORIES)[number];

/** En-tête YAML d'un article, validé à la lecture. */
export const schemaEnTete = z.object({
  titre: z.string().min(1),
  sousTitre: z.string().min(1).optional(),
  description: z.string().min(1).max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date attendue au format AAAA-MM-JJ"),
  categorie: z.enum(CATEGORIES),
  couverture: z.string().startsWith("/journal/"),
  couvertureAlt: z.string().min(1),
});

export type EnTeteArticle = z.infer<typeof schemaEnTete>;

export type Article = EnTeteArticle & {
  slug: string;
  /** Source MDX complète (en-tête compris), compilée par la page de l'article. */
  source: string;
  /** Minutes de lecture estimées. */
  lecture: number;
};

const DOSSIER = path.join(process.cwd(), "contenu", "journal");
const MOTS_PAR_MINUTE = 200;

/**
 * Lit l'en-tête d'un fichier MDX. Le script de conversion écrit une valeur JSON par
 * ligne (`cle: "valeur"`), ce qui est aussi du YAML valide pour `compileMDX`.
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

/** Temps de lecture en minutes (au moins 1), composants et syntaxe Markdown exclus. */
export function tempsDeLecture(corps: string): number {
  const texte = corps
    .replace(/<[^>]+>/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#>*_[\]`-]/g, " ");
  const mots = texte.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
  return Math.max(1, Math.ceil(mots / MOTS_PAR_MINUTE));
}

/** Du plus récent au plus ancien ; à date égale, ordre alphabétique du titre. */
export function trierParDate<T extends { date: string; titre: string }>(liste: T[]): T[] {
  return [...liste].sort((a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre, "fr"));
}

/** Ancre d'une catégorie dans la page du journal : « Musique & ambiance » → `musique-ambiance`. */
export function ancreCategorie(categorie: Categorie): string {
  return categorie
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** « 2026-02-03 » → « 3 février 2026 ». */
export function formaterDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** Articles liés : même catégorie d'abord (les plus récents), complétés par les plus récents. */
export function articlesLies<T extends { slug: string; categorie: string; date: string; titre: string }>(
  tous: T[],
  courant: T,
  nombre = 3,
): T[] {
  const autres = trierParDate(tous.filter((a) => a.slug !== courant.slug));
  const memeCategorie = autres.filter((a) => a.categorie === courant.categorie);
  const reste = autres.filter((a) => a.categorie !== courant.categorie);
  return [...memeCategorie, ...reste].slice(0, nombre);
}

function lireArticle(fichier: string): Article {
  const source = fs.readFileSync(path.join(DOSSIER, fichier), "utf8");
  const { donnees, corps } = lireEnTete(source);
  const enTete = validerEnTete(donnees, `contenu/journal/${fichier}`);
  return { ...enTete, slug: fichier.replace(/\.mdx$/, ""), source, lecture: tempsDeLecture(corps) };
}

let cache: Article[] | undefined;

/** Tous les articles, du plus récent au plus ancien. */
export function articles(): Article[] {
  cache ??= trierParDate(
    fs
      .readdirSync(DOSSIER)
      .filter((f) => f.endsWith(".mdx"))
      .map(lireArticle),
  );
  return cache;
}

export function articleParSlug(slug: string): Article | undefined {
  return articles().find((a) => a.slug === slug);
}
