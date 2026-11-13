/**
 * Typographie française : une espace fine insécable (U+202F) avant ; : ! ? »
 * et après «, pour que la ponctuation ne parte jamais seule à la ligne
 * (« … à couper le souffle / ? »). Sans effet sur l'anglais (pas d'espace
 * avant la ponctuation) ni sur les adresses, clés et chemins (pas d'espace).
 */

const FINE = " ";

export function insecables(texte: string): string {
  return texte.replace(/[  ]+([;:!?»])/g, `${FINE}$1`).replace(/«[  ]+/g, `«${FINE}`);
}

/** Applique `insecables` à toutes les chaînes d'un contenu (objets, tableaux), sans en changer la forme. */
export function typographier<T>(valeur: T): T {
  if (typeof valeur === "string") return insecables(valeur) as T;
  if (Array.isArray(valeur)) return valeur.map((v) => typographier(v)) as T;
  if (valeur !== null && typeof valeur === "object" && Object.getPrototypeOf(valeur) === Object.prototype) {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, typographier(v)])) as T;
  }
  return valeur;
}
