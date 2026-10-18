import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientAudit, erreurStockage } from "./audit-rls-serveur";

describe("erreurStockage", () => {
  it("un refus de la policy Storage devient STORAGE-403 (refus reconnu par l'audit)", () => {
    expect(erreurStockage({ message: "new row violates row-level security policy", status: 400, statusCode: "403" })).toEqual({
      code: "STORAGE-403",
      message: "new row violates row-level security policy",
    });
    expect(erreurStockage({ message: "Unauthorized", status: 401 })?.code).toBe("STORAGE-403");
    expect(erreurStockage({ message: "new row violates row-level security policy for table objects" })?.code).toBe("STORAGE-403");
  });

  it("toute autre erreur reste inattendue (réseau, fichier déjà présent, bucket introuvable)", () => {
    expect(erreurStockage({ message: "The resource already exists", status: 400, statusCode: "409" })).toEqual({ code: "409", message: "The resource already exists" });
    expect(erreurStockage({ message: "fetch failed" })).toEqual({ code: undefined, message: "fetch failed" });
    expect(erreurStockage(null)).toBeNull();
  });
});

describe("clientAudit — stockage", () => {
  function faux(reponses: { upload?: unknown; list?: unknown }) {
    const appels: unknown[][] = [];
    const bucket = {
      upload: vi.fn(async (...a: unknown[]) => {
        appels.push(["upload", ...a]);
        return reponses.upload;
      }),
      list: vi.fn(async (...a: unknown[]) => {
        appels.push(["list", ...a]);
        return reponses.list;
      }),
    };
    const supabase = { storage: { from: vi.fn(() => bucket) } } as unknown as SupabaseClient;
    return { client: clientAudit(supabase), appels, supabase };
  }

  it("envoie sans jamais écraser, et renvoie le chemin d'un envoi accepté (pour l'effacer)", async () => {
    const { client, appels } = faux({ upload: { data: { path: "galeries/x.png" }, error: null } });
    const octets = new Uint8Array([1, 2, 3]);
    expect(await client.upload("medias", "galeries/x.png", octets, "image/png")).toEqual({ erreur: null, id: "galeries/x.png" });
    expect(appels[0]).toEqual(["upload", "galeries/x.png", octets, { contentType: "image/png", upsert: false }]);
  });

  it("ne remonte que le nombre d'éléments listés, jamais leurs noms", async () => {
    const { client } = faux({ list: { data: [{ name: "galeries" }, { name: "secret.jpg" }], error: null } });
    expect(await client.list("medias")).toEqual({ erreur: null, lignes: 2 });
  });

  it("traduit un refus de Storage", async () => {
    const { client } = faux({ upload: { data: null, error: { message: "new row violates row-level security policy", status: 400, statusCode: "403" } } });
    expect((await client.upload("medias", "a.png", new Uint8Array(), "image/png")).erreur?.code).toBe("STORAGE-403");
  });
});
