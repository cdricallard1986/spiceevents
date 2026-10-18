import Image from "next/image";
import { adressePhoto } from "@/lib/photos/selection";
import type { Photo } from "@/lib/photos/types";

export const CLASSES_PASTILLE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs tracking-[0.02em]";

/**
 * Vignette d'une photo du back office (fichier du site ou du bucket `medias`),
 * recadrée dans son cadre : le parent fixe la taille (`relative` + dimensions).
 * Texte alternatif vide : la vignette accompagne toujours son texte, qu'un
 * lecteur d'écran lirait deux fois.
 */
export function ApercuPhoto({ photo, sizes = "160px", className = "" }: { photo: Pick<Photo, "origine" | "chemin">; sizes?: string; className?: string }) {
  return <Image src={adressePhoto(photo)} alt="" fill sizes={sizes} quality={70} className={`object-cover ${className}`} />;
}

/** Pastille de l'origine : fichier du site (non supprimable) ou photo envoyée. */
export function PillOrigine({ photo }: { photo: Pick<Photo, "origine"> }) {
  return photo.origine === "site" ? (
    <span className={`${CLASSES_PASTILLE} border-ligne text-sable`}>Fichier du site</span>
  ) : (
    <span className={`${CLASSES_PASTILLE} border-or/50 text-or`}>Envoyée</span>
  );
}
