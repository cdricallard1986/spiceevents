import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EQUIPE_INITIALE } from "@/contenu/equipe";
import { IMAGES } from "@/lib/images";
import { validerChampsMembre, formulaireDepuisMembre } from "./schema";
import { sqlTableEquipe } from "./import-sql";

/**
 * La migration 0012 doit être exactement le texte du générateur, et l'équipe
 * importée doit passer la validation du back office (sinon sa première
 * modification échouerait). Réécrire le fichier : `ECRIRE_IMPORT_EQUIPE=1 npx vitest run lib/equipe/import-sql.test.ts`.
 */

const FICHIER = join(__dirname, "../../supabase/migrations/0012_equipe.sql");
if (process.env.ECRIRE_IMPORT_EQUIPE === "1") writeFileSync(FICHIER, sqlTableEquipe());
const SQL = readFileSync(FICHIER, "utf8");

describe("migration 0012 : équipe", () => {
  it("est exactement le texte produit par le générateur (aucune retouche à la main)", () => {
    expect(SQL).toBe(sqlTableEquipe());
  });

  it("protège la table : RLS, lecture publique des seuls publiés, écritures réservées à l'administrateur", () => {
    expect(SQL).toContain("alter table public.equipe enable row level security;");
    expect(SQL).toContain("revoke all on table public.equipe from public, anon, authenticated;");
    expect(SQL).toContain("for select to anon, authenticated using (publie);");
    expect(SQL.match(/\(select public\.est_admin\(\)\)/g)?.length).toBe(5);
    expect(SQL).toContain("execute function public.audit_trigger()");
  });

  it("importe chaque membre une fois, avec des noms de famille réduits à l'initiale", () => {
    expect(new Set(EQUIPE_INITIALE.map((m) => m.id)).size).toBe(EQUIPE_INITIALE.length);
    for (const m of EQUIPE_INITIALE) {
      expect(SQL).toContain(`('${m.id}', '${m.groupe}', '${m.nom.replace(/'/g, "''")}'`);
      expect(m.nom, m.nom).toMatch(/^(DJ \S+|\p{Lu}\p{Ll}+( \p{Lu}\.)?)$/u);
    }
  });

  it("chaque membre importé passe la validation du back office, tel quel", () => {
    for (const m of EQUIPE_INITIALE) {
      const v = validerChampsMembre(formulaireDepuisMembre(m));
      expect(v.ok, `${m.nom} : ${JSON.stringify(v.ok ? "" : v.erreurs)}`).toBe(true);
      if (v.ok) {
        const attendu = Object.fromEntries(Object.entries(m).filter(([cle]) => !["id", "publie", "ordre"].includes(cle)));
        expect(v.champs, m.nom).toEqual(attendu);
      }
    }
  });

  it("les portraits du site existent au registre, avec leurs vraies dimensions", () => {
    for (const m of EQUIPE_INITIALE.filter((x) => x.photo_chemin)) {
      const cle = m.photo_chemin!.replace(/^\/images\/|\.jpg$/g, "") as keyof typeof IMAGES;
      expect(IMAGES[cle], m.nom).toBeDefined();
      expect([IMAGES[cle].width, IMAGES[cle].height], m.nom).toEqual([m.photo_largeur, m.photo_hauteur]);
    }
  });
});
