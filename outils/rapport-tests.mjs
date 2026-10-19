#!/usr/bin/env node
/**
 * Rapport des tests pour la page /admin/tests, lancé au `prebuild`.
 *
 * 1. exécute Vitest (sortie habituelle dans le journal du build + sortie JSON
 *    dans un fichier temporaire) ;
 * 2. transforme le JSON en page HTML auto-contenue (lib/admin/rapport-tests.ts,
 *    logique pure et testée) ;
 * 3. l'écrit dans le module serveur lib/admin/rapport-tests.generated.ts —
 *    JAMAIS dans public/ : seule la route protégée /admin/tests/rapport le sert ;
 * 4. échoue si un test échoue (on ne déploie pas un build rouge), mais APRÈS
 *    avoir écrit le rapport.
 *
 * `--reinitialiser` (lancé au `postbuild`) remet le module à son contenu par
 * défaut : le build a déjà embarqué le rapport, et le dépôt reste propre.
 *
 * Usage : npm run tests:rapport, ou node outils/rapport-tests.mjs [--reinitialiser]
 * Les scripts npm passent `--experimental-strip-types` : sans cette option, un
 * Node 22 antérieur à 22.18 (celui de Vercel, par exemple) refuse d'importer le
 * fichier .ts ci-dessous, et le build échoue avant même de lancer les tests.
 * (`--disable-warning=…` coupe les avertissements que Node affiche alors.)
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Node (≥ 22.18) efface les types à la volée : la logique reste un seul fichier TypeScript testé.
import { construireRapport, moduleGenere, rapportAbsentHtml, rapportHtml, resumer } from "../lib/admin/rapport-tests.ts";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
console.log(`[rapport-tests] Node ${process.version}`);
const SORTIE = join(RACINE, "lib", "admin", "rapport-tests.generated.ts");
const version = JSON.parse(readFileSync(join(RACINE, "package.json"), "utf8")).version;

function ecrire(contenu) {
  writeFileSync(SORTIE, contenu);
}

if (process.argv.includes("--reinitialiser")) {
  ecrire(moduleGenere(null, rapportAbsentHtml()));
  console.log("[rapport-tests] Module remis à son contenu par défaut.");
  process.exit(0);
}

const fichierJson = join(tmpdir(), `spiceevents-vitest-${process.pid}.json`);
console.log("[rapport-tests] Lancement des tests…");
const execution = spawnSync(
  process.execPath,
  [join(RACINE, "node_modules", "vitest", "vitest.mjs"), "run", "--reporter=default", "--reporter=json", `--outputFile.json=${fichierJson}`],
  { cwd: RACINE, stdio: "inherit" },
);

let sortie = null;
if (existsSync(fichierJson)) {
  try {
    sortie = JSON.parse(readFileSync(fichierJson, "utf8"));
  } catch (e) {
    console.error("[rapport-tests] Sortie JSON de Vitest illisible :", e);
  }
  rmSync(fichierJson, { force: true });
}

if (!sortie) {
  // Vitest n'a rien produit (plantage avant les tests) : rapport d'échec explicite.
  const message = execution.error ? String(execution.error) : `Vitest s'est arrêté (code ${execution.status}) sans produire de résultat.`;
  sortie = { success: false, startTime: Date.now(), testResults: [{ name: "vitest", status: "failed", message, assertionResults: [] }] };
}

const rapport = construireRapport(sortie, RACINE);
ecrire(moduleGenere(resumer(rapport, version), rapportHtml(rapport, version)));

const { total, reussis, echoues, ignores } = rapport.totaux;
console.log(`[rapport-tests] Rapport écrit : ${total} tests, ${reussis} réussis, ${echoues} échoués, ${ignores} ignorés.`);

if (!rapport.succes || execution.status !== 0) {
  console.error("[rapport-tests] Des tests échouent : build interrompu (le rapport est visible sur /admin/tests en local).");
  process.exit(1);
}
