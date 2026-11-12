"use client";

import { useEffect, useRef, useState, type PointerEvent as EvenementPointeur } from "react";
import { createPortal } from "react-dom";

/** Corps du piment (repère 0-24 × 0-48, même silhouette que l'icône Piment). */
const CORPS =
  "M11 7.4c3.6-.4 6.6 1.6 7.6 5.4 1.3 4.8.4 11.4-2.4 18.1-2.3 5.6-5.7 10.6-9.7 15.2-.5.5-1.3.2-1.2-.5.9-5.9 3.1-10.5 4.3-15.6 1.3-5.3.8-10.4-1.3-14.6C7.2 13 8 7.7 11 7.4z";
const QUEUE = "M8.6 1.2c1.9 1.6 3.1 3.6 3.6 6.1l-1.9.4c-.4-2-1.3-3.6-2.9-4.9z";

const CLE = "spice:couleur";

/** Couleur d'un point du piment : la teinte suit la hauteur, la clarté la largeur. */
export function couleurAuPoint(x: number, y: number): string {
  const teinte = Math.round(((y - 7) / 40) * 360 + 360) % 360;
  const clarte = Math.round(42 + ((x - 5) / 14) * 24);
  return `hsl(${teinte} 95% ${Math.max(35, Math.min(70, clarte))}%)`;
}

/** Remplace l'accent orange du site (variables de la charte) par une autre couleur. */
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
 * Petit secret du site : un clic droit sur le logo ouvre ce sélecteur en forme de
 * piment. Le point choisi devient l'accent de tout le site, immédiatement.
 */
export function SelecteurPiment({ position, onFermer }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const corps = useRef<SVGPathElement>(null);
  const [curseur, setCurseur] = useState<{ x: number; y: number } | null>(null);
  const [glisse, setGlisse] = useState(false);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);

  function choisir(e: EvenementPointeur<SVGSVGElement>) {
    const el = svg.current;
    const forme = corps.current;
    if (!el || !forme) return;
    const matrice = el.getScreenCTM();
    if (!matrice) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrice.inverse());
    if (!forme.isPointInFill(p)) return;
    setCurseur({ x: p.x, y: p.y });
    const couleur = couleurAuPoint(p.x, p.y);
    appliquerCouleur(couleur);
    memoriser(couleur);
  }

  function reinitialiser() {
    setCurseur(null);
    appliquerCouleur(null);
    memoriser(null);
  }

  // Portail : l'en-tête (flou d'arrière-plan) servirait sinon de cadre aux éléments `fixed`.
  return createPortal(
    <>
      <div className="fixed inset-0 z-[70]" onClick={onFermer} onContextMenu={(e) => (e.preventDefault(), onFermer())} />
      <div
        role="dialog"
        aria-label="Choisir la couleur du piment"
        className="fixed z-[71] w-48 border border-ligne bg-nuit-2 p-4 shadow-2xl"
        style={{ left: Math.min(position.x, window.innerWidth - 208), top: position.y + 8 }}
      >
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-sable">Pimentez le site</p>
        <svg
          ref={svg}
          viewBox="0 0 24 48"
          className="mx-auto block h-64 cursor-crosshair touch-none select-none"
          onPointerDown={(e) => {
            setGlisse(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            choisir(e);
          }}
          onPointerMove={(e) => glisse && choisir(e)}
          onPointerUp={() => setGlisse(false)}
        >
          <defs>
            <linearGradient id="piment-teintes" x1="0" y1="7" x2="0" y2="47" gradientUnits="userSpaceOnUse">
              {[0, 30, 60, 120, 180, 240, 300, 360].map((t) => (
                <stop key={t} offset={t / 360} stopColor={`hsl(${t} 95% 54%)`} />
              ))}
            </linearGradient>
            <linearGradient id="piment-clarte" x1="5" y1="0" x2="19" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#000" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path d={QUEUE} fill="#5b8f3a" />
          <path ref={corps} d={CORPS} fill="url(#piment-teintes)" />
          <path d={CORPS} fill="url(#piment-clarte)" pointerEvents="none" />
          {curseur && (
            <circle cx={curseur.x} cy={curseur.y} r="1.4" fill="none" stroke="#fff" strokeWidth="0.5" pointerEvents="none">
              <title>Couleur choisie</title>
            </circle>
          )}
        </svg>
        <button type="button" onClick={reinitialiser} className="mt-3 w-full border border-ligne py-2 text-[0.75rem] uppercase tracking-[0.14em] text-sable hover:border-or hover:text-or">
          Piment d&apos;origine
        </button>
      </div>
    </>,
    document.body,
  );
}
