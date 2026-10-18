"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useLocale } from "next-intl";
import type { PhotoAffichee } from "@/lib/photos/types";
import { Photo } from "@/components/ui/Photo";

/** Photos d'une galerie gérée dans le back office (fichiers du site ou du bucket), déjà dans la langue de la page. */
type Props = { photos: readonly PhotoAffichee[] };

/** Largeur d'une colonne : 3 colonnes dans le conteneur (82rem moins les marges) sur grand écran. */
const TAILLES = "(min-width: 1312px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw";

/**
 * Mosaïque de photos en colonnes. Chaque photo s'agrandit dans une fenêtre
 * (`<dialog>` natif : Échap ferme, le focus revient sur la vignette) ;
 * flèches gauche/droite pour passer d'une photo à l'autre. Sans JavaScript,
 * la mosaïque reste lisible.
 */
export function Mosaique({ photos }: Props) {
  const fr = useLocale() === "fr";
  const fenetre = useRef<HTMLDialogElement>(null);
  const [courante, setCourante] = useState<number | null>(null);

  // Ouverture après le rendu du contenu, pour que le bouton « Fermer » reçoive le focus.
  useEffect(() => {
    if (courante !== null && fenetre.current && !fenetre.current.open) fenetre.current.showModal();
  }, [courante]);

  function ouvrir(i: number) {
    setCourante(i);
  }
  function fermer() {
    fenetre.current?.close();
  }
  function decaler(pas: number) {
    setCourante((i) => (i === null ? i : (i + pas + photos.length) % photos.length));
  }
  function surTouche(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "ArrowRight") decaler(1);
    if (e.key === "ArrowLeft") decaler(-1);
  }
  // Un clic sur le fond (le dialog lui-même, hors de son contenu) ferme la fenêtre.
  function surClic(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) fermer();
  }

  const grande = courante === null ? null : photos[courante];
  const bouton =
    "border border-ivoire/40 bg-nuit/70 px-4 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-ivoire transition-colors hover:border-or hover:text-or";

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, i) => (
          <li key={photo.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => ouvrir(i)}
              className="group block w-full overflow-hidden"
              aria-label={`${fr ? "Agrandir" : "Enlarge"} : ${photo.alt}`}
            >
              <Photo
                photo={photo}
                sizes={TAILLES}
                className="h-auto w-full transition-transform duration-700 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={fenetre}
        onKeyDown={surTouche}
        onClick={surClic}
        onClose={() => setCourante(null)}
        aria-label={grande?.alt}
        className="m-auto max-h-none max-w-none bg-transparent p-0 text-ivoire backdrop:bg-nuit/95"
      >
        {grande && (
          <figure className="flex flex-col items-center gap-4 p-4">
            <Image
              src={grande.src}
              alt={grande.alt}
              width={grande.width}
              height={grande.height}
              sizes="100vw"
              quality={75}
              className="h-auto max-h-[80svh] w-auto max-w-[92vw] object-contain"
            />
            <figcaption className="max-w-2xl text-center text-sm text-sable">{grande.alt}</figcaption>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => decaler(-1)} className={bouton}>
                ← {fr ? "Précédente" : "Previous"}
              </button>
              <button type="button" onClick={fermer} className={bouton} autoFocus>
                {fr ? "Fermer" : "Close"}
              </button>
              <button type="button" onClick={() => decaler(1)} className={bouton}>
                {fr ? "Suivante" : "Next"} →
              </button>
            </div>
          </figure>
        )}
      </dialog>
    </>
  );
}
