import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `dynamicParams` des pages publiques. Next applique `dynamicParams = false` à
 * une adresse dès qu'UN de ses segments le déclare : posé sur
 * `app/[locale]/layout.tsx`, il interdirait aussi les articles du journal
 * publiés après le déploiement. Il est donc déclaré page par page :
 *
 * - toutes les pages : `false`, pour qu'une « langue » inconnue
 *   (`/favicon.ico`, `/x.png`… hors middleware) réponde 404 au lieu d'une
 *   erreur 500 (garde-fou `hasLocale` du layout, qui ne suffit pas seul) ;
 * - sauf `journal/[slug]` (`true` : article rendu à sa première visite) et la
 *   page 404 `[...reste]`.
 */

const RACINE = join(__dirname, "../app/[locale]");

function pages(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return pages(chemin);
    return nom === "page.tsx" ? [relative(RACINE, chemin)] : [];
  });
}

const EXCEPTIONS: Record<string, string> = {
  "journal/[slug]/page.tsx": "export const dynamicParams = true;",
  "[...reste]/page.tsx": "",
};

describe("pages publiques : dynamicParams", () => {
  it("le layout des langues ne le déclare pas (il s'imposerait aux articles du journal)", () => {
    expect(readFileSync(join(RACINE, "layout.tsx"), "utf8")).not.toMatch(/export const dynamicParams/);
  });

  it("chaque page le met à false, sauf l'article du journal (true) et la page 404", () => {
    const liste = pages(RACINE).sort();
    expect(liste.length).toBeGreaterThanOrEqual(16);
    for (const page of liste) {
      const source = readFileSync(join(RACINE, page), "utf8");
      if (page in EXCEPTIONS) {
        if (EXCEPTIONS[page]) expect(source, page).toContain(EXCEPTIONS[page]);
        else expect(source, page).not.toMatch(/dynamicParams/);
      } else {
        expect(source, page).toContain("export const dynamicParams = false;");
      }
    }
  });
});
