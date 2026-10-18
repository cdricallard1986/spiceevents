import { describe, expect, it } from "vitest";
import { GALERIES, galerieOption, libelleGalerie, estGalerieConnue, urlPublique } from "./constantes";
import { altEnLangue, galerieEnLangue, photosDeLaGalerie } from "./selection";
import { idPhotoSite, liaisonsDeRepli, photosDeRepli, uuidV5 } from "./repli";
import { sourcePhotos } from "./source";
import type { Photo } from "./types";

const photo = (id: string, champs: Partial<Photo> = {}): Photo => ({
  id,
  origine: "stockage",
  chemin: `galeries/${id}.jpg`,
  largeur: 10,
  hauteur: 10,
  alt_fr: `Photo ${id}`,
  alt_en: null,
  credit: null,
  ...champs,
});

describe("source des galeries", () => {
  it("même règle que les avis : la base dès que Supabase est configuré, toujours sur Vercel", () => {
    expect(sourcePhotos({})).toBe("fichiers");
    expect(sourcePhotos({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBe("base");
    expect(sourcePhotos({ VERCEL: "1" })).toBe("base");
  });
});

describe("galeries", () => {
  it("propose les deux galeries de la page Galerie, puis une par animation", () => {
    expect(GALERIES.slice(0, 2).map((g) => g.libelle)).toEqual(["Galerie — Mariages", "Galerie — Événements"]);
    expect(GALERIES).toHaveLength(10);
    expect(GALERIES.slice(2).every((g) => g.option && g.valeur.startsWith("option:"))).toBe(true);
    expect(libelleGalerie(galerieOption("bar-a-vinyles"))).toBe("Page Bar à vinyles");
    expect(libelleGalerie("option:retiree")).toBe("option:retiree (galerie inconnue)");
    expect(estGalerieConnue("galerie_mariages")).toBe(true);
    expect(estGalerieConnue("accueil")).toBe(false);
  });

  it("chaque galerie respecte le CHECK de la table", () => {
    for (const g of GALERIES) expect(g.valeur).toMatch(/^(galerie_mariages|galerie_evenements|option:[a-z0-9-]+)$/);
  });

  it("donne l'adresse publique du bucket medias, ouverte à next/image dans next.config.ts", async () => {
    expect(urlPublique("galeries/2026/10/a.jpg", "https://abc.supabase.co/")).toBe("https://abc.supabase.co/storage/v1/object/public/medias/galeries/2026/10/a.jpg");
    const { readFileSync } = await import("node:fs");
    const config = readFileSync(`${process.cwd()}/next.config.ts`, "utf8");
    const url = new URL(urlPublique("galeries/x.jpg"));
    expect(config).toContain(`hostname: "${url.hostname}"`);
    expect(config).toContain(`pathname: "/storage/v1/object/public/medias/**"`);
  });
});

describe("mise en forme", () => {
  it("texte alternatif anglais, à défaut le français", () => {
    expect(altEnLangue({ alt_fr: "Piste", alt_en: null }, "en")).toBe("Piste");
    expect(altEnLangue({ alt_fr: "Piste", alt_en: "Dance floor" }, "en")).toBe("Dance floor");
    expect(altEnLangue({ alt_fr: "Piste", alt_en: "Dance floor" }, "fr")).toBe("Piste");
  });

  it("trie par rang puis identifiant, et ignore les liaisons sans photo", () => {
    const photos = [photo("a"), photo("b"), photo("c")];
    const liaisons = [
      { galerie: "g", photo_id: "c", ordre: 10 },
      { galerie: "g", photo_id: "a", ordre: 20 },
      { galerie: "g", photo_id: "b", ordre: 10 },
      { galerie: "g", photo_id: "disparue", ordre: 5 },
      { galerie: "autre", photo_id: "a", ordre: 1 },
    ];
    expect(photosDeLaGalerie(photos, liaisons, "g").map((p) => p.id)).toEqual(["b", "c", "a"]);
    const lignes = liaisons.filter((l) => l.photo_id !== "disparue").map((l) => ({ ...l, photo: photos.find((p) => p.id === l.photo_id)! }));
    expect(galerieEnLangue(lignes, "g", "fr").map((p) => p.alt)).toEqual(["Photo b", "Photo c", "Photo a"]);
  });
});

describe("données de secours", () => {
  it("identifiants UUID v5 fixes, dérivés du chemin", () => {
    // Vecteur de la RFC 4122 (annexe B, espace DNS) : le calcul est le standard.
    expect(uuidV5("www.example.com", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe("2ed6657d-e927-568b-95e1-2665a8aea6a2");
    expect(idPhotoSite("hero-premiere-danse")).toBe(idPhotoSite("hero-premiere-danse"));
    expect(idPhotoSite("hero-premiere-danse")).not.toBe(idPhotoSite("vinyles"));
  });

  it("une photo partagée par plusieurs galeries n'est enregistrée qu'une fois", () => {
    const photos = photosDeRepli();
    expect(new Set(photos.map((p) => p.chemin)).size).toBe(photos.length);
    const ouverture = liaisonsDeRepli().filter((l) => l.galerie === "option:ouverture-de-bal");
    expect(ouverture.map((l) => l.ordre)).toEqual([10, 20, 30, 40]);
    // « hero-premiere-danse » est dans la galerie Mariages ET sur la page Ouverture de bal : même identifiant.
    const id = idPhotoSite("hero-premiere-danse");
    expect(liaisonsDeRepli().filter((l) => l.photo_id === id).map((l) => l.galerie)).toEqual(["galerie_mariages", "option:ouverture-de-bal"]);
  });
});
