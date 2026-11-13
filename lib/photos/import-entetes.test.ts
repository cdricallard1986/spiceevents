import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IMAGES } from "@/lib/images";
import { ENTETES, convientEnTete, galerieEntete } from "./constantes";
import { sqlImportEntetes } from "./import-sql";
import { ENTETES_REPLI, idPhotoSite, liaisonsEntetesDeRepli, photosEntetesDeRepli } from "./repli";

/**
 * La migration 0011 (diaporamas d'en-tête) doit correspondre EXACTEMENT aux
 * listes du code : mêmes photos, mêmes pages, même ordre.
 *
 * Pour réécrire le fichier : `node outils/generer_import_galeries.mjs`.
 */

const FICHIER = join(__dirname, "../../supabase/migrations/0011_entetes_photos.sql");
if (process.env.ECRIRE_IMPORT_GALERIES === "1") writeFileSync(FICHIER, sqlImportEntetes());
const SQL = readFileSync(FICHIER, "utf8");

describe("migration 0011 : diaporamas d'en-tête", () => {
  it("est exactement le texte produit par le générateur (aucune retouche à la main)", () => {
    expect(SQL).toBe(sqlImportEntetes());
  });

  it("élargit la contrainte des emplacements aux en-têtes, sans perdre les galeries existantes", () => {
    expect(SQL).toContain("check (galerie ~ '^(galerie_mariages|galerie_evenements|option:[a-z0-9-]+|entete:[a-z0-9-]+)$')");
    for (const e of ENTETES) expect(galerieEntete(e.page)).toMatch(/^entete:[a-z0-9-]+$/);
  });

  it("importe chaque page d'en-tête, dans l'ordre du code, rangs 10, 20, 30…", () => {
    const liaisons = liaisonsEntetesDeRepli();
    for (const e of ENTETES) {
      const cles = ENTETES_REPLI[e.page];
      expect(cles.length, e.page).toBeGreaterThan(0);
      const lignes = liaisons.filter((l) => l.galerie === galerieEntete(e.page));
      expect(lignes.map((l) => l.photo_id), e.page).toEqual(cles.map(idPhotoSite));
      expect(lignes.map((l) => l.ordre), e.page).toEqual(cles.map((_, i) => (i + 1) * 10));
      for (const l of lignes) expect(SQL, e.page).toContain(`('${l.galerie}', '${l.photo_id}', ${l.ordre})`);
    }
  });

  it("chaque photo d'en-tête est au registre, en base une seule fois, et convient au plein écran", () => {
    const photos = photosEntetesDeRepli();
    expect(new Set(photos.map((p) => p.id)).size).toBe(photos.length);
    for (const p of photos) {
      expect(SQL).toContain(`('${p.id}', 'site', '${p.chemin}', ${p.largeur}, ${p.hauteur},`);
      expect(convientEnTete(p), p.chemin).toBe(true);
    }
    for (const cles of Object.values(ENTETES_REPLI)) for (const c of cles) expect(IMAGES[c], c).toBeDefined();
  });
});
