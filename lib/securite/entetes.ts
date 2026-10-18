/**
 * En-têtes HTTP de sécurité appliqués à toutes les réponses (branchés dans
 * `next.config.ts`). Fonction pure pour pouvoir la tester.
 *
 * ⚠️ Ajouter un service externe (lecteur vidéo, police, outil de mesure…) =
 * l'ajouter ici, sinon le navigateur le bloque sans autre signe qu'une erreur
 * dans la console.
 */

import { SUPABASE_URL } from "../supabase/config";

export type Entete = { key: string; value: string };

/** Origine du projet Supabase (https), et son équivalent wss pour le temps réel. */
export function originesSupabase(url: string = SUPABASE_URL): string[] {
  const origine = new URL(url).origin;
  return [origine, origine.replace(/^https:/, "wss:")];
}

/** Tiers autorisés, nommés un par un. */
export const TIERS = {
  // Lecteur YouTube en mode « sans cookies » pour les vidéos de démonstration.
  cadres: ["https://www.youtube-nocookie.com"],
  // Script de Vercel Web Analytics en développement (en production il est servi par le site).
  scripts: ["https://va.vercel-scripts.com"],
} as const;

/**
 * Politique de sécurité du contenu. Le navigateur parle directement à Supabase
 * (back office : session, envoi des photos) : son origine est dans `connect-src`.
 * ⚠️ next.config.ts importe ce fichier : imports relatifs seulement (pas d'alias `@/`).
 */
export function politiqueContenu(production: boolean, supabaseUrl: string = SUPABASE_URL): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Pas de nonce : Next injecte des scripts en ligne, un nonce rendrait toutes les pages dynamiques.
    "script-src": ["'self'", "'unsafe-inline'", ...TIERS.scripts, ...(production ? [] : ["'unsafe-eval'"])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...originesSupabase(supabaseUrl), ...TIERS.scripts],
    "frame-src": [...TIERS.cadres],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const lignes = Object.entries(directives).map(([nom, valeurs]) => `${nom} ${valeurs.join(" ")}`);
  if (production) lignes.push("upgrade-insecure-requests");
  return lignes.join("; ");
}

export function entetesSecurite(production: boolean): Entete[] {
  const entetes: Entete[] = [
    { key: "Content-Security-Policy", value: politiqueContenu(production) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  // HSTS seulement en production : en local il « collerait » à localhost.
  if (production) {
    entetes.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }
  return entetes;
}
