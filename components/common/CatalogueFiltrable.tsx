"use client";

import { useState, type ReactNode } from "react";

export type CarteCatalogue = { cle: string; categorie: string; contenu: ReactNode };

type Props = {
  cartes: CarteCatalogue[];
  /** Catégories dans l’ordre des boutons : clé → libellé. */
  categories: Record<string, string>;
  libelleTout: string;
  libelleFiltres: string;
};

/**
 * Grille de cartes avec boutons de filtre par catégorie. Toutes les cartes sont
 * dans le HTML (Google, sans JavaScript) ; un filtre ne fait que masquer les autres.
 */
export function CatalogueFiltrable({ cartes, categories, libelleTout, libelleFiltres }: Props) {
  const [actif, setActif] = useState<string | null>(null);
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
              onClick={() => setActif(cle)}
              className={`border px-5 py-3 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                choisi ? "border-or bg-or text-nuit" : "border-ligne text-ivoire hover:border-or hover:text-or"
              }`}
            >
              {libelle}
            </button>
          );
        })}
      </div>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {cartes.map((c) => (
          <li key={c.cle} hidden={actif !== null && c.categorie !== actif} data-categorie={c.categorie}>
            {c.contenu}
          </li>
        ))}
      </ul>
    </>
  );
}
