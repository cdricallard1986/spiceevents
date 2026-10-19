import { TYPES_IMAGE, type TypeImage } from "@/lib/photos/envoi";
import { BUCKET_MEDIAS } from "@/lib/photos/constantes";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { CATEGORIES, LIMITES_ARTICLES, estCheminImage, type Categorie } from "./constantes";
import { estLienAutorise, type Bloc } from "./document";
import type { ErreursArticle, FormulaireArticle } from "./schema";
import { slugDepuisTitre } from "./slug";
import type { LigneArticle, StatutArticle } from "./types";

/**
 * Logique pure du journal dans le back office (/admin/journal) : liste,
 * filtres, adresse proposée, formulaire de l'éditeur, nettoyage des
 * brouillons vides, liens et photos de l'éditeur visuel. Sans Zod ni Tiptap :
 * ce fichier est aussi chargé par le navigateur.
 */

// --- Résultats des Server Actions ------------------------------------------------

export type ResultatEchec = { ok: false; message: string; erreurs?: ErreursArticle };

/** Un article tel que l'éditeur le reçoit (la ligne, avec sa dernière modification). */
export type LigneArticleAdmin = LigneArticle & { updated_at: string };

export type ResultatCreationArticle = { ok: true; id: string } | ResultatEchec;
export type ResultatArticle = { ok: true; article: LigneArticleAdmin; avertissement?: string } | ResultatEchec;
export type ResultatSuppressionArticle = { ok: true; id: string } | ResultatEchec;
export type ResultatUrlEnvoiArticle = { ok: true; chemin: string; jeton: string } | ResultatEchec;
/** Photo de la photothèque copiée dans le dossier du journal (couverture). */
export type ResultatCopiePhoto = { ok: true; chemin: string; alt: string } | ResultatEchec;

// --- Liste ------------------------------------------------------------------------

/** Ce que la liste affiche (sans le contenu). */
export type ArticleListe = Pick<LigneArticle, "id" | "statut" | "publie_le" | "slug" | "titre" | "categorie" | "date_publication"> & {
  updated_at: string;
};

export const COLONNES_LISTE = "id, statut, publie_le, slug, titre, categorie, date_publication, updated_at";
export const COLONNES_ARTICLE_ADMIN =
  "id, statut, publie_le, slug, titre, sous_titre, description, categorie, date_publication, couverture, couverture_alt, contenu, updated_at";

export type FiltreStatut = "tous" | "brouillons" | "publies";
export type FiltresArticles = { statut: FiltreStatut; recherche: string; categorie: Categorie | "toutes" };
export const FILTRES_ARTICLES_PAR_DEFAUT: FiltresArticles = { statut: "tous", recherche: "", categorie: "toutes" };

export function filtresArticlesActifs(f: FiltresArticles): boolean {
  return f.statut !== "tous" || f.recherche.trim() !== "" || f.categorie !== "toutes";
}

/** Sans accents ni majuscules, pour la recherche. */
export function pourRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Ordre de la liste : les brouillons en tête (le plus récemment modifié
 * d'abord), puis les articles publiés du plus récent au plus ancien (date
 * affichée, puis titre).
 */
export function trierArticlesAdmin<T extends ArticleListe>(liste: readonly T[]): T[] {
  return [...liste].sort((a, b) => {
    if (a.statut !== b.statut) return a.statut === "brouillon" ? -1 : 1;
    if (a.statut === "brouillon") return b.updated_at.localeCompare(a.updated_at);
    return (b.date_publication ?? "").localeCompare(a.date_publication ?? "") || a.titre.localeCompare(b.titre, "fr");
  });
}

export function filtrerArticles<T extends ArticleListe>(liste: readonly T[], f: FiltresArticles): T[] {
  const cherche = pourRecherche(f.recherche.trim());
  return trierArticlesAdmin(
    liste.filter(
      (a) =>
        (f.statut === "tous" || (f.statut === "brouillons" ? a.statut === "brouillon" : a.statut === "publie")) &&
        (f.categorie === "toutes" || a.categorie === f.categorie) &&
        (cherche === "" || pourRecherche(a.titre).includes(cherche)),
    ),
  );
}

