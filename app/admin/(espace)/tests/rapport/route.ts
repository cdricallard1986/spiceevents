import { exigerAdmin } from "@/lib/admin/garde";
import { RAPPORT_TESTS_HTML } from "@/lib/admin/rapport-tests.generated";
import { entetesRapportTests } from "@/lib/securite/entetes";

/**
 * Rapport Vitest du dernier build, affiché dans un cadre par /admin/tests.
 * Réservé à l'administrateur (le middleware renvoie déjà vers la connexion
 * sans session ; la garde vérifie en plus `est_admin()`).
 *
 * En-têtes propres à cette réponse (les mêmes que l'exception de
 * next.config.ts, posés ici aussi par sécurité) : CSP `default-src 'none'`,
 * encadrement par le site seulement, jamais mis en cache.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  await exigerAdmin();
  const entetes = new Headers(entetesRapportTests(process.env.NODE_ENV === "production").map((e): [string, string] => [e.key, e.value]));
  entetes.set("Content-Type", "text/html; charset=utf-8");
  entetes.set("Cache-Control", "no-store");
  entetes.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(RAPPORT_TESTS_HTML, { status: 200, headers: entetes });
}
