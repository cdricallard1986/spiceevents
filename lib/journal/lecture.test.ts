import { beforeEach, describe, expect, it, vi } from "vitest";
import { sourceArticles } from "./source";

/**
 * Lecture publique des articles : source base ou fichiers de secours (même
 * règle que les avis), cache étiqueté « articles » rafraîchi toutes les
 * heures, et une erreur de Supabase qui fait échouer la génération (jamais de
 * repli silencieux). En mode secours : les 37 articles MDX convertis.
 */

const etat = vi.hoisted(() => ({
  reponse: { data: [] as unknown[] | null, error: null as { message: string } | null },
  requetes: [] as [string, unknown[]][],
  cache: [] as { cles: unknown; options: unknown }[],
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown, cles: unknown, options: unknown) => {
    etat.cache.push({ cles, options });
    return fn;
  },
}));

vi.mock("@/lib/supabase/public", () => ({
  clientPublic: () => {
    const chaine: Record<string, unknown> = new Proxy(
      {},
      {
        get(_c, nom: string) {
          if (nom === "then") return (ok: (r: unknown) => unknown) => Promise.resolve(etat.reponse).then(ok);
          return (...args: unknown[]) => {
            etat.requetes.push([nom, args]);
            return chaine;
          };
        },
      },
    );
    return chaine;
  },
}));

const { articleParSlug, articlesPublies, ETIQUETTE_ARTICLES, REVALIDATION_ARTICLES } = await import("./lecture");

const BASE = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" };
const FICHIERS = {};

const ligne = (slug: string, champs: Record<string, unknown> = {}) => ({
  id: `id-${slug}`,
  statut: "publie",
  publie_le: "2026-10-01T10:00:00+00:00",
  slug,
  titre: `Titre ${slug}`,
  sous_titre: null,
  description: `Description ${slug}`,
  categorie: "Technique",
  date_publication: "2026-10-01",
  couverture: `journal/2026/10/${slug}.jpg`,
  couverture_alt: `Couverture ${slug}`,
  contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour" }] }] },
  ...champs,
});

beforeEach(() => {
  etat.requetes = [];
  etat.reponse = { data: [], error: null };
});

describe("sourceArticles", () => {
  it("base dès que Supabase est configuré, toujours sur Vercel ; sinon les fichiers", () => {
    expect(sourceArticles(BASE)).toBe("base");
    expect(sourceArticles({ VERCEL: "1" })).toBe("base");
    expect(sourceArticles({})).toBe("fichiers");
  });
});

describe("articlesPublies — secours (sans Supabase)", () => {
  it("rend les 37 articles MDX convertis, du plus récent au plus ancien, sans aucune requête", async () => {
    const liste = await articlesPublies(FICHIERS);
    expect(liste).toHaveLength(37);
    expect(etat.requetes).toEqual([]);
    const dates = liste.map((a) => a.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(liste.every((a) => a.contenu.type === "doc" && a.lecture >= 1)).toBe(true);
  });

  it("trouve un article par son adresse ; une adresse inconnue → undefined (404)", async () => {
    expect((await articleParSlug("livre-d-or-audio", FICHIERS))?.titre).toMatch(/livre d’or audio/i);
    expect(await articleParSlug("inconnu", FICHIERS)).toBeUndefined();
  });
});

describe("articlesPublies — base", () => {
  it("lit les seuls articles publiés de Supabase, met en cache sous l'étiquette « articles » (filet d'une heure)", async () => {
    await articlesPublies(BASE);
    expect(etat.requetes[0]).toEqual(["from", ["articles"]]);
    expect(etat.requetes[1][0]).toBe("select");
    expect(String(etat.requetes[1][1][0])).toContain("contenu");
    expect(etat.requetes).toContainEqual(["eq", ["statut", "publie"]]);
    expect(etat.cache).toContainEqual({ cles: ["articles-publies"], options: { tags: [ETIQUETTE_ARTICLES], revalidate: REVALIDATION_ARTICLES } });
    expect(ETIQUETTE_ARTICLES).toBe("articles");
    expect(REVALIDATION_ARTICLES).toBe(3600);
  });

  it("sur Vercel, la base est lue même sans NEXT_PUBLIC_SUPABASE_URL", async () => {
    await articlesPublies({ VERCEL: "1" });
    expect(etat.requetes.length).toBeGreaterThan(0);
  });

  it("met en forme les lignes, trie par date et écarte un brouillon renvoyé par erreur", async () => {
    etat.reponse = {
      data: [ligne("ancien", { date_publication: "2025-01-01" }), ligne("brouillon", { statut: "brouillon" }), ligne("recent", { sous_titre: "Sous-titre" })],
      error: null,
    };
    const liste = await articlesPublies(BASE);
    expect(liste.map((a) => a.slug)).toEqual(["recent", "ancien"]);
    expect(liste[0]).toMatchObject({ sousTitre: "Sous-titre", couverture: "journal/2026/10/recent.jpg", date: "2026-10-01", lecture: 1 });
    expect(await articleParSlug("brouillon", BASE)).toBeUndefined();
  });

  it("une erreur de Supabase fait échouer la génération (pas de repli silencieux)", async () => {
    etat.reponse = { data: null, error: { message: "délai dépassé" } };
    await expect(articlesPublies(BASE)).rejects.toThrow("Lecture des articles impossible dans Supabase : délai dépassé");
  });

  it("un article publié au contenu invalide fait échouer la génération, en le nommant", async () => {
    etat.reponse = { data: [ligne("piege", { contenu: { type: "doc", content: [{ type: "script", text: "alert(1)" }] } })], error: null };
    await expect(articlesPublies(BASE)).rejects.toThrow(/« piege » : Contenu invalide/);
  });
});
