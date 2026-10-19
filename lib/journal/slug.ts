import { LIMITES_ARTICLES, MOTIF_SLUG } from "./constantes";

/**
 * Adresse (slug) d'un article à partir de son titre, comme celles des
 * articles importés : sans accents, en minuscules, chaque suite de caractères
 * autres que lettres et chiffres (espaces, apostrophes, ponctuation, &…)
 * devient un tiret. 120 caractères au plus (contrainte de la table), coupé
 * entre deux mots quand c'est possible.
 *
 * « Comment choisir l’ambiance musicale de votre mariage ? »
 *   → `comment-choisir-l-ambiance-musicale-de-votre-mariage`
 *
 * Rend une chaîne vide si le titre n'a ni lettre ni chiffre (au formulaire de le signaler).
 */
export function slugDepuisTitre(titre: string, max: number = LIMITES_ARTICLES.slug): string {
  const slug = titre
    .replace(/[œŒ]/g, "oe")
    .replace(/[æÆ]/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return couper(slug, max);
}

/** Coupe à `max` caractères, au dernier tiret si la coupe tombe au milieu d'un mot. */
function couper(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  const coupe = slug.slice(0, max);
  const finDeMot = slug[max] === "-";
  const dernierTiret = coupe.lastIndexOf("-");
  const resultat = finDeMot || dernierTiret <= 0 ? coupe : coupe.slice(0, dernierTiret);
  return resultat.replace(/-+$/, "");
}

/** Vrai pour une adresse acceptée par la table (`^[a-z0-9]+(-[a-z0-9]+)*$`, 120 caractères au plus). */
export function estSlugValide(slug: string): boolean {
  return slug.length <= LIMITES_ARTICLES.slug && MOTIF_SLUG.test(slug);
}

/**
 * Adresse libre : `base`, ou `base-2`, `base-3`… si elle est déjà prise (la
 * colonne est unique), toujours dans la limite de 120 caractères.
 */
export function slugLibre(base: string, prises: ReadonlySet<string>): string {
  if (!prises.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffixe = `-${n}`;
    const candidat = `${couper(base, LIMITES_ARTICLES.slug - suffixe.length)}${suffixe}`;
    if (!prises.has(candidat)) return candidat;
  }
}
