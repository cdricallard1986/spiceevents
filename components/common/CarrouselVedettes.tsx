"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Une diapositive par élément (carte déjà rendue côté serveur). */
  diapositives: { cle: string; contenu: ReactNode }[];
  /** Diapositive alignée à gauche du contenu à l'arrivée (celles d'avant dépassent, floutées). */
  depart?: number;
  libelles: { precedent: string; suivant: string; zone: string };
};

/**
 * Carrousel horizontal : deux grandes cartes au centre (une sur téléphone), les voisines
 * dépassent à gauche et à droite, floutées et assombries, pour inviter à faire défiler.
 * Défilement au doigt, à la molette ou aux flèches, aimanté sur chaque carte.
 * Sans JavaScript : une simple bande qui défile, sans flou.
 */
export function CarrouselVedettes({ diapositives, depart = 0, libelles }: Props) {
  const piste = useRef<HTMLUListElement>(null);
  // Avant toute mesure : seules les cartes visibles à l'arrivée sont nettes (pas de flou qui « arrive »).
  const [nettes, setNettes] = useState<(boolean | "ordinateur")[]>(() =>
    diapositives.map((_, i) => (i === depart ? true : i === depart + 1 ? "ordinateur" : false)),
  );
  const [mesure, setMesure] = useState(false);

  /** Une carte est nette si elle tient entièrement dans la zone du contenu (hors marges). */
  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    const marge = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const gauche = marge - 2;
    const droite = window.innerWidth - marge + 2;
    setNettes([...el.children].map((li) => {
      const r = li.getBoundingClientRect();
      return r.left >= gauche && r.right <= droite;
    }));
    setMesure(true);
  }, []);

  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    const cible = el.children[depart] as HTMLElement | undefined;
    if (cible) {
      const marge = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
      el.scrollLeft = cible.offsetLeft - marge;
    }
    mesurer();
    let image = 0;
    const surDefilement = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(mesurer);
    };
    el.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    return () => {
      cancelAnimationFrame(image);
      el.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, [depart, mesurer]);

  function defiler(sens: 1 | -1) {
    const el = piste.current;
    const premiere = el?.children[0] as HTMLElement | undefined;
    if (!el || !premiere) return;
    const pas = premiere.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    el.scrollBy({ left: sens * pas, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <div className="relative" data-sans-apparition>
      <ul
        ref={piste}
        aria-label={libelles.zone}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scroll-padding-inline:max(1.25rem,calc((100vw-82rem)/2+1.25rem))] [scrollbar-width:none] md:[scroll-padding-inline:max(2.5rem,calc((100vw-82rem)/2+2.5rem))] [&::-webkit-scrollbar]:hidden"
      >
        {diapositives.map((d, i) => (
          <li
            key={d.cle}
            aria-hidden={nettes[i] === false || undefined}
            // Carte floutée : un clic fait défiler de son côté au lieu d'ouvrir la page.
            onClickCapture={(e) => {
              if (nettes[i] === true || (nettes[i] === "ordinateur" && window.innerWidth >= 768)) return;
              e.preventDefault();
              e.stopPropagation();
              const r = e.currentTarget.getBoundingClientRect();
              defiler(r.left + r.width / 2 < window.innerWidth / 2 ? -1 : 1);
            }}
            className={`w-[82vw] shrink-0 snap-start ${mesure ? "transition-[filter,opacity] duration-500" : ""} first:ml-[max(1.25rem,calc((100vw-82rem)/2+1.25rem))] last:mr-[max(1.25rem,calc((100vw-82rem)/2+1.25rem))] md:w-[calc((min(100vw,82rem)-5rem-1rem)/2)] md:first:ml-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] md:last:mr-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] ${
              nettes[i] === true ? "" : nettes[i] === "ordinateur" ? "max-md:cursor-pointer max-md:opacity-45 max-md:blur-[3px]" : "cursor-pointer opacity-45 blur-[3px]"
            }`}
          >
            {d.contenu}
          </li>
        ))}
      </ul>
      {/* Place la bande sur la carte de départ pendant la lecture de la page, avant le premier affichage. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var u=document.currentScript.previousElementSibling,t=u&&u.children[${depart}];if(t)u.scrollLeft=t.offsetLeft-(parseFloat(getComputedStyle(u).scrollPaddingLeft)||0)})()`,
        }}
      />
      <div className="conteneur mt-6 flex justify-end gap-3">
        <button type="button" onClick={() => defiler(-1)} aria-label={libelles.precedent} className="flex size-11 items-center justify-center border border-ligne text-lg transition-colors hover:border-or hover:text-or">
          ←
        </button>
        <button type="button" onClick={() => defiler(1)} aria-label={libelles.suivant} className="flex size-11 items-center justify-center border border-ligne text-lg transition-colors hover:border-or hover:text-or">
          →
        </button>
      </div>
    </div>
  );
}
