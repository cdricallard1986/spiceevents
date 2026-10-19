import { exigerAdmin } from "@/lib/admin/garde";
import { lancerTestsSql } from "@/lib/admin/tests-sql";

/**
 * Comportements SQL « live » (onglet de /admin/tests) : exécute `tests_sql()`
 * (migration 0010) avec la session de Cédric et renvoie `{ ok, checks }`.
 *
 * Garde : le middleware renvoie déjà vers la connexion sans session ;
 * `exigerAdmin()` vérifie en plus `est_admin()`. La fonction est en SECURITY
 * INVOKER : ses écritures (toutes annulées) passent par la RLS de la session.
 *
 * Une suite qui ne tourne pas (fonction absente, erreur SQL) répond 500 avec
 * la raison : l'onglet affiche une erreur, jamais un verdict partiel.
 */
export const dynamic = "force-dynamic";

const ENTETES = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET() {
  const { supabase } = await exigerAdmin();
  const verdict = await lancerTestsSql(supabase);
  if ("erreur" in verdict) {
    console.error(`[admin] Tests SQL : ${verdict.erreur}`);
    return Response.json({ error: verdict.erreur }, { status: 500, headers: ENTETES });
  }
  const echecs = verdict.resultat.checks.filter((c) => !c.ok);
  if (echecs.length) console.error("[admin] Tests SQL : cas en échec.", echecs.map((c) => c.nom));
  return Response.json(verdict.resultat, { status: 200, headers: ENTETES });
}
