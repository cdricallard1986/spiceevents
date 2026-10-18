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

export type OptionsPolitique = {
  /** Autorise les cadres du site lui-même (`frame-src 'self'`) : page /admin/tests seulement. */
  cadresDuSite?: boolean;
};

/**
 * Politique de sécurité du contenu. Le navigateur parle directement à Supabase
 * (back office : session, envoi direct des photos par URL signée) : son origine
 * est dans `connect-src`. Elle est aussi dans `img-src` : aperçus du back office
 * et photos du bucket `medias` (les pages publiques passent d'ordinaire par
 * `next/image`, servi par le site).
 * ⚠️ next.config.ts importe ce fichier : imports relatifs seulement (pas d'alias `@/`).
 */
export function politiqueContenu(production: boolean, supabaseUrl: string = SUPABASE_URL, options: OptionsPolitique = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Pas de nonce : Next injecte des scripts en ligne, un nonce rendrait toutes les pages dynamiques.
    "script-src": ["'self'", "'unsafe-inline'", ...TIERS.scripts, ...(production ? [] : ["'unsafe-eval'"])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", originesSupabase(supabaseUrl)[0]],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...originesSupabase(supabaseUrl), ...TIERS.scripts],
    "frame-src": [...(options.cadresDuSite ? ["'self'"] : []), ...TIERS.cadres],
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

export function entetesSecurite(production: boolean, options: OptionsPolitique = {}): Entete[] {
  const entetes: Entete[] = [
    { key: "Content-Security-Policy", value: politiqueContenu(production, SUPABASE_URL, options) },
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

// --- Exception ciblée : le rapport des tests du back office -----------------
//
// La page /admin/tests affiche le rapport Vitest dans un cadre. Seule l'adresse
// du rapport accepte d'être encadrée, et seulement par le site lui-même ; seule
// la page /admin/tests peut encadrer une page du site. Tout le reste garde
// `frame-ancestors 'none'` + `X-Frame-Options: DENY`.

export const CHEMIN_PAGE_TESTS = "/admin/tests";
export const CHEMIN_RAPPORT_TESTS = "/admin/tests/rapport";

/** Rapport auto-contenu : rien ne se charge (ni script, ni image, ni police), styles en ligne seulement. */
export const POLITIQUE_RAPPORT_TESTS = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

/** En-têtes de la route du rapport : ceux du site, sauf le cadre (même origine permise). */
export function entetesRapportTests(production: boolean): Entete[] {
  return entetesSecurite(production).map((e) => {
    if (e.key === "Content-Security-Policy") return { ...e, value: POLITIQUE_RAPPORT_TESTS };
    if (e.key === "X-Frame-Options") return { ...e, value: "SAMEORIGIN" };
    return e;
  });
}

export type RegleEntetes = { source: string; headers: Entete[] };

/**
 * Règles de `headers()` dans next.config.ts. ⚠️ L'ordre compte : quand deux
 * règles posent le même en-tête sur une adresse, Next garde la DERNIÈRE. Les
 * exceptions (adresses exactes, sans paramètre) viennent donc après la règle
 * générale et ne remplacent que la CSP et X-Frame-Options.
 */
export function reglesEntetes(production: boolean): RegleEntetes[] {
  return [
    { source: "/:path*", headers: entetesSecurite(production) },
    { source: CHEMIN_PAGE_TESTS, headers: entetesSecurite(production, { cadresDuSite: true }) },
    { source: CHEMIN_RAPPORT_TESTS, headers: entetesRapportTests(production) },
  ];
}
