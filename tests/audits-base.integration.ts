import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { lancerAudit, VERIFICATIONS, type ResultatVerification } from "@/lib/admin/audit-rls";
import { dependancesAuditVisiteur } from "@/lib/admin/audit-rls-serveur";
import { lancerTestsSql } from "@/lib/admin/tests-sql";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Audits contre la VRAIE base, à chaque commit (job « Audits base » de
 * .github/workflows/ci.yml) ou à la main :
 *
 *   npm run audits:base                                         # visiteur seul
 *   supabase_service_role_key=… npm run audits:base             # + comportements SQL
 *
 * 1. Audit des droits côté VISITEUR : les vérifications `visiteur` de
 *    lib/admin/audit-rls.ts (la même liste et le même évaluateur que l'onglet
 *    « Audit des droits »), avec la clé publishable, sans session. Toujours
 *    possible, aucun secret requis. Les écritures tentées doivent être
 *    refusées ; une écriture qui réussirait est une FAILLE (test rouge) et la
 *    ligne ou le fichier est effacé aussitôt avec la clé service_role, si elle
 *    est fournie (sinon le message dit quoi supprimer à la main).
 * 2. Comportements SQL (`tests_sql()`, migration 0010), si la clé service_role
 *    est fournie : chaque cas écrit puis annule, la base ressort inchangée.
 *    Sans utilisateur, le cas `est_admin()` de l'appelant est « non applicable ».
 *
 * Le code de sortie est non nul dès qu'une vérification ou un cas échoue, ou
 * si la suite SQL ne tourne pas. Exclu de `npx vitest run` et du prebuild
 * (extension `.integration.ts`, config vitest.audits.config.mts).
 *
 * Les deux audits s'exécutent au chargement du fichier : les tests sont ensuite
 * déclarés un par un, pour une ligne ✓/× par vérification dans le journal.
 */

const cleService = process.env.supabase_service_role_key || null;
const service = cleService ? createClient(SUPABASE_URL, cleService, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;

const verificationsVisiteur = VERIFICATIONS.filter((v) => v.role === "visiteur");
const audit = await lancerAudit(dependancesAuditVisiteur(service), verificationsVisiteur);
const suiteSql = service ? await lancerTestsSql(service) : null;

function intitule(r: ResultatVerification): string {
  const v = r.verification;
  const filtre = v.filtre ? ` (${Object.entries(v.filtre).map(([c, val]) => `${c} = ${String(val)}`).join(", ")})` : "";
  return `${v.libelle} — ${v.operation} ${v.cible}${filtre}, attendu ${v.attendu} → ${r.constat}`;
}

describe("Droits côté visiteur", () => {
  it(`couvre toutes les vérifications visiteur (base ${SUPABASE_URL})`, () => {
    expect(verificationsVisiteur.length).toBeGreaterThan(0);
    expect(audit.resultats).toHaveLength(verificationsVisiteur.length);
  });

  for (const r of audit.resultats) {
    it(intitule(r), () => {
      expect(r.ok, `${r.faille ? "FAILLE — " : ""}${r.constat}`).toBe(true);
    });
  }
});

describe("Comportements SQL", () => {
  if (!suiteSql) {
    // Le workflow affiche en plus un avertissement (::warning::) dans le résumé du job.
    it.skip("non lancés : secret supabase_service_role_key absent", () => {});
    return;
  }
  if ("erreur" in suiteSql) {
    it("la suite s'exécute", () => {
      expect.fail(suiteSql.erreur);
    });
    return;
  }
  for (const c of suiteSql.resultat.checks) {
    it(`${c.nom} → ${c.detail}`, () => {
      expect(c.ok, c.detail).toBe(true);
    });
  }
});
