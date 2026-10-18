import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ⚠️ `supabase.auth.signOut()` sans argument vaut `scope: "global"` : il ferme
 * la session sur TOUS les appareils de l'utilisateur. Le bouton de déconnexion
 * ne doit fermer que l'appareil courant (`{ scope: "local" }`). Ce défaut est
 * silencieux et revient au premier copier-coller : ce test le refuse partout.
 */

const RACINE = join(__dirname, "..");
const DOSSIERS = ["app", "components", "lib", "hooks"];
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs)$/;

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return EXTENSIONS.test(nom) ? [chemin] : [];
  });
}

/** Appels `.signOut(` dont les parenthèses sont vides (espaces et retours à la ligne compris). */
export function appelsSansArgument(source: string): number {
  return [...source.matchAll(/\.signOut\s*\(\s*\)/g)].length;
}

describe("déconnexion limitée à l'appareil", () => {
  it("le détecteur repère un signOut() sans argument, et seulement lui", () => {
    expect(appelsSansArgument("await supabase.auth.signOut();")).toBe(1);
    expect(appelsSansArgument("supabase.auth.signOut(\n)")).toBe(1);
    expect(appelsSansArgument('supabase.auth.signOut({ scope: "local" })')).toBe(0);
    expect(appelsSansArgument('supabase.auth.signOut({ scope: "others" })')).toBe(0);
  });

  it("aucun signOut() sans argument dans app, components, lib et hooks", () => {
    const fautifs = DOSSIERS.flatMap((d) => fichiers(join(RACINE, d)))
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
      .filter((f) => appelsSansArgument(readFileSync(f, "utf8")) > 0)
      .map((f) => relative(RACINE, f));
    expect(fautifs).toEqual([]);
  });

  it("le code du back office se déconnecte bien en « local »", () => {
    const sources = DOSSIERS.flatMap((d) => fichiers(join(RACINE, d))).map((f) => readFileSync(f, "utf8"));
    expect(sources.some((s) => s.includes('signOut({ scope: "local" })'))).toBe(true);
  });
});
