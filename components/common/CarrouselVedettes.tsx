"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Une diapositive par élément (carte déjà rendue côté serveur). */
  diapositives: { cle: string; contenu: ReactNode }[];
  /** Diapositive alignée à gauche du contenu à l'arrivée (celles d'avant dépassent, floutées). */
  depart?: number;
  libelles: { precedent: string; suivant: string; zone: string };
};

/** État d'une carte : entièrement dans la zone du contenu, ou qui dépasse (floutée), ou hors de l'écran. */
type Etat = "nette" | "ordinateur" | "floue" | "cachee";

/** À partir de combien de cartes le carrousel tourne en boucle (en dessous, rien à faire défiler). */
const MINIMUM_BOUCLE = 3;

/**
 * Carrousel horizontal : deux grandes cartes au centre (une sur téléphone), les voisines
 * dépassent à gauche et à droite, floutées et assombries, pour inviter à faire défiler.
 * Défilement au doigt, à la molette ou aux flèches, aimanté sur chaque carte.
 *
 * En boucle, dans les deux sens : une fois la page chargée, une copie de la série est
 * ajoutée avant et après les cartes ; quand le défilement s'arrête dans une copie, la
 * bande revient sans animation sur la carte d'origine identique (rien ne bouge à l'écran).
 * Les copies n'existent que dans le navigateur (le HTML ne contient chaque carte qu'une
 * fois) et sont masquées aux lecteurs d'écran. Sans JavaScript : une simple bande qui
 * défile, sans flou ni boucle.
 */
export function CarrouselVedettes({ diapositives, depart = 0, libelles }: Props) {
  const piste = useRef<HTMLUListElement>(null);
  const n = diapositives.length;
  const [boucle, setBoucle] = useState(false);
  // Avant toute mesure : seules les cartes visibles à l'arrivée sont nettes (pas de flou qui « arrive »).
  const [etats, setEtats] = useState<Etat[]>(() =>
    diapositives.map((_, i) => (i === depart ? "nette" : i === depart + 1 ? "ordinateur" : "floue")),
  );
  const [mesure, setMesure] = useState(false);

  /** Une carte est nette si elle tient entièrement dans la zone du contenu (hors marges). */
  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    const marge = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const gauche = marge - 2;
    const droite = window.innerWidth - marge + 2;
    setEtats(
      [...el.children].map((li) => {
        const r = li.getBoundingClientRect();
        if (r.left >= gauche && r.right <= droite) return "nette";
        return r.right <= 0 || r.left >= window.innerWidth ? "cachee" : "floue";
      }),
    );
    setMesure(true);
  }, []);

  /** Défilement arrêté dans une copie : saut invisible vers la même carte de la série d'origine. */
  const recentrer = useCallback(() => {
    const el = piste.current;
    if (!el || el.children.length !== n * 3) return;
    const debut = (el.children[n] as HTMLElement).offsetLeft;
    const tour = (el.children[2 * n] as HTMLElement).offsetLeft - debut;
    const marge = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    // Position de la carte de gauche par rapport à la première carte d'origine (une demi-carte de tolérance).
    const position = el.scrollLeft + marge - debut;
    const demi = (el.children[n] as HTMLElement).offsetWidth / 2;
    if (position < -demi) el.scrollLeft += tour;
    else if (position > tour - demi) el.scrollLeft -= tour;
  }, [n]);

  // Placement initial sur la carte de départ, mesure, écoute du défilement.
  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    const cible = el.children[depart] as HTMLElement | undefined;
    if (cible) {
      const marge = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
      el.scrollLeft = cible.offsetLeft - marge;
    }
    mesurer();
    if (n >= MINIMUM_BOUCLE) setBoucle(true);
  }, [depart, mesurer, n]);

  // Copies ajoutées avant les cartes : la bande se décale d'une série, avant l'affichage.
  useLayoutEffect(() => {
    const el = piste.current;
    if (!boucle || !el || el.children.length !== n * 3) return;
    el.scrollLeft += (el.children[n] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
    mesurer();
  }, [boucle, n, mesurer]);

  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    let image = 0;
    let arret = 0;
    const surDefilement = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(mesurer);
      // Fin du défilement (doigt levé, animation terminée) : `scrollend` n'existe pas partout.
      window.clearTimeout(arret);
      arret = window.setTimeout(recentrer, 140);
    };
    el.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    return () => {
      cancelAnimationFrame(image);
      window.clearTimeout(arret);
      el.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, [mesurer, recentrer]);

  function defiler(sens: 1 | -1) {
    const el = piste.current;
    const premiere = el?.children[0] as HTMLElement | undefined;
    if (!el || !premiere) return;
    const pas = premiere.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    el.scrollBy({ left: sens * pas, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  const cartes = boucle
    ? [0, 1, 2].flatMap((serie) => diapositives.map((d, i) => ({ ...d, cle: `${serie}-${d.cle}`, copie: serie !== 1, index: serie * n + i })))
    : diapositives.map((d, i) => ({ ...d, copie: false, index: i }));

  return (
    <div className="relative" data-sans-apparition>
      <ul
        ref={piste}
        aria-label={libelles.zone}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scroll-padding-inline:max(1.25rem,calc((100vw-82rem)/2+1.25rem))] [scrollbar-width:none] md:[scroll-padding-inline:max(2.5rem,calc((100vw-82rem)/2+2.5rem))] [&::-webkit-scrollbar]:hidden"
      >
        {cartes.map((d) => {
          const etat = etats[d.index] ?? "cachee";
          const nette = etat === "nette";
          return (
            <li
              key={d.cle}
              aria-hidden={d.copie || !nette ? true : undefined}
              // Une copie hors de l'écran n'est ni cliquable ni atteignable au clavier.
              inert={d.copie && etat === "cachee" ? true : undefined}
              // Carte floutée : un clic fait défiler de son côté au lieu d'ouvrir la page.
              onClickCapture={(e) => {
                if (nette || (etat === "ordinateur" && window.innerWidth >= 768)) return;
                e.preventDefault();
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                defiler(r.left + r.width / 2 < window.innerWidth / 2 ? -1 : 1);
              }}
              className={`w-[82vw] shrink-0 snap-start ${mesure ? "transition-[filter,opacity] duration-500" : ""} first:ml-[max(1.25rem,calc((100vw-82rem)/2+1.25rem))] last:mr-[max(1.25rem,calc((100vw-82rem)/2+1.25rem))] md:w-[calc((min(100vw,82rem)-5rem-1rem)/2)] md:first:ml-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] md:last:mr-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] ${
                nette ? "" : etat === "ordinateur" ? "max-md:cursor-pointer max-md:opacity-45 max-md:blur-[3px]" : "cursor-pointer opacity-45 blur-[3px]"
              }`}
            >
              {d.contenu}
            </li>
          );
        })}
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
