import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { idArticle } from "./conversion";
import { imagesDuDocument, liensDuDocument, texteBrut, validerDocument, type DocumentArticle } from "./document";
import { sqlImportArticles } from "./import-sql";
import { lignesDeRepli } from "./repli";
import { validerChampsArticle, verifierPublication } from "./schema";

/**
 * La migration 0009 doit correspondre EXACTEMENT aux 37 articles MDX : mêmes
 * en-têtes, mêmes photos dans le même ordre, même texte, mêmes liens. Le test
 * relit le fichier SQL ET les fichiers MDX de façon indépendante (sans
 * l'analyseur Markdown de la conversion) et compare les deux.
 *
 * Pour réécrire le fichier : `node outils/convertir_articles.mjs`.
 */

const FICHIER = join(__dirname, "../../supabase/migrations/0009_import_articles.sql");
if (process.env.ECRIRE_IMPORT_ARTICLES === "1") writeFileSync(FICHIER, sqlImportArticles());
const SQL = readFileSync(FICHIER, "utf8");

const COLONNES = ["id", "statut", "publie_le", "slug", "titre", "sous_titre", "description", "categorie", "date_publication", "couverture", "couverture_alt", "contenu"] as const;
type Ligne = Record<(typeof COLONNES)[number], string | null>;

/** Lit chaque `insert into public.articles (…) values (…)` : chaînes SQL ('' = '), `::type` ignoré, null. */
function lignesSql(sql: string): Ligne[] {
  const debut = `insert into public.articles (${COLONNES.join(", ")}) values (`;
  const lignes: Ligne[] = [];
  let i = sql.indexOf(debut);
  while (i >= 0) {
    i += debut.length;
    const valeurs: (string | null)[] = [];
    while (sql[i] !== ")" || valeurs.length < COLONNES.length) {
      const c = sql[i];
      if (c === "'") {
        let v = "";
        i++;
        for (;;) {
          if (sql[i] === "'" && sql[i + 1] === "'") {
            v += "'";
            i += 2;
          } else if (sql[i] === "'") {
            i++;
            break;
          } else v += sql[i++];
        }
        valeurs.push(v);
        const cast = /^::[a-z]+/.exec(sql.slice(i));
        if (cast) i += cast[0].length;
      } else if (sql.startsWith("null", i)) {
        valeurs.push(null);
        i += 4;
      } else if (/[\s,]/.test(c)) i++;
      else throw new Error(`Valeur SQL illisible près de : ${sql.slice(i, i + 40)}`);
    }
    expect(sql.slice(i, i + 26)).toBe(") on conflict do nothing;\n");
    lignes.push(Object.fromEntries(COLONNES.map((c, k) => [c, valeurs[k]])) as Ligne);
    i = sql.indexOf(debut, i);
  }
  return lignes;
}

const LIGNES = lignesSql(SQL);

// --- Lecture indépendante des MDX ---------------------------------------------------

const DOSSIER = join(__dirname, "../../contenu/journal");
const FICHIERS = readdirSync(DOSSIER).filter((f) => f.endsWith(".mdx")).sort();

type Mdx = { slug: string; enTete: Record<string, string>; corps: string };

function lireMdx(fichier: string): Mdx {
  const source = readFileSync(join(DOSSIER, fichier), "utf8");
  const [, entete, corps] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source)!;
  const enTete = Object.fromEntries(entete.split("\n").map((l) => [l.slice(0, l.indexOf(":")), JSON.parse(l.slice(l.indexOf(":") + 1))]));
  return { slug: fichier.replace(/\.mdx$/, ""), enTete, corps };
}

const MDX = FICHIERS.map(lireMdx);

const PHOTO = /^<PhotoArticle src="([^"]+)" width=\{(\d+)\} height=\{(\d+)\} alt="([^"]*)" \/>$/;
const LIEN = /\[([^\]]*)\]\(([^)\s]+)\)/g;

/** Texte affiché d'un passage Markdown : liens réduits à leur texte, `*` et `**` retirés, `\*` gardé. */
function texteAffiche(markdown: string): string {
  return markdown
    .replace(LIEN, "$1")
    .replace(/\\\*/g, "\u0000")
    .replace(/\*/g, "")
    .replace(/\u0000/g, "*");
}

