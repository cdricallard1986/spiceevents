import type { CleImage } from "@/lib/images";
import { Photo } from "@/components/ui/Photo";

/** Colonnes sur grand écran selon le nombre de photos (classes statiques pour Tailwind). */
const COLONNES: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * Galerie de 2 à 6 photos en grille, cellules de hauteur fixe (recadrage `object-cover`).
 * La première photo s'élargit quand il le faut pour que la grille tombe juste
 * (2 colonnes sur mobile, jusqu'à 4 sur grand écran).
 */
export function GrillePhotos({ cles }: { cles: readonly CleImage[] }) {
  const n = cles.length;
  const colonnes = COLONNES[n] ?? "lg:grid-cols-3";
  const premiere = n === 5 ? "col-span-2" : n % 2 === 1 ? "col-span-2 lg:col-span-1" : "";
  return (
    <ul className={`grid auto-rows-[15rem] grid-cols-2 gap-4 md:auto-rows-[19rem] ${colonnes}`}>
      {cles.map((cle, i) => (
        <li key={cle} className={`relative overflow-hidden ${i === 0 ? premiere : ""}`}>
          <Photo cle={cle} remplir sizes="(min-width: 1024px) 33vw, 50vw" />
        </li>
      ))}
    </ul>
  );
}
