/**
 * Typographie du site, une seule règle partout (contenus, titres, interface,
 * avis, fiches DJ) :
 * - espace fine insécable (U+202F) avant ; : ! ? » et après «, pour que la
 *   ponctuation ne parte jamais seule à la ligne (« … à couper le souffle / ? ») ;
 *   sans effet sur l’anglais (pas d’espace avant la ponctuation) ;
 * - apostrophe typographique ’ entre deux lettres (l’équipe, Let’s), comme dans
 *   le journal et les avis : plus de mélange ' / ’.
 * Sans effet sur les adresses, clés et chemins (ni espace, ni apostrophe).
 */

const FINE = "\u202F";

export function insecables(texte: string): string {
  return texte
    .replace(/[ \u00A0\u202F]+([;:!?»])/g, `${FINE}$1`)
    .replace(/«[ \u00A0\u202F]+/g, `«${FINE}`)
    .replace(/(\p{L})'(?=\p{L})/gu, "$1\u2019");
}

/** Applique `insecables` à toutes les chaînes d’un contenu (objets, tableaux), sans en changer la forme. */
export function typographier<T>(valeur: T): T {
  if (typeof valeur === "string") return insecables(valeur) as T;
  if (Array.isArray(valeur)) return valeur.map((v) => typographier(v)) as T;
  if (valeur !== null && typeof valeur === "object" && Object.getPrototypeOf(valeur) === Object.prototype) {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, typographier(v)])) as T;
  }
  return valeur;
}