/** Le texte du MDX tel qu'une page le montre : une ligne par bloc, sans les marques de titre, liste, citation. */
function texteDuMdx(corps: string): string {
  return corps
    .split("\n")
    .filter((l) => l.trim() && !PHOTO.test(l))
    .map((l) => texteAffiche(l.replace(/^(#{2,3} |- |> )/, "")))
    .join("\n");
}

const espaces = (t: string) => t.replace(/\s+/g, " ").trim();

describe("migration 0009 : import des articles du journal", () => {
  it("est exactement le texte produit par le générateur (aucune retouche à la main)", () => {
    expect(SQL).toBe(sqlImportArticles());
  });

  it("insère les 37 articles des fichiers MDX, une fois chacun, publiés, avec un identifiant fixe", () => {
    expect(FICHIERS).toHaveLength(37);
    expect(LIGNES.map((l) => l.slug)).toEqual(MDX.map((m) => m.slug));
    for (const l of LIGNES) {
      expect(l.statut).toBe("publie");
      expect(l.id).toBe(idArticle(l.slug!));
      expect(l.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(new Set(LIGNES.map((l) => l.id)).size).toBe(37);
  });

  it("reprend l'en-tête de chaque MDX : titre, sous-titre, description, catégorie, date, couverture", () => {
    for (const [k, m] of MDX.entries()) {
      const l = LIGNES[k];
      expect(l, m.slug).toMatchObject({
        titre: m.enTete.titre,
        sous_titre: m.enTete.sousTitre ?? null,
        description: m.enTete.description,
        categorie: m.enTete.categorie,
        date_publication: m.enTete.date,
        couverture: m.enTete.couverture,
        couverture_alt: m.enTete.couvertureAlt,
      });
    }
  });

  it("date la publication du jour de l'article, à midi heure de Paris", () => {
    for (const l of LIGNES) {
      expect(l.publie_le, l.slug!).toMatch(new RegExp(`^${l.date_publication}T12:00:00\\+0[12]:00$`));
      // Midi à Paris = 11 h UTC en hiver, 10 h UTC en été, le même jour.
      const utc = new Date(l.publie_le!).toISOString();
      expect(utc.slice(0, 10)).toBe(l.date_publication);
      expect(["10", "11"]).toContain(utc.slice(11, 13));
    }
  });

  it("garde chaque photo du texte, dans l'ordre, avec ses dimensions et son texte alternatif (107 en tout)", () => {
    let total = 0;
    for (const [k, m] of MDX.entries()) {
      const attendues = m.corps
        .split("\n")
        .map((l) => PHOTO.exec(l))
        .filter((x) => x !== null)
        .map(([, src, width, height, alt]) => ({ src, width: Number(width), height: Number(height), alt }));
      expect(m.corps.match(/<PhotoArticle/g)?.length ?? 0, m.slug).toBe(attendues.length);
      expect(imagesDuDocument(JSON.parse(LIGNES[k].contenu!)), m.slug).toEqual(attendues);
      total += attendues.length;
    }
    expect(total).toBe(107);
  });

  it("garde le texte affiché, mot pour mot", () => {
    for (const [k, m] of MDX.entries()) {
      expect(espaces(texteBrut(JSON.parse(LIGNES[k].contenu!))), m.slug).toBe(espaces(texteDuMdx(m.corps)));
    }
  });

  it("garde chaque lien, dans l'ordre, avec son texte et sa cible", () => {
    let total = 0;
    for (const [k, m] of MDX.entries()) {
      const attendus = [...m.corps.matchAll(LIEN)].map(([, texte, href]) => ({ href, texte: texteAffiche(texte) }));
      expect(liensDuDocument(JSON.parse(LIGNES[k].contenu!)), m.slug).toEqual(attendus);
      total += attendus.length;
    }
    expect(total).toBeGreaterThan(250);
  });

  it("garde la structure : intertitres, listes et citation", () => {
    for (const [k, m] of MDX.entries()) {
      const doc = JSON.parse(LIGNES[k].contenu!) as DocumentArticle;
      const types = doc.content.map((b) => (b.type === "heading" ? `h${b.attrs.level}` : b.type));
      expect(types.filter((t) => t === "h2").length, m.slug).toBe(m.corps.match(/^## /gm)?.length ?? 0);
      expect(types.filter((t) => t === "blockquote").length, m.slug).toBe(m.corps.match(/^> /gm)?.length ?? 0);
      const items = doc.content.flatMap((b) => (b.type === "bulletList" ? b.content : []));
      expect(items.length, m.slug).toBe(m.corps.match(/^- /gm)?.length ?? 0);
    }
  });

  it("respecte les contraintes de la table : chaque article est valide et complet pour être publié", () => {
    for (const l of LIGNES) {
      expect(validerDocument(JSON.parse(l.contenu!)).ok, l.slug!).toBe(true);
      const r = validerChampsArticle({ ...l, contenu: JSON.parse(l.contenu!) });
      expect(r.ok, l.slug!).toBe(true);
      if (r.ok) expect(verifierPublication(r.champs), l.slug!).toEqual({});
    }
  });

  it("porte exactement les données de secours (même conversion)", () => {
    expect(LIGNES.map((l) => ({ ...l, contenu: JSON.parse(l.contenu!) }))).toEqual(lignesDeRepli());
  });
});
