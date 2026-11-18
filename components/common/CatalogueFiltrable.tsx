"use client";

import { useRef, useState, type ReactNode } from "react";
import { CLASSES_BANDE, CLASSES_CARTE_BANDE } from "./bande";

export type CarteCatalogue = { cle: string; categorie: string; contenu: ReactNode };

type Props = {
  cartes: CarteCatalogue[];
  /** Catégories dans l’ordre des boutons : clé → libellé. */
  categories: Record<string, string>;
  libelleTout: string;
  libelleFiltres: string;
};

/**
 * Cartes avec boutons de filtre par catégorie (grille ; bande à faire glisser
 * sur téléphone). Toutes les cartes sont
 * dans le HTML (Google, sans JavaScript) ; un filtre ne fait que masquer les autres.
 */
export function CatalogueFiltrable({ cartes, categories, libelleTout, libelleFiltres }: Props) {
  const [actif, setActif] = useState<string | null>(null);
  const bande = useRef<HTMLUListElement>(null);
  const boutons: [string | null, string][] = [[null, libelleTout], ...Object.entries(categories)];

  return (
    <>
      <div role="group" aria-label={libelleFiltres} className="mb-10 flex flex-wrap gap-3">
        {boutons.map(([cle, libelle]) => {
          const choisi = actif === cle;
          return (
            <button
              key={libelle}
              type="button"
              aria-pressed={choisi}
              onClick={() => {
                setActif(cle);
                bande.current?.scrollTo({ left: 0 });
              }}
              className={`border px-5 py-3 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                choisi ? "border-or bg-or text-nuit" : "border-ligne text-ivoire hover:border-or hover:text-or"
              }`}
            >
              {libelle}
            </button>
          );
        })}
      </div>
      {/* Téléphone : une bande à faire glisser ; changer de filtre la ramène au début. */}
      <ul ref={bande} className={`${CLASSES_BANDE} sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4`}>
        {cartes.map((c) => (
          <li key={c.cle} hidden={actif !== null && c.categorie !== actif} data-categorie={c.categorie} className={CLASSES_CARTE_BANDE}>
            {c.contenu}
          </li>
        ))}
      </ul>
    </>
  );
}
