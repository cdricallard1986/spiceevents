import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Audits contre la VRAIE base (`npm run audits:base`, job « Audits base » de
 * la CI). Configuration séparée : ce fichier n'est jamais lancé par
 * `npx vitest run` ni par le prebuild (leur motif est `*.test.ts`).
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: { alias: { "server-only": "next/dist/compiled/server-only/empty.js" } },
  test: {
    environment: "node",
    include: ["tests/audits-base.integration.ts"],
    // Une ligne par vérification dans le journal, ✓ ou ×.
    reporters: ["verbose"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
