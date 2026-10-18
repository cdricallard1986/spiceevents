// Écrit supabase/migrations/0007_import_galeries.sql à partir des galeries du
// code (lib/photos/import-sql.ts), puis vérifie le fichier écrit.
//
//   node outils/generer_import_galeries.mjs
//
// Le générateur est en TypeScript (il lit lib/images.generated.ts et les listes
// de contenu/) : on passe par le test qui le compare au fichier, avec
// ECRIRE_IMPORT_GALERIES=1 pour qu'il l'écrive d'abord.
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["vitest", "run", "lib/photos/import-sql.test.ts"], {
  stdio: "inherit",
  env: { ...process.env, ECRIRE_IMPORT_GALERIES: "1" },
});
process.exit(r.status ?? 1);
