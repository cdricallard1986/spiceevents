import { z } from "zod";
import { TYPES_IMAGE, type TypeImage } from "@/lib/photos/envoi";
import type { ErreursArticle } from "./schema";

/**
 * Validation propre aux Server Actions du journal (en plus de
 * `validerChampsArticle`, `validerDocument` et `schemaIdArticle`).
 */

/** « L'adresse suit le titre » : envoyé avec les champs ; tout ce qui n'est pas `true` vaut non. */
const schemaSlugAuto = z.object({ slugAuto: z.literal(true) });

export function lireSlugAuto(champs: unknown): boolean {
  return schemaSlugAuto.safeParse(champs).success;
}

/** Type MIME d'une photo d'après l'extension de son chemin dans le bucket (copie d'une photo de la photothèque). */
export function typeDepuisChemin(chemin: string): TypeImage | null {
  const ext = chemin.match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "jpeg") return "image/jpeg";
  const trouve = (Object.entries(TYPES_IMAGE) as [TypeImage, string][]).find(([, e]) => e === ext);
  return trouve ? trouve[0] : null;
}

/** Ce qui manque pour publier, en une phrase : « Pour publier, il manque : le titre, la description. » */
export const LIBELLES_MANQUES: Partial<Record<keyof ErreursArticle, string>> = {
  slug: "l'adresse",
  titre: "le titre",
  description: "la description (résultat Google)",
  categorie: "la catégorie",
  date_publication: "la date",
  couverture: "la photo de couverture",
  couverture_alt: "le texte alternatif de la couverture",
};

export function messageManques(erreurs: ErreursArticle): string {
  // Dans l'ordre de la fiche, quel que soit l'ordre de détection.
  const ordre = Object.keys(LIBELLES_MANQUES) as (keyof ErreursArticle)[];
  const champs = (Object.keys(erreurs) as (keyof ErreursArticle)[]).sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b));
  const liste = champs.map((c) => LIBELLES_MANQUES[c] ?? c);
  return `Pour publier, il manque : ${liste.join(", ")}.`;
}
