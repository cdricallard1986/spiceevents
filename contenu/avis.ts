import type { Locale } from "@/i18n/routing";
import brut from "./avis.generated.json";
import traductions from "./avis.en.json";

export type AvisClient = {
  auteurs: string;
  role?: string;
  categorie: "mariage" | "evenement";
  texte: string;
};

const AVIS = brut as AvisClient[];
/** Traductions anglaises, indexées par auteurs : { "Pierre & Nina": { "texte": "…", "role": "…" } }. */
const EN = traductions as Record<string, { texte: string; role?: string }>;

/** Tous les avis réels, dans la langue demandée (le français à défaut de traduction). */
export function avis(locale: Locale, categorie?: AvisClient["categorie"]): AvisClient[] {
  return AVIS.filter((a) => !categorie || a.categorie === categorie).map((a) =>
    locale === "en" && EN[a.auteurs] ? { ...a, texte: EN[a.auteurs].texte, role: EN[a.auteurs].role ?? a.role } : a,
  );
}

export function avisDe(auteurs: string, locale: Locale): AvisClient {
  const a = avis(locale).find((x) => x.auteurs === auteurs);
  if (!a) throw new Error(`Avis introuvable : ${auteurs}`);
  return a;
}

/** Extrait court (citation) d'un avis : les phrases entières jusqu'à ~longueur caractères. */
export function extrait(texte: string, longueur = 220): string {
  if (texte.length <= longueur) return texte;
  const phrases = texte.match(/[^.!?…]+[.!?…]+/g) ?? [texte];
  let out = "";
  for (const p of phrases) {
    if ((out + p).length > longueur && out) break;
    out += p;
  }
  return out.trim();
}
