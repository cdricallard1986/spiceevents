import { chaineSql } from "@/lib/photos/import-sql";
import { lignesDeRepli } from "./repli";
import { imagesDuDocument, type DocumentArticle } from "./document";

/**
 * Contenu de la migration `supabase/migrations/0009_import_articles.sql` : les
 * 37 articles MDX d'avant le back office, publiés, convertis au format de
 * l'éditeur par `conversion.ts` (la même conversion que les données de
 * secours), avec leurs identifiants fixes (UUID v5 du slug).
 *
 * Écrite par `node outils/convertir_articles.mjs` ; import-sql.test.ts
 * vérifie que le fichier versionné est exactement ce texte, et qu'il
 * correspond aux fichiers MDX.
 */

export function sqlImportArticles(): string {
  const lignes = lignesDeRepli();
  const images = lignes.reduce((n, l) => n + imagesDuDocument(l.contenu as DocumentArticle).length, 0);
  const inserts = lignes.map((l) =>
    [
      `-- ${l.slug}`,
      "insert into public.articles (id, statut, publie_le, slug, titre, sous_titre, description, categorie, date_publication, couverture, couverture_alt, contenu) values (",
      `  ${chaineSql(l.id)}, ${chaineSql(l.statut)}, ${chaineSql(l.publie_le)}::timestamptz, ${chaineSql(l.slug)},`,
      `  ${chaineSql(l.titre)},`,
      `  ${chaineSql(l.sous_titre)},`,
      `  ${chaineSql(l.description)},`,
      `  ${chaineSql(l.categorie)}, ${chaineSql(l.date_publication)}::date,`,
      `  ${chaineSql(l.couverture)},`,
      `  ${chaineSql(l.couverture_alt)},`,
      `  ${chaineSql(JSON.stringify(l.contenu))}::jsonb`,
      ") on conflict do nothing;",
      "",
    ].join("\n"),
  );
  return [
    "-- Fichier généré par outils/convertir_articles.mjs (lib/journal/import-sql.ts) : ne pas modifier à la main.",
    "--",
    "-- Import des articles du journal d'avant le back office (contenu/journal/*.mdx),",
    "-- publiés : en-tête → colonnes, corps Markdown → document de l'éditeur",
    "-- (lib/journal/conversion.ts, la même conversion que les données de secours).",
    "-- Publication : la date de l'article, à midi heure de Paris. Identifiants fixes",
    "-- (UUID v5 du slug). Rejouable : un article déjà présent (id ou slug) est ignoré.",
    `-- ${lignes.length} articles, ${images} photos dans les textes.`,
    "",
    ...inserts,
  ].join("\n");
}