export const LIBELLES_STATUT: Record<StatutArticle, string> = { brouillon: "Brouillon", publie: "Publié" };

// --- Adresse (slug) ----------------------------------------------------------------

/** Adresse provisoire d'un brouillon neuf, tant qu'il n'a pas de titre : `brouillon-<aléa>`. */
export const PREFIXE_SLUG_PROVISOIRE = "brouillon-";

export function slugProvisoire(alea: string): string {
  const propre = alea.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (propre.length < 6) throw new Error("Aléa trop court pour une adresse provisoire.");
  return `${PREFIXE_SLUG_PROVISOIRE}${propre}`;
}

export function estSlugProvisoire(slug: string): boolean {
  return /^brouillon-[a-z0-9]{6,}$/.test(slug);
}

/**
 * L'adresse suit-elle encore le titre ? Oui pour un article jamais publié
 * dont l'adresse est la provisoire, celle du titre, ou celle du titre suivie
 * d'un numéro (`-2`, `-3`… : l'adresse du titre était déjà prise). Une adresse
 * saisie à la main, ou celle d'un article déjà publié, ne bouge plus.
 */
export function slugSuitLeTitre(l: Pick<LigneArticle, "slug" | "titre" | "publie_le">): boolean {
  if (l.publie_le !== null) return false;
  if (estSlugProvisoire(l.slug)) return true;
  const base = slugDepuisTitre(l.titre);
  if (!base) return false;
  if (l.slug === base) return true;
  const suite = l.slug.match(/^(.*)-(\d+)$/);
  if (!suite || Number(suite[2]) < 2) return false;
  // `slugLibre` raccourcit l'adresse du titre pour que le numéro tienne dans les 120 caractères.
  const raccourcie = base.length + 1 + suite[2].length > LIMITES_ARTICLES.slug;
  return suite[1] === base || (raccourcie && suite[1].length > 0 && base.startsWith(`${suite[1]}-`));
}

/** Adresse proposée d'après le titre ; sans lettre ni chiffre dans le titre : l'adresse actuelle. */
export function slugPropose(titre: string, actuel: string): string {
  return slugDepuisTitre(titre) || actuel;
}

// --- Formulaire de l'éditeur ---------------------------------------------------------

/** Le formulaire de l'éditeur : les champs de l'article + « l'adresse suit le titre ». */
export type FormulaireEditeur = FormulaireArticle & { slugAuto: boolean };

export function formulaireDepuisLigne(l: LigneArticle): FormulaireEditeur {
  return {
    slug: l.slug,
    titre: l.titre,
    sous_titre: l.sous_titre ?? "",
    description: l.description ?? "",
    categorie: l.categorie ?? "",
    date_publication: l.date_publication ?? "",
    couverture: l.couverture ?? "",
    couverture_alt: l.couverture_alt ?? "",
    contenu: l.contenu,
    slugAuto: slugSuitLeTitre(l),
  };
}

// --- Brouillons jamais remplis -------------------------------------------------------

export const DELAI_BROUILLON_VIDE_MS = 24 * 60 * 60 * 1000;

function blocVide(b: unknown): boolean {
  if (!b || typeof b !== "object") return false;
  const bloc = b as Partial<Bloc> & { content?: unknown[] };
  // Un paragraphe vide (ou fait d'espaces) : ce qu'un éditeur neuf contient.
  if (bloc.type !== "paragraph") return false;
  return (bloc.content ?? []).every((n) => {
    const noeud = n as { type?: string; text?: string };
    return noeud.type === "text" && typeof noeud.text === "string" && noeud.text.trim() === "";
  });
}

/** Document sans texte ni photo (rien, ou des paragraphes vides). */
export function documentVide(contenu: unknown): boolean {
  if (!contenu || typeof contenu !== "object") return false;
  const doc = contenu as { type?: unknown; content?: unknown };
  if (doc.type !== "doc") return false;
  if (doc.content === undefined) return true;
  return Array.isArray(doc.content) && doc.content.every(blocVide);
}

