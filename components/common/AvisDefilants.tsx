"use client";

import { useEffect, useState } from "react";
import type { AvisAffiche } from "@/lib/avis/types";
import type { CleImage } from "@/lib/images";
import { Photo } from "@/components/ui/Photo";

const DUREE_MS = 7000;

type Props = {
  liste: AvisAffiche[];
  image: CleImage;
  /** Libellés des boutons « précédent / suivant » et du choix d'un avis. */
  libelles: { precedent: string; suivant: string; avis: string };
  children?: React.ReactNode;
};

/**
 * Grands avis qui se succèdent sur une photo de fond, en fondu. Le défilement
 * s'arrête au survol, au clavier et quand l'appareil demande moins d'animations ;
 * les flèches et les points restent utilisables. Sans JavaScript : le premier avis.
 */
export function AvisDefilants({ liste, image, libelles, children }: Props) {
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);
  const n = liste.length;

  useEffect(() => {
    if (n < 2 || pause || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const minuteur = window.setTimeout(() => setActif((i) => (i + 1) % n), DUREE_MS);
    return () => window.clearTimeout(minuteur);
  }, [actif, pause, n]);

  if (n === 0) return null;
  const aller = (i: number) => setActif((i + n) % n);

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-roledescription="carrousel"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onFocus={() => setPause(true)}
      onBlur={() => setPause(false)}
      data-sans-apparition
    >
      <div className="absolute inset-0 -z-10">
        <Photo cle={image} remplir sizes="100vw" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,20,20,0.82),rgba(20,20,20,0.6)_45%,rgba(20,20,20,0.9))]" />
      </div>

      <div className="conteneur relative max-w-5xl py-24 text-center md:py-36">
        <div className="grid">
          {liste.map((a, i) => (
            <figure
              key={a.cle}
              aria-hidden={i !== actif}
              className={`col-start-1 row-start-1 transition-all duration-700 ease-out motion-reduce:transition-none ${
                i === actif ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <blockquote lang={a.langue} className="font-display text-3xl font-semibold leading-[1.25] md:text-[2.5rem]">
                « {a.texte} »
              </blockquote>
              <figcaption className="mt-8 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">{a.auteurs}</figcaption>
            </figure>
          ))}
        </div>

        {n > 1 && (
          <div className="mt-10 flex items-center justify-center gap-5">
            <button type="button" onClick={() => aller(actif - 1)} aria-label={libelles.precedent} className="flex size-11 items-center justify-center border border-ivoire/40 text-lg hover:border-or hover:text-or">
              ←
            </button>
            <ul className="flex gap-2">
              {liste.map((a, i) => (
                <li key={a.cle}>
                  <button
                    type="button"
                    onClick={() => aller(i)}
                    aria-label={`${libelles.avis} ${i + 1} : ${a.auteurs}`}
                    aria-current={i === actif}
                    className={`block h-1.5 transition-all duration-300 ${i === actif ? "w-8 bg-or" : "w-3 bg-ivoire/40 hover:bg-ivoire"}`}
                  />
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => aller(actif + 1)} aria-label={libelles.suivant} className="flex size-11 items-center justify-center border border-ivoire/40 text-lg hover:border-or hover:text-or">
              →
            </button>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
