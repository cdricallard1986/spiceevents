import { beforeEach, describe, expect, it, vi } from "vitest";

// Module serveur : on remplace le cache de Next et le client Supabase.
const cache = vi.hoisted(() => ({ options: null as unknown }));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown, _cles: string[], options: unknown) => {
    cache.options = options;
    return fn;
  },
}));
const requete = vi.hoisted(() => ({ reponse: { data: [] as unknown[] | null, error: null as { message: string } | null }, appels: [] as string[] }));
vi.mock("@/lib/supabase/public", () => ({
  clientPublic: () => {
    const chaine = {
      from: (table: string) => {
        requete.appels.push(`from:${table}`);
        return chaine;
      },
      select: () => chaine,
      eq: (colonne: string, valeur: unknown) => {
        requete.appels.push(`eq:${colonne}=${String(valeur)}`);
        return chaine;
      },
      order: () => chaine,
      then: (ok: (r: unknown) => unknown, ko: (e: unknown) => unknown) => Promise.resolve(requete.reponse).then(ok, ko),
    };
    return chaine;
  },
}));

const { avisPublies, ETIQUETTE_AVIS, REVALIDATION_AVIS } = await import("./lecture");

beforeEach(() => {
  requete.appels = [];
  requete.reponse = { data: [], error: null };
});

describe("lecture des avis publiés", () => {
  it("mise en cache sous l'étiquette « avis », régénérée au plus tard toutes les heures", () => {
    expect(cache.options).toEqual({ tags: [ETIQUETTE_AVIS], revalidate: REVALIDATION_AVIS });
    expect(ETIQUETTE_AVIS).toBe("avis");
    expect(REVALIDATION_AVIS).toBe(3600);
  });

  it("sans Supabase dans l'environnement : les fichiers de secours, sans aucune requête", async () => {
    const liste = await avisPublies({});
    expect(liste).toHaveLength(43);
    expect(requete.appels).toEqual([]);
  });

  it("avec Supabase : les seuls avis publiés de la base", async () => {
    requete.reponse = { data: [{ id: "1", auteurs: "Pierre & Nina" }], error: null };
    const liste = await avisPublies({ NEXT_PUBLIC_SUPABASE_URL: "https://projet.supabase.co" });
    expect(liste).toEqual([{ id: "1", auteurs: "Pierre & Nina" }]);
    expect(requete.appels).toEqual(["from:avis", "eq:publie=true"]);
  });

  it("une erreur de Supabase est levée (la génération échoue), jamais remplacée par les fichiers", async () => {
    requete.reponse = { data: null, error: { message: "fetch failed" } };
    await expect(avisPublies({ VERCEL: "1" })).rejects.toThrow("Lecture des avis impossible dans Supabase : fetch failed");
  });
});
