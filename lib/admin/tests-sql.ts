import { z } from "zod";

/**
 * Suite des comportements SQL (migration 0010, fonction `tests_sql()`) :
 * appel et lecture du verdict, logique pure et testée. Partagée par la route
 * `/admin/tests/sql` (session de Cédric) et l'audit de la CI
 * (`npm run audits:base`, clé service_role).
 *
 * Toute la logique des cas vit dans la fonction SQL, au même endroit que ce
 * qu'elle vérifie, et reste exécutable sans l'application
 * (`select * from public.tests_sql()`). Ici, on ne fait que l'appeler et
 * refuser un verdict douteux : une suite qui ne tourne pas, ou qui ne renvoie
 * rien, est une ERREUR (jamais un vert partiel).
 */

export type CasSql = { nom: string; ok: boolean; detail: string };
export type ResultatSuiteSql = { ok: boolean; checks: CasSql[] };
export type VerdictSuiteSql = { resultat: ResultatSuiteSql } | { erreur: string };

/** Fonctions appelées, dans l'ordre (une par thème, comme dans le CRM, si la suite grossit). */
export const SUITES_SQL = ["tests_sql"] as const;

/** Vue minimale d'un client Supabase : seul `rpc` sert (session admin, service_role ou faux client de test). */
export type ClientRpc = {
  rpc(fonction: string): PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
};

const schemaCas = z.object({
  nom: z.string(),
  // Un `ok` nul (comparaison SQL avec NULL) compte comme un échec, jamais comme un succès.
  ok: z.boolean().nullable(),
  detail: z.string().nullable(),
});

/** Lance les suites SQL et rend leurs cas fusionnés, ou la raison pour laquelle on ne peut pas conclure. */
export async function lancerTestsSql(client: ClientRpc): Promise<VerdictSuiteSql> {
  const checks: CasSql[] = [];
  for (const suite of SUITES_SQL) {
    let reponse: Awaited<ReturnType<ClientRpc["rpc"]>>;
    try {
      reponse = await client.rpc(suite);
    } catch (e) {
      return { erreur: `La suite « ${suite} » n'a pas pu s'exécuter : ${e instanceof Error ? e.message : String(e)}` };
    }
    if (reponse.error) {
      const code = reponse.error.code ? ` (${reponse.error.code})` : "";
      return { erreur: `La suite « ${suite} » n'a pas pu s'exécuter${code} : ${reponse.error.message}` };
    }
    const lecture = z.array(schemaCas).safeParse(reponse.data);
    if (!lecture.success) return { erreur: `La suite « ${suite} » a renvoyé une réponse illisible.` };
    if (lecture.data.length === 0) return { erreur: `La suite « ${suite} » n'a renvoyé aucun cas : impossible de conclure.` };
    checks.push(...lecture.data.map((c) => ({ nom: c.nom, ok: c.ok === true, detail: c.detail ?? "" })));
  }
  return { resultat: { ok: checks.every((c) => c.ok), checks } };
}

// --- Navigateur : appel de la route gardée -----------------------------------

/** Route qui exécute la suite avec la session de Cédric. */
export const CHEMIN_TESTS_SQL = "/admin/tests/sql";

/**
 * Interroge la route depuis l'onglet « Comportements SQL ». Lève une erreur
 * lisible si la suite n'a pas tourné : réponse 500 (raison renvoyée par la
 * route) ou page HTML (session expirée : le middleware a renvoyé vers la
 * connexion, et `fetch` a suivi la redirection).
 */
export async function interrogerSuiteSql(chemin: string = CHEMIN_TESTS_SQL): Promise<ResultatSuiteSql> {
  const reponse = await fetch(chemin, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!(reponse.headers.get("content-type") ?? "").includes("application/json")) {
    throw new Error("La suite n'a pas pu être lancée : rechargez la page (la session a peut-être expiré) puis réessayez.");
  }
  const corps: unknown = await reponse.json();
  const raison = corps && typeof corps === "object" && "error" in corps && typeof corps.error === "string" ? corps.error : null;
  if (!reponse.ok) throw new Error(raison ?? `La suite n'a pas pu être lancée (erreur HTTP ${reponse.status}).`);
  const lecture = z.object({ ok: z.boolean(), checks: z.array(z.object({ nom: z.string(), ok: z.boolean(), detail: z.string() })) }).safeParse(corps);
  if (!lecture.success) throw new Error("Réponse illisible de la suite SQL.");
  return lecture.data;
}