/**
 * Brouillon ouvert puis abandonné sans rien écrire (« Nouvel article »
 * cliqué par erreur) : jamais publié, ni titre, ni sous-titre, ni
 * description, ni couverture, ni contenu, et pas modifié depuis 24 heures.
 * Supprimé à l'ouverture de la liste.
 */
export function estBrouillonVide(
  l: Pick<LigneArticle, "statut" | "publie_le" | "titre" | "sous_titre" | "description" | "couverture" | "contenu"> & { updated_at: string },
  maintenant: Date,
): boolean {
  if (l.statut !== "brouillon" || l.publie_le !== null) return false;
  if (l.titre.trim() || l.sous_titre?.trim() || l.description?.trim() || l.couverture) return false;
  const modifie = Date.parse(l.updated_at);
  if (Number.isNaN(modifie) || maintenant.getTime() - modifie < DELAI_BROUILLON_VIDE_MS) return false;
  return documentVide(l.contenu);
}

// --- Document de l'éditeur ------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [cle: string]: Json };

function sansNulls(attrs: Record<string, Json>, cles: readonly string[]): Record<string, Json> {
  const sortie = { ...attrs };
  for (const c of cles) if (sortie[c] === null || sortie[c] === undefined || sortie[c] === "") delete sortie[c];
  return sortie;
}

/**
 * JSON de l'éditeur → forme enregistrée, celle des articles importés : les
 * attributs que Tiptap écrit toujours à `null` sont retirés (`target`, `rel`,
 * `class` d'un lien, `type` d'une liste numérotée, légende vide d'une photo).
 * Le validateur (`validerDocument`) accepte les deux formes ; celle-ci garde
 * la base lisible et rend l'aller-retour base → éditeur → base exact. Les
 * paragraphes vides de la fin sont retirés (l'éditeur en garde toujours un
 * après une photo ou une liste finale, pour pouvoir écrire dessous ; le site
 * ne les affiche pas). Rien d'autre n'est touché (texte, marques, blocs).
 */
export function documentDepuisEditeur(json: unknown): unknown {
  const parcourir = (n: Json): Json => {
    if (Array.isArray(n)) return n.map(parcourir);
    if (!n || typeof n !== "object") return n;
    const sortie: Record<string, Json> = {};
    for (const [cle, valeur] of Object.entries(n)) sortie[cle] = parcourir(valeur);
    const attrs = sortie.attrs;
    if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
      if (sortie.type === "link") sortie.attrs = sansNulls(attrs, ["target", "rel", "class"]);
      else if (sortie.type === "orderedList") sortie.attrs = sansNulls(attrs, ["type"]);
      else if (sortie.type === "image") sortie.attrs = sansNulls(attrs, ["title"]);
    }
    return sortie;
  };
  const sortie = parcourir(json as Json);
  if (sortie && typeof sortie === "object" && !Array.isArray(sortie) && sortie.type === "doc" && Array.isArray(sortie.content)) {
    const blocs = [...sortie.content];
    while (blocs.length && blocVide(blocs[blocs.length - 1]) && !(blocs[blocs.length - 1] as { content?: unknown[] }).content?.length) blocs.pop();
    return { ...sortie, content: blocs };
  }
  return sortie;
}

// --- Liens de l'éditeur ----------------------------------------------------------------

export type AdresseLien = { ok: true; href: string } | { ok: false; message: string };

export const AIDE_LIEN = "Une adresse web (https://…), un email, un téléphone (tel:…) ou une page du site : pour une page du site, collez par exemple /mariages.";

/**
 * Adresse saisie dans la fenêtre « Lien » → adresse acceptée par le
 * document (`estLienAutorise`). Complète ce qui est sans ambiguïté :
 * `www.exemple.fr` → `https://www.exemple.fr`, `nom@exemple.fr` →
 * `mailto:nom@exemple.fr`, et une adresse du site collée en entier
 * (`https://www.spiceevents.fr/mariages`) reste telle quelle. Tout autre
 * schéma (`javascript:`…) est refusé.
 */
