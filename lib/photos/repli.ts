import { createHash } from "node:crypto";
import { OPTIONS } from "@/contenu/options";
import { PHOTOS_EVENEMENTS, PHOTOS_MARIAGES } from "@/contenu/pages/galerie";
import { contenuOption } from "@/contenu/pages/options";
import { IMAGES, type CleImage } from "@/lib/images";
import { galerieOption } from "./constantes";
import type { Liaison, LigneGalerie, Photo } from "./types";

/**
 * Données de secours : les galeries d'avant le back office (listes du code),
 * au format des tables `photos` et `galeries_photos`, À L'IDENTIQUE de
 * l'import en base (migration 0007, générée à partir d'ici et vérifiée par
 * import-sql.test.ts). Servent quand Supabase n'est pas configuré — voir
 * `source.ts`. Retirées à l'étape 7 du plan.
 */

/** Les galeries du code, dans l'ordre d'affichage actuel. */
export const GALERIES_REPLI: Readonly<Record<string, readonly CleImage[]>> = {
  galerie_mariages: PHOTOS_MARIAGES,
  galerie_evenements: PHOTOS_EVENEMENTS,
  ...Object.fromEntries(OPTIONS.map((o) => [galerieOption(o.slug.fr), contenuOption(o).galerie])),
};

/** Espace de noms des identifiants de photos du site (UUID v5, RFC 9562). */
const ESPACE_PHOTOS_SITE = "5b0e6a4c-3f2d-4b8e-9c1a-7d6e5f4a3b2c";

function octetsUuid(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

/** UUID v5 (SHA-1) d'un nom dans un espace : toujours le même pour le même nom. */
export function uuidV5(nom: string, espace: string = ESPACE_PHOTOS_SITE): string {
  const empreinte = createHash("sha1").update(octetsUuid(espace)).update(nom, "utf8").digest();
  const o = empreinte.subarray(0, 16);
  o[6] = (o[6] & 0x0f) | 0x50; // version 5
  o[8] = (o[8] & 0x3f) | 0x80; // variante RFC
  const h = o.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Identifiant fixe d'une photo du site, dérivé de son chemin : l'import en
 * base et les données de secours portent le même.
 */
export function idPhotoSite(cle: CleImage): string {
  return uuidV5(IMAGES[cle].src);
}

/** Pas entre deux rangs (10, 20, 30…) : laisse la place d'insérer sans tout renuméroter. */
export const PAS_ORDRE = 10;

function photoDuSite(cle: CleImage): Photo {
  const i = IMAGES[cle];
  return {
    id: idPhotoSite(cle),
    origine: "site",
    chemin: i.src,
    largeur: i.width,
    hauteur: i.height,
    alt_fr: i.alt.fr,
    alt_en: i.alt.en,
    credit: null,
  };
}

/** Les photos utilisées par les galeries, chacune une fois, dans l'ordre de première apparition. */
export function photosDeRepli(): Photo[] {
  const cles = [...new Set(Object.values(GALERIES_REPLI).flat())];
  return cles.map(photoDuSite);
}

/** Les liaisons galerie → photo, rang 10, 20, 30… dans chaque galerie. */
export function liaisonsDeRepli(): Liaison[] {
  return Object.entries(GALERIES_REPLI).flatMap(([galerie, cles]) =>
    cles.map((cle, i) => ({ galerie, photo_id: idPhotoSite(cle), ordre: (i + 1) * PAS_ORDRE })),
  );
}

/** Les galeries au format de la lecture publique (liaison + photo). */
export function lignesDeRepli(): LigneGalerie[] {
  const parId = new Map(photosDeRepli().map((p) => [p.id, p]));
  return liaisonsDeRepli().map((l) => ({ ...l, photo: parId.get(l.photo_id)! }));
}
