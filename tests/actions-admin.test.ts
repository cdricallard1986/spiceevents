import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ⚠️ Un fichier « use server » est une porte publique : chaque fonction
 * exportée devient un point d'entrée HTTP, appelable sans passer par la page.
 * Dans le back office, chacune doit COMMENCER par la garde `exigerAdmin()`
 * (la validation Zod vient ensuite). Ce test le vérifie dans tous les fichiers
 * d'actions de `app/admin/(espace)`.
 */

const RACINE = join(__dirname, "..");
const ESPACE = join(RACINE, "app", "admin", "(espace)");

function fichiersActions(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersActions(chemin);
    return nom === "actions.ts" ? [chemin] : [];
  });
}

/** Fonctions exportées dont la première instruction n'est pas un appel à `exigerAdmin()`. */
export function exportsSansGarde(source: string): string[] {
  const fautifs: string[] = [];
  for (const m of source.matchAll(/export\s+async\s+function\s+(\w+)\s*\(/g)) {
    // Début du corps : la première accolade après la fin de la signature (`): Promise<…> {`).
    const corps = source.indexOf("{", source.indexOf(")", m.index! + m[0].length));
    const premiere = source.slice(corps + 1).trimStart();
    if (!/^(const\s+\{[^}]*\}\s*=\s*)?await\s+exigerAdmin\(\)/.test(premiere)) fautifs.push(m[1]);
  }
  return fautifs;
}

describe("Server Actions du back office", () => {
  it("le détecteur repère un export qui ne commence pas par la garde", () => {
    expect(exportsSansGarde("export async function a(x: unknown): Promise<R> {\n  const { supabase } = await exigerAdmin();\n}")).toEqual([]);
    expect(exportsSansGarde("export async function b() {\n  await exigerAdmin();\n}")).toEqual([]);
    expect(exportsSansGarde("export async function c(id: unknown) {\n  const v = schema.parse(id);\n  await exigerAdmin();\n}")).toEqual(["c"]);
    expect(exportsSansGarde("export async function d() {\n  return 1;\n}")).toEqual(["d"]);
  });

  it("chaque export de app/admin/(espace)/**/actions.ts commence par exigerAdmin()", () => {
    const fichiers = fichiersActions(ESPACE);
    expect(fichiers.map((f) => relative(RACINE, f))).toEqual(expect.arrayContaining([join("app", "admin", "(espace)", "avis", "actions.ts"), join("app", "admin", "(espace)", "demandes", "actions.ts"), join("app", "admin", "(espace)", "photos", "actions.ts")]));
    const fautifs = fichiers.flatMap((f) => {
      const source = readFileSync(f, "utf8");
      expect(source.trimStart().startsWith('"use server"'), relative(RACINE, f)).toBe(true);
      return exportsSansGarde(source).map((nom) => `${relative(RACINE, f)} : ${nom}`);
    });
    expect(fautifs).toEqual([]);
  });

  it("aucun fichier ne transite par une Server Action (envoi direct navigateur → Storage par URL signée)", () => {
    for (const f of fichiersActions(ESPACE)) {
      const source = readFileSync(f, "utf8");
      expect(source, relative(RACINE, f)).not.toMatch(/\.upload\(|\.uploadToSignedUrl\(|FormData|\bFile\b|\bBlob\b|arrayBuffer\(/);
    }
  });

  it("aucune action du back office n'utilise la clé service_role", () => {
    for (const f of fichiersActions(ESPACE)) expect(readFileSync(f, "utf8"), relative(RACINE, f)).not.toMatch(/clientAdmin|supabase_service_role_key|lib\/supabase\/admin/);
  });
});
