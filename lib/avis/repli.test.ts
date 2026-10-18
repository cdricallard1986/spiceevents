import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import brut from "@/contenu/avis.generated.json";
import { OPTIONS } from "@/contenu/options";
import { estEmplacementConnu } from "./constantes";
import { DEBUTS_CITATION_REPLI, EMPLACEMENTS_REPLI, avisDeRepli } from "./repli";
import { avisDeLEmplacement, avisUnique, grilleCitations } from "./selection";

/**
 * Les données de secours doivent être celles de la base : même 43 avis, mêmes
 * textes, traductions, citations, emplacements et rangs que l'import
 * (supabase/migrations/0004_import_avis.sql). Ce test relit la migration.
 */

type Valeur = string | number | boolean | null;

/** Lit les lignes `(…), (…);` d'un INSERT : chaînes SQL ('' = '), null, booléens, entiers. */
function lignesInsert(sql: string): Valeur[][] {
  const debut = sql.indexOf(" values");
  const lignes: Valeur[][] = [];
  let ligne: Valeur[] | null = null;
  let i = debut + 7;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "(" && !ligne) {
      ligne = [];
      i++;
    } else if (c === ")" && ligne) {
      lignes.push(ligne);
      ligne = null;
      i++;
    } else if (c === "'" && ligne) {
      let valeur = "";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          valeur += "'";
          i += 2;
        } else if (sql[i] === "'") {
          i++;
          break;
        } else valeur += sql[i++];
      }
      ligne.push(valeur);
    } else if (ligne && /[a-z0-9-]/i.test(c)) {
      const mot = /^[a-z0-9-]+/i.exec(sql.slice(i))![0];
      ligne.push(mot === "null" ? null : mot === "true" ? true : mot === "false" ? false : Number(mot));
      i += mot.length;
    } else i++;
  }
  return lignes;
}

const SQL = readFileSync(join(__dirname, "../../supabase/migrations/0004_import_avis.sql"), "utf8");
const COLONNES = /insert into public\.avis \(([^)]+)\)/.exec(SQL)![1].split(",").map((c) => c.trim());
const IMPORT = lignesInsert(SQL).map((valeurs) => {
  const ligne = Object.fromEntries(COLONNES.map((c, i) => [c, valeurs[i]]));
  const brut = String(ligne.emplacements);
  return { ...ligne, emplacements: brut === "{}" ? [] : brut.slice(1, -1).split(",") };
});

describe("données de secours (fichiers JSON au format de la base)", () => {
  const repli = avisDeRepli();

  it("le lecteur de la migration retrouve ses 43 avis", () => {
    expect(COLONNES).toEqual(["auteurs", "role_fr", "role_en", "categorie", "texte_fr", "texte_en", "citation_fr", "citation_en", "source", "publie", "ordre", "emplacements"]);
    expect(IMPORT).toHaveLength(43);
  });

  it("sont identiques, avis par avis, à l'import en base (migration 0004)", () => {
    expect(repli).toHaveLength(IMPORT.length);
    repli.forEach((a, i) => {
      const attendu = IMPORT[i];
      const obtenu = Object.fromEntries(COLONNES.map((c) => [c, a[c as keyof typeof a]]));
      expect(obtenu, `${i + 1}. ${a.auteurs}`).toEqual(attendu);
    });
  });

  it("ont des identifiants uniques, sans date ni lien (comme l'import)", () => {
    expect(new Set(repli.map((a) => a.id)).size).toBe(repli.length);
    expect(repli.every((a) => a.date_avis === null && a.lien_source === null)).toBe(true);
  });

  it("n'utilisent que des emplacements connus, et des clés d'avis existantes", () => {
    const cles = new Set((brut as { cle?: string; auteurs: string }[]).map((a) => a.cle ?? a.auteurs));
    for (const [cle, emplacements] of Object.entries(EMPLACEMENTS_REPLI)) {
      expect(cles.has(cle), cle).toBe(true);
      for (const e of emplacements) expect(estEmplacementConnu(e), `${cle} : ${e}`).toBe(true);
    }
    for (const cle of Object.keys(DEBUTS_CITATION_REPLI)) expect(cles.has(cle), cle).toBe(true);
  });

  it("donnent les mêmes avis qu'avant sur chaque page", () => {
    const auteurs = (liste: { auteurs: string }[]) => liste.map((a) => a.auteurs);
    expect(avisUnique(repli, "accueil_grand")?.auteurs).toBe("Pierre & Nina");
    expect(auteurs(avisDeLEmplacement(repli, "accueil"))).toEqual(["Charlotte & David", "Frédéric & Selda", "Clémentine & Kévin"]);
    expect(avisUnique(repli, "mariages_grand")?.auteurs).toBe("Harold & David");
    expect(auteurs(avisDeLEmplacement(repli, "mariages"))).toEqual([
      "Marine & Gaëtan",
      "Pascal & Abigaïl",
      "Aaron & Niamha",
      "Azline & Edouard",
      "David & Elodie",
      "Quentin & Pauline",
    ]);
    const parOption = Object.fromEntries(OPTIONS.map((o) => [o.slug.fr, avisUnique(repli, `option:${o.slug.fr}`)?.auteurs]));
    expect(parOption).toEqual({
      "ouverture-de-bal": "Clémentine & Kévin",
      "bar-a-vinyles": "Léa & Floris",
      "livre-d-or-audio": undefined,
      photobooth: "Beth & Liam",
      "guirlandes-lumineuses": undefined,
      "murs-d-eau-et-vegetaux": undefined,
      "sonorisation-ceremonie-laique": "Pascal & Abigaïl",
      "sonorisation-deportee": "Coralie & Benjamin",
    });
  });

  it("la citation d'une option commence à la phrase sur l'option, dans les deux langues", () => {
    const bar = avisUnique(repli, "option:bar-a-vinyles")!;
    expect(grilleCitations([bar], "fr")[0].texte.startsWith("Le bar a vinyle")).toBe(true);
    expect(grilleCitations([bar], "en")[0].texte.startsWith("The vinyl bar")).toBe(true);
  });
});
