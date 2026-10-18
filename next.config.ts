import { createHash } from "node:crypto";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { reglesEntetes } from "./lib/securite/entetes";
import { redirections } from "./lib/seo/redirections";
import paquet from "./package.json";

const production = process.env.NODE_ENV === "production";

// Empreinte opaque du build : compilée à l'identique dans le navigateur et dans
// /api/version, pour détecter qu'une nouvelle version a été déployée.
const empreinteBuild = createHash("sha256")
  .update(`${paquet.version}:${process.env.VERCEL_GIT_COMMIT_SHA ?? "local"}`)
  .digest("hex")
  .slice(0, 16);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_EMPREINTE_BUILD: empreinteBuild },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
    // Photos des galeries envoyées depuis le back office : bucket public `medias` du projet Supabase, et lui seul.
    remotePatterns: [{ protocol: "https", hostname: "tyghpfqyppiughrknuit.supabase.co", pathname: "/storage/v1/object/public/medias/**" }],
  },
  async headers() {
    // Règle générale, puis les deux exceptions du rapport des tests (voir lib/securite/entetes.ts).
    return reglesEntetes(production);
  },
  async redirects() {
    return redirections();
  },
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
