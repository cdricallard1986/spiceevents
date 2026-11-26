import type { CleImage } from "@/lib/images";
import type { Seo } from "../../types";

/**
 * Pages locales du mariage (un département, ou un lieu où nous jouons souvent).
 *
 * Règles (Google et Cédric) :
 * - une vraie page, jamais une copie d’une autre avec un nom de lieu changé :
 *   tout vient des mariages réellement animés (planning, dossiers des mariés)
 *   et des avis déjà publiés sur le site ;
 * - on ne parle des lieux que pour les mettre en valeur ;
 * - une seule photo par endroit, jamais deux photos d’un même mariage côte à côte ;
 * - prénoms seulement, jamais de nom de famille de client.
 */

/** Un lieu (page département) ou un mariage (page lieu). */
export type CarteLocale = { surtitre: string; titre: string; detail: string; texte: string };

export type CitationLocale = { texte: string; auteurs: string; contexte: string };

export type PageLocale = {
  seo: Seo;
  /** Dernier maillon du fil d’Ariane (Accueil › Mariages › …). */
  ariane: string;
  hero: { surtitre: string; titre: string; intro: string };
  promesse: { surtitre: string; titre: string; paragraphes: string[] };
  cartes: { surtitre: string; titre: string; intro: string; liste: CarteLocale[]; aussi?: string };
  avis: { surtitre: string; titre: string; liste: CitationLocale[] };
  atouts: { surtitre: string; titre: string; intro: string; liste: { titre: string; texte: string }[] };
  anecdote: { surtitre: string; titre: string; texte: string };
  photos: { entete: CleImage; promesse: CleImage };
  appel: { titre: string; texte: string; bouton: string };
};
