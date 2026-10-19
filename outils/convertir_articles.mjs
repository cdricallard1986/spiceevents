// Écrit supabase/migrations/0009_import_articles.sql à partir des articles MDX
// de contenu/journal/ (lib/journal/import-sql.ts), puis vérifie le fichier écrit.
//
//   node outils/convertir_articles.mjs
//
// La conversion est en TypeScript (lib/journal/conversion.ts, partagée avec
// les données de secours du site) : on passe par le test qui compare le
// fichier aux MDX, avec ECRIRE_IMPORT_ARTICLES=1 pour qu'il l'écrive d'abord.
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["vitest", "run", "lib/journal/import-sql.test.ts"], {
  stdio: "inherit",
  env: { ...process.env, ECRIRE_IMPORT_ARTICLES: "1" },
});
process.exit(r.status ?? 1);
