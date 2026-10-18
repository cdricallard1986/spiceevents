import { describe, expect, it } from "vitest";
// Le moteur de correspondance qu'utilise Next pour `headers()` (next.config.ts).
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import {
  CHEMIN_PAGE_TESTS,
  CHEMIN_RAPPORT_TESTS,
  POLITIQUE_RAPPORT_TESTS,
  entetesSecurite,
  originesSupabase,
  politiqueContenu,
  reglesEntetes,
} from "./entetes";

const valeur = (prod: boolean, cle: string) => entetesSecurite(prod).find((e) => e.key === cle)?.value;

describe("entetesSecurite", () => {
  it("interdit l'affichage du site dans un cadre", () => {
    expect(valeur(true, "X-Frame-Options")).toBe("DENY");
    expect(politiqueContenu(true)).toContain("frame-ancestors 'none'");
  });

  it("n'envoie HSTS qu'en production", () => {
    expect(valeur(true, "Strict-Transport-Security")).toMatch(/max-age=\d+/);
    expect(valeur(false, "Strict-Transport-Security")).toBeUndefined();
  });

  it("ne permet eval qu'en développement", () => {
    expect(politiqueContenu(true)).not.toContain("unsafe-eval");
    expect(politiqueContenu(false)).toContain("unsafe-eval");
  });

  it("ferme les sources par défaut et les objets", () => {
    const csp = politiqueContenu(true);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("protège les URL contenant un jeton et coupe les capteurs", () => {
    expect(valeur(true, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(valeur(true, "Permissions-Policy")).toContain("camera=()");
    expect(valeur(true, "X-Content-Type-Options")).toBe("nosniff");
  });

  it("autorise le navigateur à joindre le projet Supabase, et lui seul", () => {
    const connect = politiqueContenu(true, "https://abcdef.supabase.co").split("; ").find((d) => d.startsWith("connect-src"));
    expect(connect).toBe("connect-src 'self' https://abcdef.supabase.co wss://abcdef.supabase.co https://va.vercel-scripts.com");
    expect(politiqueContenu(true)).toContain(`connect-src 'self' ${originesSupabase().join(" ")}`);
  });

  it("réduit l'adresse du projet à son origine", () => {
    expect(originesSupabase("https://abcdef.supabase.co/")).toEqual(["https://abcdef.supabase.co", "wss://abcdef.supabase.co"]);
  });
});

/** En-têtes qu'une adresse reçoit : règles dans l'ordre, la dernière l'emporte (comportement de Next). */
function entetesPour(chemin: string, production = true): Record<string, string> {
  const resultat: Record<string, string> = {};
  for (const regle of reglesEntetes(production)) {
    if (!getPathMatch(regle.source, { strict: true })(chemin)) continue;
    for (const { key, value } of regle.headers) resultat[key] = value;
  }
  return resultat;
}

const frameAncestors = (csp: string) => csp.split("; ").find((d) => d.startsWith("frame-ancestors"));
const frameSrc = (csp: string) => csp.split("; ").find((d) => d.startsWith("frame-src"));

describe("exception du rapport des tests", () => {
  it("le rapport accepte d'être encadré par le site, et seulement par lui", () => {
    const e = entetesPour(CHEMIN_RAPPORT_TESTS);
    expect(e["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(e["Content-Security-Policy"]).toBe(POLITIQUE_RAPPORT_TESTS);
    expect(frameAncestors(e["Content-Security-Policy"])).toBe("frame-ancestors 'self'");
  });

  it("la CSP du rapport ne laisse rien charger : ni script, ni image, ni police, ni formulaire", () => {
    expect(POLITIQUE_RAPPORT_TESTS).toContain("default-src 'none'");
    expect(POLITIQUE_RAPPORT_TESTS).toContain("style-src 'unsafe-inline'");
    expect(POLITIQUE_RAPPORT_TESTS).not.toMatch(/script-src|'self' 'unsafe|https?:/);
    expect(POLITIQUE_RAPPORT_TESTS).toContain("form-action 'none'");
  });

  it("le rapport garde les autres protections (nosniff, Referrer-Policy, HSTS…)", () => {
    const e = entetesPour(CHEMIN_RAPPORT_TESTS);
    expect(e["X-Content-Type-Options"]).toBe("nosniff");
    expect(e["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(e["Strict-Transport-Security"]).toMatch(/max-age/);
  });

  it("seule la page /admin/tests peut encadrer une page du site, et elle-même reste non encadrable", () => {
    const e = entetesPour(CHEMIN_PAGE_TESTS);
    expect(frameSrc(e["Content-Security-Policy"])).toBe("frame-src 'self' https://www.youtube-nocookie.com");
    expect(frameAncestors(e["Content-Security-Policy"])).toBe("frame-ancestors 'none'");
    expect(e["X-Frame-Options"]).toBe("DENY");
  });

  it("toutes les autres adresses restent fermées (DENY, frame-ancestors 'none', pas de cadre du site)", () => {
    // (La racine « / » est vérifiée sur le serveur réel : le moteur la normalise avant de comparer.)
    for (const chemin of [
      "/en",
      "/contact",
      "/admin",
      "/admin/emails",
      "/admin/connexion",
      "/admin/tests/rapport/autre",
      "/admin/tests/rapportx",
      "/admin/testsx",
      "/en/admin/tests/rapport",
      "/api/version",
    ]) {
      const e = entetesPour(chemin);
      expect(e["X-Frame-Options"], chemin).toBe("DENY");
      expect(frameAncestors(e["Content-Security-Policy"]), chemin).toBe("frame-ancestors 'none'");
      expect(frameSrc(e["Content-Security-Policy"]), chemin).toBe("frame-src https://www.youtube-nocookie.com");
    }
  });

  it("la règle générale vient en premier (les exceptions la remplacent, Next garde la dernière)", () => {
    const regles = reglesEntetes(true);
    expect(regles[0]).toEqual({ source: "/:path*", headers: entetesSecurite(true) });
    expect(regles.map((r) => r.source)).toEqual(["/:path*", CHEMIN_PAGE_TESTS, CHEMIN_RAPPORT_TESTS]);
  });
});
