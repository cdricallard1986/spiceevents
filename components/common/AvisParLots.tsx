"use client";

import { useEffect, useRef, useState } from "react";
import { avisRestants, lotsAvis } from "@/lib/avis/lots";
import type { AvisAffiche } from "@/lib/avis/types";
import { classesBouton } from "@/components/ui/Bouton";
import { CarteAvis } from "./Avis";

type Props = { liste: AvisAffiche[]; locale: "fr" | "en" };

/**
 * Avis de la page Avis, par lots : les premiers, puis un bouton « Voir plus
 * d’avis ». Tous les avis sont dans la page dès le chargement (lots suivants
 * repliés avec `hidden`). Chaque lot a sa propre grille : en déplier un ne
 * redistribue pas les avis déjà lus entre les colonnes.
 */
export function AvisParLots({ liste, locale }: Props) {
  const lots = lotsAvis(liste);
  const [visibles, setVisibles] = useState(1);
  const refs = useRef<(HTMLUListElement | null)[]>([]);
  const restants = avisRestants(lots, visibles);
  const affiches = liste.length - restants;
  const fr = locale === "fr";

  // Après « Voir plus » : le clavier et les lecteurs d’écran reprennent au premier avis du nouveau lot.
  useEffect(() => {
    if (visibles > 1) refs.current[visibles - 1]?.querySelector<HTMLElement>("li")?.focus({ preventScroll: true });
  }, [visibles]);

  return (
    <div>
      {lots.map((lot, i) => (
        <ul
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          hidden={i >= visibles}
          className="columns-1 gap-6 md:columns-2 lg:columns-3"
        >
          {lot.map((a, j) => (
            <CarteAvis key={a.cle} avis={a} tabIndex={j === 0 && i > 0 ? -1 : undefined} />
          ))}
        </ul>
      ))}
      {restants > 0 && (
        <div className="mt-4 flex flex-col items-center gap-4 text-center">
          <p role="status" className="text-sm text-sable">
            {fr ? `${affiches} avis affichés sur ${liste.length}` : `${affiches} of ${liste.length} reviews shown`}
          </p>
          <button type="button" onClick={() => setVisibles((n) => n + 1)} className={`${classesBouton("contour")} gap-3`}>
            {fr ? "Voir plus d’avis" : "Show more reviews"} <span aria-hidden="true">↓</span>
          </button>
        </div>
      )}
    </div>
  );
}
