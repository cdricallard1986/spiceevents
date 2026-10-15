import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "site-actuel/**"],
    setupFiles: ["./vitest.setup.ts"],
    // next-intl importe « next/navigation » sans extension : à faire résoudre par Vite.
    server: { deps: { inline: ["next-intl"] } },
  },
});
