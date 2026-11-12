"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/** Ce qui apparaît en douceur au défilement (charte Nocturne). */
const CIBLES = "main h2, main .grid > li, main blockquote, main figure";

/**
 * Apparitions courtes au défilement, sans boucle : chaque élément visé glisse de
 * quelques pixels en devenant visible, une seule fois. Rien sans JavaScript (le
 * contenu reste affiché) ni quand l'appareil demande moins d'animations.
 */
export function Apparitions() {
  const chemin = usePathname();

  useEffect(() => {
    const reduire = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduire.matches || !("IntersectionObserver" in window)) return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("vue");
          observateur.unobserve(e.target);
        }
      },
      { threshold: 0.08 },
    );
    const elements = [...document.querySelectorAll<HTMLElement>(CIBLES)].filter((el) => !el.closest("[data-sans-apparition]"));
    elements.forEach((el, i) => {
      // Décalage en cascade pour les cartes d'une même grille (3 temps au plus).
      if (el.matches(".grid > li")) el.style.setProperty("--delai", `${(i % 3) * 55}ms`);
      el.classList.add("apparition");
      observateur.observe(el);
    });
    return () => {
      observateur.disconnect();
      elements.forEach((el) => el.classList.remove("apparition", "vue"));
    };
  }, [chemin]);

  return null;
}
