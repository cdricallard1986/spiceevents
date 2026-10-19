import fs from "node:fs";
import path from "node:path";
import { ligneDepuisMdx } from "./conversion";
import type { LigneArticle } from "./types";

/**
 * Données de secours : les 37 articles MDX d'avant le back office
 * (`contenu/journal/*.mdx`), convertis au format de la table `articles`
 * À L'IDENTIQUE de l'import en base (migration 0009, générée par la même
 * conversion et vérifiée par import-sql.test.ts). Servent quand Supabase
 * n'est pas configuré — voir `source.ts` : les pages n'ont ainsi qu'un seul
 * rendu, celui du document de l'éditeur. Retirées à l'étape 7 du plan.
 */

export const DOSSIER_MDX = path.join(process.cwd(), "contenu", "journal");

let cache: LigneArticle[] | undefined;

/** Les articles des fichiers, tous publiés, dans l'ordre des noms de fichier. */
export function lignesDeRepli(dossier: string = DOSSIER_MDX): LigneArticle[] {
  if (dossier !== DOSSIER_MDX) return lire(dossier);
  cache ??= lire(dossier);
  return cache;
}

function lire(dossier: string): LigneArticle[] {
  return fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => ligneDepuisMdx(f.replace(/\.mdx$/, ""), fs.readFileSync(path.join(dossier, f), "utf8")));
}
