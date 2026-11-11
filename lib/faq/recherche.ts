import type { ThemeFaq } from "@/contenu/pages/faq";

/** Minuscules, sans accents ni ligatures, espaces réduits : « Éclairage » et « eclairage » se valent. */
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mots de la recherche (au moins 2 lettres : « à », « l' » ne filtrent rien). */
export function motsRecherche(requete: string): string[] {
  return normaliser(requete)
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length >= 2);
}

/**
 * Thèmes réduits aux questions dont la question ou la réponse contient tous les
 * mots cherchés ; un thème sans question retenue disparaît. Recherche vide :
 * tout est rendu tel quel.
 */
export function filtrerThemes(themes: ThemeFaq[], requete: string): ThemeFaq[] {
  const mots = motsRecherche(requete);
  if (mots.length === 0) return themes;
  return themes
    .map((t) => ({
      ...t,
      questions: t.questions.filter((q) => {
        const texte = normaliser(`${q.question} ${q.reponse}`);
        return mots.every((m) => texte.includes(m));
      }),
    }))
    .filter((t) => t.questions.length > 0);
}
