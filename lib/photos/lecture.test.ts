import { beforeEach, describe, expect, it, vi } from "vitest";
import { IMAGES } from "@/lib/images";
import { PHOTOS_EVENEMENTS, PHOTOS_MARIAGES } from "@/contenu/pages/galerie";
import { CONTENUS_OPTIONS } from "@/contenu/pages/options";
import { image } from "@/lib/images";

/**
 * Lecture publique des galeries : source base ou listes de secours (même règle
 * que les avis), cache étiqueté « galeries » rafraîchi toutes les heures, et
 * une erreur de Supabase qui fait échouer la génération (jamais de repli
 * silencieux). En mode secours : exactement les photos d'avant.
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

const { photosDeGalerie, ETIQUETTE_GALERIES, REVALIDATION_GALERIES } = await import("./lecture");

const BASE = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" };
const FICHIERS = {};

beforeEach(() => {
  etat.requetes = [];
  etat.reponse = { data: [], error: null };
});

describe("photosDeGalerie — secours (sans Supabase)", () => {
  it("rend les photos de la page Galerie exactement comme avant : mêmes fichiers, tailles et textes, dans l'ordre", async () => {
    for (const locale of ["fr", "en"] as const) {
      expect(await photosDeGalerie("galerie_mariages", locale, FICHIERS)).toEqual(PHOTOS_MARIAGES.map((c) => image(c, locale)));
      expect(await photosDeGalerie("galerie_evenements", locale, FICHIERS)).toEqual(PHOTOS_EVENEMENTS.map((c) => image(c, locale)));
    }
    expect(etat.requetes).toEqual([]);
  });

  it("rend les galeries des pages d'animations comme avant (vide pour le photobooth)", async () => {
    for (const [slug, c] of Object.entries(CONTENUS_OPTIONS)) {
      expect(await photosDeGalerie(`option:${slug}`, "en", FICHIERS), slug).toEqual(c.galerie.map((cle) => image(cle, "en")));
    }
    expect(await photosDeGalerie("option:photobooth", "fr", FICHIERS)).toEqual([]);
    expect(await photosDeGalerie("option:inconnue", "fr", FICHIERS)).toEqual([]);
  });
});

describe("photosDeGalerie — base", () => {
  const photo = (id: string, champs: Record<string, unknown> = {}) => ({
    id,
    origine: "stockage",
    chemin: `galeries/2026/10/${id}.jpg`,
    largeur: 1200,
    hauteur: 800,
    alt_fr: `Photo ${id}`,
    alt_en: null,
    credit: null,
    ...champs,
  });

  it("lit Supabase en une requête, met en cache sous l'étiquette « galeries » (filet d'une heure)", async () => {
    etat.reponse = { data: [], error: null };
    await photosDeGalerie("galerie_mariages", "fr", BASE);
    expect(etat.requetes[0]).toEqual(["from", ["galeries_photos"]]);
    expect(etat.requetes[1][0]).toBe("select");
    expect(String(etat.requetes[1][1][0])).toContain("photo:photos!inner(");
    expect(etat.cache).toContainEqual({ cles: ["galeries-photos"], options: { tags: [ETIQUETTE_GALERIES], revalidate: REVALIDATION_GALERIES } });
    expect(ETIQUETTE_GALERIES).toBe("galeries");
    expect(REVALIDATION_GALERIES).toBe(3600);
  });

  it("sur Vercel, la base est lue même sans NEXT_PUBLIC_SUPABASE_URL", async () => {
    await photosDeGalerie("galerie_mariages", "fr", { VERCEL: "1" });
    expect(etat.requetes.length).toBeGreaterThan(0);
  });

  it("garde la galerie demandée, dans l'ordre, et donne l'adresse publique des photos du bucket", async () => {
    etat.reponse = {
      data: [
        { galerie: "galerie_mariages", photo_id: "b", ordre: 20, photo: photo("b", { alt_en: "Photo b (en)" }) },
        { galerie: "galerie_mariages", photo_id: "a", ordre: 10, photo: photo("a", { origine: "site", chemin: "/images/hero-premiere-danse.jpg" }) },
        { galerie: "galerie_evenements", photo_id: "c", ordre: 10, photo: photo("c") },
      ],
      error: null,
    };
    expect(await photosDeGalerie("galerie_mariages", "en", BASE)).toEqual([
      { src: "/images/hero-premiere-danse.jpg", width: 1200, height: 800, alt: "Photo a" },
      { src: "https://tyghpfqyppiughrknuit.supabase.co/storage/v1/object/public/medias/galeries/2026/10/b.jpg", width: 1200, height: 800, alt: "Photo b (en)" },
    ]);
  });

  it("une erreur de Supabase fait échouer la génération (pas de repli silencieux)", async () => {
    etat.reponse = { data: null, error: { message: "délai dépassé" } };
    await expect(photosDeGalerie("galerie_mariages", "fr", BASE)).rejects.toThrow("Lecture des galeries impossible dans Supabase : délai dépassé");
  });
});

describe("registre", () => {
  it("chaque photo des galeries est un fichier du site au format attendu par la base", () => {
    for (const c of [...PHOTOS_MARIAGES, ...PHOTOS_EVENEMENTS]) expect(IMAGES[c].src).toMatch(/^\/images\/[a-z0-9-]+\.jpg$/);
  });
});
