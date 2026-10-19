import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../next.config";

/**
 * En production, l'optimiseur d'images refuse (400) toute qualité absente de
 * `images.qualities` : l'image ne s'affiche pas, sans erreur visible au build.
 * Cas réel : l'agrandissement de la galerie demandait `quality={75}`.
 */
function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return nom === "node_modules" ? [] : fichiers(chemin);
    return /\.tsx?$/.test(nom) && !/\.test\.tsx?$/.test(nom) ? [chemin] : [];
  });
}

describe("qualités des images", () => {
  it("n'utilisent que les valeurs autorisées par next.config.ts", () => {
    const autorisees = config.images?.qualities ?? [];
    expect(autorisees.length).toBeGreaterThan(0);
    const fautives: string[] = [];
    for (const fichier of ["app", "components", "lib"].flatMap((d) => fichiers(d))) {
      for (const [, valeur] of readFileSync(fichier, "utf8").matchAll(/quality=\{(\d+)\}/g)) {
        if (!autorisees.includes(Number(valeur))) fautives.push(`${fichier} : quality={${valeur}}`);
      }
    }
    expect(fautives).toEqual([]);
  });
});
