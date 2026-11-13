"use client";

import { useEffect, useRef, useState, type PointerEvent as EvenementPointeur } from "react";
import { createPortal } from "react-dom";

/** Le piment du logo, détouré (public/marque) : ses couleurs sont celles qu’on peut choisir. */
const IMAGE = "/marque/piment-logo.png";
const CLE = "spice:couleur";

/** Remplace l’accent orange du site (variables de la charte) par une autre couleur. */
export function appliquerCouleur(couleur: string | null) {
  const racine = document.documentElement.style;
  if (!couleur) {
    racine.removeProperty("--color-or");
    racine.removeProperty("--color-or-clair");
    return;
  }
  racine.setProperty("--color-or", couleur);
  racine.setProperty("--color-or-clair", `color-mix(in srgb, ${couleur} 75%, white)`);
}

/** Couleur choisie gardée le temps de la visite (onglet). */
export function couleurMemorisee(): string | null {
  try {
    return window.sessionStorage.getItem(CLE);
  } catch {
    return null;
  }
}

function memoriser(couleur: string | null) {
  try {
    if (couleur) window.sessionStorage.setItem(CLE, couleur);
    else window.sessionStorage.removeItem(CLE);
  } catch {
    // Stockage indisponible : la couleur vaut pour la page affichée seulement.
  }
}

type Props = { position: { x: number; y: number }; onFermer: () => void };

/**
 * Petit secret du site : un clic droit sur le logo ouvre ce sélecteur, le piment du
 * logo lui-même. Le pixel choisi devient l’accent de tout le site, immédiatement.
 */
export function SelecteurPiment({ position, onFermer }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const toile = useRef<HTMLCanvasElement | null>(null);
  const [curseur, setCurseur] = useState<{ x: number; y: number } | null>(null);
  const [glisse, setGlisse] = useState(false);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);

  /** Copie de l’image dans un canevas hors écran, pour lire la couleur des pixels. */
  function preparer() {
    const img = image.current;
    if (!img) return;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d", { willReadFrequently: true })?.drawImage(img, 0, 0);
    toile.current = c;
  }

  function choisir(e: EvenementPointeur<HTMLDivElement>) {
    const img = image.current;
    const c = toile.current;
    if (!img || !c) return;
    const r = img.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x >= r.width || y >= r.height) return;
    const [rouge, vert, bleu, alpha] = c
      .getContext("2d")!
      .getImageData(Math.floor((x / r.width) * c.width), Math.floor((y / r.height) * c.height), 1, 1).data;
    if (alpha < 200) return; // hors du piment
    setCurseur({ x, y });
    const couleur = `rgb(${rouge} ${vert} ${bleu})`;
    appliquerCouleur(couleur);
    memoriser(couleur);
  }

  function reinitialiser() {
    setCurseur(null);
    appliquerCouleur(null);
    memoriser(null);
  }

  // Portail : l’en-tête (flou d’arrière-plan) servirait sinon de cadre aux éléments `fixed`.
  return createPortal(
    <>
      <div className="fixed inset-0 z-[70]" onClick={onFermer} onContextMenu={(e) => (e.preventDefault(), onFermer())} />
      <div
        role="dialog"
        aria-label="Choisir la couleur du piment"
        className="fixed z-[71] w-44 border border-ligne bg-nuit-2 p-4 shadow-2xl"
        style={{ left: Math.min(position.x, window.innerWidth - 192), top: position.y + 8 }}
      >
        <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-sable">Pimentez le site</p>
        <div
          className="relative mx-auto w-fit cursor-crosshair touch-none select-none"
          onPointerDown={(e) => {
            setGlisse(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            choisir(e);
          }}
          onPointerMove={(e) => glisse && choisir(e)}
          onPointerUp={() => setGlisse(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- image lue au pixel près dans un canevas */}
          <img ref={image} src={IMAGE} alt="" draggable={false} onLoad={preparer} className="block h-64 w-auto" />
          {curseur && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{ left: curseur.x, top: curseur.y }}
            />
          )}
        </div>
        <button type="button" onClick={reinitialiser} className="mt-3 w-full border border-ligne py-2 text-[0.75rem] uppercase tracking-[0.14em] text-sable hover:border-or hover:text-or">
          Piment d’origine
        </button>
      </div>
    </>,
    document.body,
  );
}