export function normaliserAdresseLien(saisie: string): AdresseLien {
  const v = saisie.trim();
  if (!v) return { ok: false, message: "Indiquez l'adresse du lien." };
  let href = v;
  if (/^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(v)) href = `mailto:${v}`;
  else if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v) && !v.startsWith("/")) href = `https://${v}`;
  else if (/^\+?[0-9 ().-]{6,}$/.test(v)) href = `tel:${v.replace(/[\s]/g, "")}`;
  if (estLienAutorise(href)) return { ok: true, href };
  if (href.startsWith("//")) return { ok: false, message: "Adresse incomplète : commencez par https:// pour un autre site, ou par / pour une page du site." };
  if (/\s/.test(href)) return { ok: false, message: "L'adresse ne doit pas contenir d'espace." };
  return { ok: false, message: "Adresse refusée : https://, http://, mailto:, tel: ou une page du site commençant par /." };
}

// --- Photos de l'éditeur et couverture ---------------------------------------------------

/**
 * Chemin d'un envoi du back office dans le bucket `medias` :
 * `journal/<aaaa>/<mm>/<horodatage>-<aléa>.<ext>` (motif de la couverture et
 * des photos du texte, migration 0008). Extension tirée du type MIME validé,
 * jamais du nom du fichier.
 */
export function cheminEnvoiArticle(type: TypeImage, maintenant: Date, alea: string): string {
  const aaaa = String(maintenant.getUTCFullYear());
  const mm = String(maintenant.getUTCMonth() + 1).padStart(2, "0");
  const propre = alea.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (propre.length < 6) throw new Error("Aléa trop court pour un nom de fichier.");
  const chemin = `journal/${aaaa}/${mm}/${maintenant.getTime()}-${propre}.${TYPES_IMAGE[type]}`;
  if (!estCheminImage(chemin)) throw new Error("Chemin d'envoi invalide.");
  return chemin;
}

/**
 * Adresse d'une image dans le HTML (collage, glisser-déposer, copie dans
 * l'éditeur) → chemin enregistrable, ou null. Seules les photos du journal
 * sont reprises : fichier du site (`/journal/…`) ou du bucket (`journal/…`,
 * aussi sous son adresse publique complète). Une image d'un autre site ou
 * en `data:` est refusée : elle ne passerait pas le validateur du document.
 */
export function cheminDepuisSrc(src: string | null | undefined, supabaseUrl: string = SUPABASE_URL): string | null {
  if (!src) return null;
  let chemin = src.trim();
  const prefixe = `${new URL(supabaseUrl).origin}/storage/v1/object/public/${BUCKET_MEDIAS}/`;
  if (chemin.startsWith(prefixe)) chemin = chemin.slice(prefixe.length);
  return estCheminImage(chemin) ? chemin : null;
}

/** Catégorie valide ou vide (sélecteur de la fiche). */
export function categorieOuVide(v: string): Categorie | "" {
  return (CATEGORIES as readonly string[]).includes(v) ? (v as Categorie) : "";
}

/** Adresse publique d'un article publié. */
export function adressePublique(slug: string): string {
  return `/journal/${slug}`;
}

/** Date AAAA-MM-JJ du jour, à Paris (date proposée d'un nouvel article). */
export function aujourdhuiParis(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(maintenant);
}

/**
 * Ce qui manque pour publier, d'après le formulaire à l'écran (même liste que
 * `verifierPublication`, revérifiée par le serveur et par la base) : affiché
 * dans la fenêtre de publication avant même de l'envoyer.
 */
export function manquesPublication(f: FormulaireEditeur): string[] {
  const manques: string[] = [];
  if (!f.titre.trim()) manques.push("le titre");
  if (estSlugProvisoire(f.slug)) manques.push("l'adresse (donnez un titre à l'article)");
  if (!f.description.trim()) manques.push("la description (résultat Google)");
  if (!f.categorie) manques.push("la catégorie");
  if (!f.date_publication) manques.push("la date");
  if (!f.couverture) manques.push("la photo de couverture");
  if (!f.couverture_alt.trim()) manques.push("le texte alternatif de la couverture");
  return manques;
}
