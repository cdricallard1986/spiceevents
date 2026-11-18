/**
 * Page Avis : les avis sont montrés par lots (les premiers, puis « Voir plus
 * d’avis »), pour ne pas imposer des dizaines d’écrans de défilement sur
 * téléphone. Tous restent dans la page (Google les lit) ; seuls les lots
 * suivants sont repliés.
 */

/** Avis visibles à l’arrivée. */
export const PREMIER_LOT = 9;
/** Avis ajoutés à chaque « Voir plus ». */
export const LOT_SUIVANT = 12;
/** En dessous, un dernier lot ne vaut pas un clic : il rejoint le précédent. */
const RESTE_MINIMAL = 4;

/**
 * Découpe une liste en lots : `premier` éléments, puis des lots de `suivant`.
 * Un reste trop court rejoint le lot précédent (jamais de bouton pour 1 à 3 avis).
 */
export function lotsAvis<T>(liste: readonly T[], premier: number = PREMIER_LOT, suivant: number = LOT_SUIVANT): T[][] {
  if (liste.length === 0) return [];
  const lots: T[][] = [liste.slice(0, premier)];
  for (let i = premier; i < liste.length; i += suivant) lots.push(liste.slice(i, i + suivant));
  const dernier = lots[lots.length - 1];
  if (lots.length > 1 && dernier.length < RESTE_MINIMAL) {
    lots.pop();
    lots[lots.length - 1] = [...lots[lots.length - 1], ...dernier];
  }
  return lots;
}

/** Nombre d’avis encore repliés quand `visibles` lots sont affichés. */
export function avisRestants<T>(lots: readonly T[][], visibles: number): number {
  return lots.slice(visibles).reduce((n, lot) => n + lot.length, 0);
}
