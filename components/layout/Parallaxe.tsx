"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/** Vitesse relative du fond : 0 = suit la page, 1 = immobile. */
const VITESSE = 0.25;

/**
 * Parallaxe des photos de fond (en-têtes, grands avis) : chaque calque
 * `[data-parallaxe]` glisse plus lentement que la page tant que sa section est
 * visible. Une seule écoute du défilement pour tout le site ; rien quand l’appareil
 * demande moins d’animations.
 */
export function Parallaxe() {
  const chemin = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const calques = [...document.querySelectorAll<HTMLElement>("[data-parallaxe]")];
    if (calques.length === 0) return;
    let image = 0;
    const appliquer = () => {
      const hauteur = window.innerHeight;
      for (const c of calques) {
        const cadre = c.parentElement!.getBoundingClientRect();
        if (cadre.bottom < 0 || cadre.top > hauteur) continue;
        // 0 quand la section est centrée dans l’écran ; le calque compense une partie du défilement.
        const ecart = cadre.top + cadre.height / 2 - hauteur / 2;
        const maximum = cadre.height * 0.11;
        const decalage = Math.max(-maximum, Math.min(maximum, -ecart * VITESSE));
        c.style.transform = `translate3d(0, ${decalage.toFixed(1)}px, 0)`;
      }
    };
    const surDefilement = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(appliquer);
    };
    appliquer();
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
      calques.forEach((c) => (c.style.transform = ""));
    };
  }, [chemin]);

  return null;
}
