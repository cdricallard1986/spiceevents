import { describe, expect, it, vi } from "vitest";
import { interrogerSuiteSql, lancerTestsSql, type ClientRpc } from "./tests-sql";

function client(reponse: { data: unknown; error: { message: string; code?: string } | null } | Error): ClientRpc & { rpc: ReturnType<typeof vi.fn> } {
  return {
    rpc: vi.fn(async () => {
      if (reponse instanceof Error) throw reponse;
      return reponse;
    }),
  };
}

describe("lancerTestsSql", () => {
  it("appelle tests_sql() et rend chaque cas ; vert seulement si tous passent", async () => {
    const c = client({
      data: [
        { nom: "Avis : un texte vide est refusé", ok: true, detail: "refusé (avis_texte_fr_check) / accepté" },
        { nom: "Journal : une modification met à jour updated_at", ok: true, detail: "maintenant" },
      ],
      error: null,
    });
    expect(await lancerTestsSql(c)).toEqual({
      resultat: {
        ok: true,
        checks: [
          { nom: "Avis : un texte vide est refusé", ok: true, detail: "refusé (avis_texte_fr_check) / accepté" },
          { nom: "Journal : une modification met à jour updated_at", ok: true, detail: "maintenant" },
        ],
      },
    });
    expect(c.rpc).toHaveBeenCalledWith("tests_sql");
  });

  it("un seul cas en échec rend la suite rouge ; un ok nul compte comme un échec", async () => {
    const verdict = await lancerTestsSql(
      client({
        data: [
          { nom: "a", ok: true, detail: "" },
          { nom: "b", ok: null, detail: null },
        ],
        error: null,
      }),
    );
    expect(verdict).toEqual({ resultat: { ok: false, checks: [{ nom: "a", ok: true, detail: "" }, { nom: "b", ok: false, detail: "" }] } });
  });

  it("une suite qui ne tourne pas est une erreur, jamais un verdict", async () => {
    expect(await lancerTestsSql(client({ data: null, error: { code: "PGRST202", message: "Could not find the function public.tests_sql" } }))).toEqual({
      erreur: "La suite « tests_sql » n'a pas pu s'exécuter (PGRST202) : Could not find the function public.tests_sql",
    });
    expect(await lancerTestsSql(client(new Error("fetch failed")))).toEqual({ erreur: "La suite « tests_sql » n'a pas pu s'exécuter : fetch failed" });
  });

  it("une suite vide ou une réponse illisible ne passe pas pour verte", async () => {
    expect(await lancerTestsSql(client({ data: [], error: null }))).toEqual({ erreur: "La suite « tests_sql » n'a renvoyé aucun cas : impossible de conclure." });
    expect(await lancerTestsSql(client({ data: [{ nom: "a", ok: "oui" }], error: null }))).toEqual({ erreur: "La suite « tests_sql » a renvoyé une réponse illisible." });
    expect(await lancerTestsSql(client({ data: { nom: "a" }, error: null }))).toHaveProperty("erreur");
  });
});

describe("interrogerSuiteSql (navigateur)", () => {
  function repondre(statut: number, corps: unknown, type = "application/json") {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(typeof corps === "string" ? corps : JSON.stringify(corps), { status: statut, headers: { "content-type": type } })));
  }

  it("rend le verdict de la route", async () => {
    repondre(200, { ok: true, checks: [{ nom: "a", ok: true, detail: "d" }] });
    expect(await interrogerSuiteSql()).toEqual({ ok: true, checks: [{ nom: "a", ok: true, detail: "d" }] });
    expect(fetch).toHaveBeenCalledWith("/admin/tests/sql", expect.objectContaining({ cache: "no-store" }));
    vi.unstubAllGlobals();
  });

  it("lève la raison renvoyée par la route quand la suite ne tourne pas", async () => {
    repondre(500, { error: "La suite « tests_sql » n'a pas pu s'exécuter : fonction absente" });
    await expect(interrogerSuiteSql()).rejects.toThrow("fonction absente");
    vi.unstubAllGlobals();
  });

  it("une page HTML (session expirée, renvoi vers la connexion) est une erreur, pas un verdict", async () => {
    repondre(200, "<!doctype html><title>Connexion</title>", "text/html; charset=utf-8");
    await expect(interrogerSuiteSql()).rejects.toThrow("session a peut-être expiré");
    vi.unstubAllGlobals();
  });
});
