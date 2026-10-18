import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // « server-only » est fourni par Next (sans paquet) : sa version vide permet de tester les modules serveur.
  resolve: { alias: { "server-only": "next/dist/compiled/server-only/empty.js" } },
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "site-actuel/**"],
    setupFiles: ["./vitest.setup.ts"],
    // next-intl importe « next/navigation » sans extension : à faire résoudre par Vite.
    server: { deps: { inline: ["next-intl"] } },
  },
});
