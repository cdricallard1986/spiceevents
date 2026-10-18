import { describe, expect, it } from "vitest";
import {
  cheminRelatif,
  construireRapport,
  echapperHtml,
  formaterDuree,
  moduleGenere,
  rapportAbsentHtml,
  rapportHtml,
  resumer,
  sansCouleurs,
  type SortieVitest,
} from "./rapport-tests";

const RACINE = "/projet";

const SORTIE: SortieVitest = {
  startTime: Date.UTC(2026, 9, 18, 12, 0, 0),
  success: false,
  testResults: [
    {
      name: "/projet/lib/b.test.ts",
      status: "passed",
      startTime: Date.UTC(2026, 9, 18, 12, 0, 1),
      endTime: Date.UTC(2026, 9, 18, 12, 0, 2),
      assertionResults: [
        { ancestorTitles: ["bloc"], title: "réussit", status: "passed", duration: 12, failureMessages: [] },
        { ancestorTitles: [], title: "plus tard", status: "skipped", duration: null, failureMessages: [] },
      ],
    },
    {
      name: "/projet/lib/a.test.ts",
      status: "failed",
      startTime: Date.UTC(2026, 9, 18, 12, 0, 1),
      endTime: Date.UTC(2026, 9, 18, 12, 0, 3, 500),
      assertionResults: [
        {
          ancestorTitles: ["<b>bloc</b>"],
          title: `<img src=x onerror="alert(1)">`,
          status: "failed",
          duration: 1500,
          failureMessages: ["\u001b[31mAssertionError: expected <script>1</script>\u001b[39m"],
        },
        { ancestorTitles: [], title: "todo", status: "todo", failureMessages: [] },
      ],
    },
  ],
};

describe("construireRapport", () => {
  const rapport = construireRapport(SORTIE, RACINE);

  it("compte réussis, échoués et ignorés (todo et skipped sont ignorés)", () => {
    expect(rapport.totaux).toEqual({ total: 4, reussis: 1, echoues: 1, ignores: 2 });
    expect(rapport.succes).toBe(false);
  });

  it("calcule la durée totale et la date du lancement", () => {
    expect(rapport.dureeMs).toBe(3500);
    expect(rapport.date).toBe("2026-10-18T12:00:00.000Z");
  });

  it("met les fichiers en échec en tête, chemins relatifs à la racine", () => {
    expect(rapport.fichiers.map((f) => f.fichier)).toEqual(["lib/a.test.ts", "lib/b.test.ts"]);
    expect(rapport.fichiers[0].dureeMs).toBe(2500);
  });

  it("retire les codes couleur des messages d'échec", () => {
    expect(rapport.fichiers[0].tests[0].messages[0]).toBe("AssertionError: expected <script>1</script>");
  });

  it("signale un fichier qui n'a pas pu s'exécuter, même sans test échoué", () => {
    const r = construireRapport({ success: false, testResults: [{ name: "/projet/x.test.ts", status: "failed", message: "Cannot find module", assertionResults: [] }] }, RACINE);
    expect(r.fichiersEnErreur).toBe(1);
    expect(r.succes).toBe(false);
    expect(r.fichiers[0].erreur).toBe("Cannot find module");

    const sansMessage = construireRapport({ testResults: [{ name: "/projet/y.test.ts", status: "failed", assertionResults: [] }] }, RACINE);
    expect(sansMessage.fichiers[0].erreur).toMatch(/pas pu être exécuté/);
  });

  it("tout vert → succès", () => {
    const r = construireRapport({ success: true, testResults: [SORTIE.testResults![0]] }, RACINE);
    expect(r.succes).toBe(true);
    expect(r.totaux.echoues).toBe(0);
  });

  it("supporte une sortie vide", () => {
    const r = construireRapport({}, RACINE, Date.UTC(2026, 0, 1));
    expect(r.totaux.total).toBe(0);
    expect(r.dureeMs).toBe(0);
    expect(r.date).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("rapportHtml", () => {
  const html = rapportHtml(construireRapport(SORTIE, RACINE), "1.2.3");

  it("échappe les noms de tests, les blocs et les messages d'échec", () => {
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>bloc</b>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("expected &lt;script&gt;1&lt;/script&gt;");
  });

  it("est auto-contenu : aucun script ni ressource externe", () => {
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link/i);
    // Aucun attribut src/href dans une balise, aucune ressource chargée par le CSS.
    expect(html).not.toMatch(/<[^>]+\s(src|href)=/i);
    expect(html).not.toMatch(/url\(|@import|https?:\/\//i);
  });

  it("affiche date, durée, version et totaux", () => {
    expect(html).toContain("18/10/2026 à 14:00");
    expect(html).toContain("3,50 s");
    expect(html).toContain("version 1.2.3");
    expect(html).toMatch(/<b class="ko">1<\/b><span>échoués/);
    expect(html).toContain("le déploiement a été bloqué");
  });

  it("déplie les fichiers en échec", () => {
    expect(html).toContain('<details class="echec" open>');
  });

  it("la page par défaut dit que le rapport n'est pas encore généré", () => {
    expect(rapportAbsentHtml()).toContain("Rapport non encore généré");
    expect(rapportAbsentHtml()).not.toMatch(/<script/i);
  });
});

describe("module généré", () => {
  it("sérialise le HTML en JSON (aucun gabarit interprété)", () => {
    const code = moduleGenere(null, "a`${b}`\"</script>");
    expect(code).toContain('export const RAPPORT_TESTS_HTML: string = "a`${b}`\\"</script>";');
    expect(code).toContain("export const RESUME_TESTS: ResumeRapport | null = null;");
    expect(code).toContain('import "server-only";');
  });

  it("embarque le résumé", () => {
    const resume = resumer(construireRapport(SORTIE, RACINE), "1.2.3");
    expect(moduleGenere(resume, "")).toContain('"version":"1.2.3"');
  });
});

describe("utilitaires", () => {
  it("échappe les caractères HTML", () => {
    expect(echapperHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  it("formate les durées", () => {
    expect(formaterDuree(null)).toBe("—");
    expect(formaterDuree(12.4)).toBe("12 ms");
    expect(formaterDuree(1234)).toBe("1,23 s");
  });

  it("rend les chemins relatifs, séparateurs Windows compris", () => {
    expect(cheminRelatif("/projet/lib/a.ts", "/projet/")).toBe("lib/a.ts");
    expect(cheminRelatif("C:\\projet\\lib\\a.ts", "C:\\projet")).toBe("lib/a.ts");
    expect(cheminRelatif("/ailleurs/a.ts", "/projet")).toBe("/ailleurs/a.ts");
  });

  it("retire les codes ANSI", () => {
    expect(sansCouleurs("\u001b[1m\u001b[31mrouge\u001b[39m\u001b[22m")).toBe("rouge");
  });
});
