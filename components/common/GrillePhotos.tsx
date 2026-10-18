import type { CleImage } from "@/lib/images";
import type { PhotoAffichee } from "@/lib/photos/types";
import { Photo } from "@/components/ui/Photo";

/** Colonnes sur grand écran selon le nombre de photos (classes statiques pour Tailwind). */
const COLONNES: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

type Props =
  /** Images du registre (pages Mariages, Événementiel). */
  | { cles: readonly CleImage[]; photos?: never }
  /** Photos d'une galerie gérée dans le back office (pages d'animations). */
  | { photos: readonly PhotoAffichee[]; cles?: never };

/**
 * Galerie de 2 à 6 photos en grille, cellules de hauteur fixe (recadrage `object-cover`).
 * La première photo s'élargit quand il le faut pour que la grille tombe juste
 * (2 colonnes sur mobile, jusqu'à 4 sur grand écran).
 */
export function GrillePhotos({ cles, photos }: Props) {
  const elements = photos
    ? photos.map((photo) => ({ cle: photo.src, props: { photo } }))
    : cles.map((cle) => ({ cle: cle as string, props: { cle } }));
  const n = elements.length;
  const colonnes = COLONNES[n] ?? "lg:grid-cols-3";
  const premiere = n === 5 ? "col-span-2" : n % 2 === 1 ? "col-span-2 lg:col-span-1" : "";
  return (
    <ul className={`grid auto-rows-[15rem] grid-cols-2 gap-4 md:auto-rows-[19rem] ${colonnes}`}>
      {elements.map((e, i) => (
        <li key={e.cle} className={`relative overflow-hidden ${i === 0 ? premiere : ""}`}>
          <Photo {...e.props} remplir sizes="(min-width: 1024px) 33vw, 50vw" />
        </li>
      ))}
    </ul>
  );
}
