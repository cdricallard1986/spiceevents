import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OPTIONS } from "@/contenu/options";
import { PHOTOS_EVENEMENTS, PHOTOS_MARIAGES } from "@/contenu/pages/galerie";
import { CONTENUS_OPTIONS } from "@/contenu/pages/options";
import { IMAGES, type CleImage } from "@/lib/images";
import { sqlImportGaleries } from "./import-sql";
import { idPhotoSite, liaisonsDeRepli, photosDeRepli } from "./repli";

/**
 * La migration 0007 doit correspondre EXACTEMENT aux galeries du code : mêmes
 * photos, mêmes dimensions et textes alternatifs, mêmes galeries dans le même
 * ordre. Le test relit le fichier SQL de façon indépendante et le compare aux
 * listes du code (pas seulement au générateur).
 *
 * Pour réécrire le fichier : `node outils/generer_import_galeries.mjs`.
 */

const FICHIER = join(__dirname, "../../supabase/migrations/0007_import_galeries.sql");
if (process.env.ECRIRE_IMPORT_GALERIES === "1") writeFileSync(FICHIER, sqlImportGaleries());
const SQL = readFileSync(FICHIER, "utf8");

type Valeur = string | number | null;

/** Lit les lignes `(…), (…)` de l'INSERT qui suit `debut`, jusqu'à son `on conflict` : chaînes SQL ('' = '), null, entiers. */
function lignesInsert(sql: string, debut: string): Valeur[][] {
  const i0 = sql.indexOf(debut);
  if (i0 < 0) throw new Error(`INSERT introuvable : ${debut}`);
  // Fin des valeurs : la clause `on conflict` (ses parenthèses ne sont pas une ligne).
  const fin = sql.indexOf("\non conflict", sql.indexOf(" values", i0));
  const lignes: Valeur[][] = [];
  let ligne: Valeur[] | null = null;
  let i = sql.indexOf(" values", i0) + 7;
  while (i < fin) {
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
    } else if (ligne && /[a-z0-9]/i.test(c)) {
      const mot = /^[a-z0-9]+/i.exec(sql.slice(i))![0];
      ligne.push(mot === "null" ? null : Number(mot));
      i += mot.length;
    } else i++;
  }
  return lignes;
}

const PHOTOS = lignesInsert(SQL, "insert into public.photos (id, origine, chemin, largeur, hauteur, alt_fr, alt_en)");
const LIAISONS = lignesInsert(SQL, "insert into public.galeries_photos (galerie, photo_id, ordre)");

/** Les galeries telles que le code les affiche aujourd'hui. */
const GALERIES_DU_CODE: [string, readonly CleImage[]][] = [
  ["galerie_mariages", PHOTOS_MARIAGES],
  ["galerie_evenements", PHOTOS_EVENEMENTS],
  ...OPTIONS.map((o): [string, readonly CleImage[]] => [`option:${o.slug.fr}`, CONTENUS_OPTIONS[o.slug.fr].galerie]),
];

describe("migration 0007 : import des galeries", () => {
  it("est exactement le texte produit par le générateur (aucune retouche à la main)", () => {
    expect(SQL).toBe(sqlImportGaleries());
  });

  it("insère chaque photo utilisée par une galerie, une seule fois, avec ses dimensions et textes du registre", () => {
    const cles = [...new Set(GALERIES_DU_CODE.flatMap(([, liste]) => liste))];
    expect(PHOTOS).toHaveLength(cles.length);
    const parChemin = new Map(PHOTOS.map((p) => [p[2], p]));
    for (const cle of cles) {
      const i = IMAGES[cle];
      expect(parChemin.get(i.src), cle).toEqual([idPhotoSite(cle), "site", i.src, i.width, i.height, i.alt.fr, i.alt.en]);
    }
  });

  it("lie chaque galerie à ses photos dans l'ordre actuel, rangs 10, 20, 30…", () => {
    const cheminParId = new Map(PHOTOS.map((p) => [p[0], p[2]]));
    for (const [galerie, liste] of GALERIES_DU_CODE) {
      const lignes = LIAISONS.filter((l) => l[0] === galerie);
      expect(lignes.map((l) => cheminParId.get(l[1] as string)), galerie).toEqual(liste.map((c) => IMAGES[c].src));
      expect(lignes.map((l) => l[2]), galerie).toEqual(liste.map((_, i) => (i + 1) * 10));
    }
    expect(LIAISONS).toHaveLength(GALERIES_DU_CODE.reduce((n, [, liste]) => n + liste.length, 0));
  });

  it("respecte les contraintes de la table (chemin, galerie, identifiants UUID v5 uniques)", () => {
    for (const p of PHOTOS) {
      expect(p[2]).toMatch(/^\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/);
      expect(p[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(String(p[5]).length).toBeGreaterThan(0);
      expect(Array.from(String(p[5])).length).toBeLessThanOrEqual(300);
    }
    expect(new Set(PHOTOS.map((p) => p[0])).size).toBe(PHOTOS.length);
    for (const l of LIAISONS) expect(l[0]).toMatch(/^(galerie_mariages|galerie_evenements|option:[a-z0-9-]+)$/);
    expect(new Set(LIAISONS.map((l) => `${l[0]}|${l[1]}`)).size).toBe(LIAISONS.length);
  });

  it("porte les mêmes identifiants que les données de secours", () => {
    expect(PHOTOS.map((p) => p[0])).toEqual(photosDeRepli().map((p) => p.id));
    expect(LIAISONS).toEqual(liaisonsDeRepli().map((l) => [l.galerie, l.photo_id, l.ordre]));
  });
});
