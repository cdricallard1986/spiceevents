import { OPTIONS } from "@/contenu/options";
import { PHOTOS_EVENEMENTS, PHOTOS_MARIAGES } from "@/contenu/pages/galerie";
import { IMAGES_ACCUEIL } from "@/contenu/pages/accueil";
import { IMAGES_ENTETE_EVENEMENTIEL } from "@/contenu/pages/evenementiel";
import { IMAGES_ACCUEIL_MARIAGES } from "@/contenu/pages/mariages";
import { contenuOption } from "@/contenu/pages/options";
import { IMAGES_ENTETE_SON_LUMIERE } from "@/contenu/pages/son-et-lumiere";
import { IMAGES, type CleImage } from "@/lib/images";
import { uuidV5 as uuidV5Brut } from "@/lib/uuid";
import { galerieEntete, galerieOption, type PageEntete } from "./constantes";
import type { Liaison, LigneGalerie, Photo } from "./types";

/**
 * Données de secours : les galeries d'avant le back office (listes du code),
 * au format des tables `photos` et `galeries_photos`, À L'IDENTIQUE de
 * l'import en base (migration 0007, générée à partir d'ici et vérifiée par
 * import-sql.test.ts). Servent quand Supabase n'est pas configuré — voir
 * `source.ts`. Retirées à l'étape 7 du plan.
 */

/**
 * Galeries d'options retirées du site (novembre 2026 : murs d'eau & végétaux). Elles
 * restent en base (import 0007), sans page pour les afficher : les données de
 * secours les gardent, à leur place d'alors (après l'option `apres`).
 */
export const GALERIES_RETIREES: readonly { apres: string; galerie: string; photos: readonly CleImage[] }[] = [
  {
    apres: "guirlandes-lumineuses",
    galerie: "option:murs-d-eau-et-vegetaux",
    photos: [
      "presta-mur-eau-colonnes",
      "presta-mur-vegetal-neon",
      "presta-mur-eau-nom",
      "presta-mur-vegetal-escalier",
      "presta-mur-eau-vegetal",
      "presta-mur-vegetal-salle",
    ],
  },
];

/** Les galeries des options, dans l'ordre des options, avec les galeries retirées à leur place. */
function galeriesOptions(): [string, readonly CleImage[]][] {
  return OPTIONS.flatMap((o): [string, readonly CleImage[]][] => [
    [galerieOption(o.slug.fr), contenuOption(o).galerie],
    ...GALERIES_RETIREES.filter((r) => r.apres === o.slug.fr).map((r): [string, readonly CleImage[]] => [r.galerie, r.photos]),
  ]);
}

/** Les galeries du code, dans l'ordre d'affichage actuel. */
export const GALERIES_REPLI: Readonly<Record<string, readonly CleImage[]>> = {
  galerie_mariages: PHOTOS_MARIAGES,
  galerie_evenements: PHOTOS_EVENEMENTS,
  ...Object.fromEntries(galeriesOptions()),
};

/** Espace de noms des identifiants de photos du site (UUID v5, RFC 9562). */
const ESPACE_PHOTOS_SITE = "5b0e6a4c-3f2d-4b8e-9c1a-7d6e5f4a3b2c";

/** UUID v5 d'un nom, par défaut dans l'espace des photos du site (voir lib/uuid.ts). */
export function uuidV5(nom: string, espace: string = ESPACE_PHOTOS_SITE): string {
  return uuidV5Brut(nom, espace);
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

/**
 * Diaporamas d'en-tête des pages (novembre 2026), tels que le code les
 * affichait avant de passer en base : import de la migration 0011, générée à
 * partir d'ici et vérifiée par import-entetes.test.ts.
 */
export const ENTETES_REPLI: Readonly<Record<PageEntete, readonly CleImage[]>> = {
  accueil: IMAGES_ACCUEIL,
  mariages: IMAGES_ACCUEIL_MARIAGES,
  evenementiel: IMAGES_ENTETE_EVENEMENTIEL,
  "son-et-lumiere": IMAGES_ENTETE_SON_LUMIERE,
};

/** Photos des en-têtes, chacune une fois (y compris celles déjà importées par 0007 : la base les ignore). */
export function photosEntetesDeRepli(): Photo[] {
  return [...new Set(Object.values(ENTETES_REPLI).flat())].map(photoDuSite);
}

/** Liaisons `entete:<page>` → photo, rang 10, 20, 30… */
export function liaisonsEntetesDeRepli(): Liaison[] {
  return (Object.entries(ENTETES_REPLI) as [PageEntete, readonly CleImage[]][]).flatMap(([page, cles]) =>
    cles.map((cle, i) => ({ galerie: galerieEntete(page), photo_id: idPhotoSite(cle), ordre: (i + 1) * PAS_ORDRE })),
  );
}

/** Les galeries et les en-têtes au format de la lecture publique (liaison + photo). */
export function lignesDeRepli(): LigneGalerie[] {
  const parId = new Map([...photosDeRepli(), ...photosEntetesDeRepli()].map((p) => [p.id, p]));
  return [...liaisonsDeRepli(), ...liaisonsEntetesDeRepli()].map((l) => ({ ...l, photo: parId.get(l.photo_id)! }));
}
