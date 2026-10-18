import { liaisonsDeRepli, photosDeRepli } from "./repli";

/**
 * Contenu de la migration `supabase/migrations/0007_import_galeries.sql` :
 * les photos du site utilisées par les galeries actuelles et leurs liaisons,
 * dans l'ordre actuel, avec les identifiants fixes des données de secours.
 *
 * Écrite par `node outils/generer_import_galeries.mjs` ; import-sql.test.ts
 * vérifie que le fichier versionné est exactement ce texte.
 */

/** Chaîne SQL : apostrophes doublées. */
export function chaineSql(valeur: string | null): string {
  return valeur === null ? "null" : `'${valeur.replace(/'/g, "''")}'`;
}

export function sqlImportGaleries(): string {
  const photos = photosDeRepli();
  const liaisons = liaisonsDeRepli();
  const lignesPhotos = photos.map(
    (p) => `  (${chaineSql(p.id)}, 'site', ${chaineSql(p.chemin)}, ${p.largeur}, ${p.hauteur}, ${chaineSql(p.alt_fr)}, ${chaineSql(p.alt_en)})`,
  );
  const lignesLiaisons = liaisons.map((l) => `  (${chaineSql(l.galerie)}, ${chaineSql(l.photo_id)}, ${l.ordre})`);
  return [
    "-- Fichier généré par outils/generer_import_galeries.mjs (lib/photos/import-sql.ts) : ne pas modifier à la main.",
    "--",
    "-- Import des galeries d'avant le back office : les photos du site (fichiers",
    "-- `/images/…`, laissés où ils sont) utilisées par la page Galerie et les pages",
    "-- d'animations, puis leurs liaisons, dans l'ordre actuel (10, 20, 30…).",
    "-- Identifiants fixes (UUID v5 du chemin) : les mêmes que les données de secours",
    "-- (lib/photos/repli.ts). Rejouable : une ligne déjà présente est ignorée.",
    `-- ${photos.length} photos, ${liaisons.length} liaisons.`,
    "",
    "insert into public.photos (id, origine, chemin, largeur, hauteur, alt_fr, alt_en) values",
    `${lignesPhotos.join(",\n")}`,
    "on conflict do nothing;",
    "",
    "insert into public.galeries_photos (galerie, photo_id, ordre) values",
    `${lignesLiaisons.join(",\n")}`,
    "on conflict (galerie, photo_id) do nothing;",
    "",
  ].join("\n");
}
