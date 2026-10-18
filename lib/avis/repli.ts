import brut from "@/contenu/avis.generated.json";
import traductions from "@/contenu/avis.en.json";
import { extrait } from "./selection";
import type { Categorie, Emplacement } from "./constantes";
import type { Avis } from "./types";

/**
 * Données de secours : les fichiers d'avis d'avant le back office, convertis au
 * format de la table `avis`, À L'IDENTIQUE de l'import en base (migration 0004,
 * vérifié par repli.test.ts). Servent quand Supabase n'est pas configuré
 * (développement local, tests) — voir `source.ts`. Retirées à l'étape 7 du plan.
 */

type AvisFichier = { cle?: string; auteurs: string; role?: string; categorie: Categorie; texte: string };

const FICHIER = brut as AvisFichier[];
/** Traductions anglaises, par clé (ou auteurs). */
const EN = traductions as Record<string, { texte: string; role?: string }>;

/** Emplacements de l'import, par clé (ou auteurs) : les choix faits jusqu'ici dans le code des pages. */
export const EMPLACEMENTS_REPLI: Record<string, Emplacement[]> = {
  "Pierre & Nina": ["accueil_grand"],
  "Charlotte & David": ["accueil"],
  "Frédéric & Selda": ["accueil"],
  "Clémentine & Kévin": ["accueil", "option:ouverture-de-bal"],
  "Harold & David": ["mariages_grand"],
  "Marine & Gaëtan": ["mariages"],
  "Pascal & Abigaïl": ["mariages", "option:sonorisation-ceremonie-laique"],
  "Aaron & Niamha": ["mariages"],
  "Azline & Edouard": ["mariages"],
  "David & Elodie": ["mariages"],
  "Quentin & Pauline": ["mariages"],
  "Beth & Liam": ["option:photobooth"],
  // Le second avis de Léa & Floris, celui qui parle du bar à vinyles.
  "Léa & Floris #2": ["option:bar-a-vinyles"],
  "Coralie & Benjamin": ["option:sonorisation-deportee"],
};

/** Citations de l'import : l'extrait qui commence à la phrase sur l'option (début de phrase, par langue). */
export const DEBUTS_CITATION_REPLI: Record<string, { fr: string; en: string }> = {
  "Beth & Liam": { fr: "Le photobooth", en: "The photo booth was" },
  "Clémentine & Kévin": { fr: "Notre ouverture de bal", en: "Our first dance" },
  "Pascal & Abigaïl": { fr: "Le petit plus", en: "The real bonus" },
  "Léa & Floris #2": { fr: "Le bar a vinyle", en: "The vinyl bar" },
};

/** Longueur des citations de l'import (celle des pages d'option). */
const LONGUEUR_CITATION = 260;

function citation(texte: string, debut: string | undefined): string | null {
  if (!debut) return null;
  const i = texte.indexOf(debut);
  if (i < 0) throw new Error(`Début de citation introuvable : « ${debut} »`);
  return extrait(texte.slice(i), LONGUEUR_CITATION);
}

/** Les avis des fichiers, au format de la base : tous publiés, `ordre` 10, 20, 30… */
export function avisDeRepli(): Avis[] {
  return FICHIER.map((a, i) => {
    const cle = a.cle ?? a.auteurs;
    const en = EN[cle];
    const debuts = DEBUTS_CITATION_REPLI[cle];
    return {
      id: `repli-${i + 1}`,
      auteurs: a.auteurs,
      role_fr: a.role ?? null,
      role_en: en?.role ?? null,
      categorie: a.categorie,
      texte_fr: a.texte,
      texte_en: en?.texte ?? null,
      citation_fr: citation(a.texte, debuts?.fr),
      citation_en: en ? citation(en.texte, debuts?.en) : null,
      source: "site",
      date_avis: null,
      lien_source: null,
      publie: true,
      ordre: (i + 1) * 10,
      emplacements: EMPLACEMENTS_REPLI[cle] ?? [],
    };
  });
}
