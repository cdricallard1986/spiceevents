"use client";

import { useDeferredValue, useId, useState } from "react";
import type { TextesRechercheFaq, ThemeFaq } from "@/contenu/pages/faq";
import { filtrerThemes, motsRecherche } from "@/lib/faq/recherche";
import { Bouton } from "@/components/ui/Bouton";
import { Faq } from "./Faq";

type Props = { themes: ThemeFaq[]; textes: TextesRechercheFaq };

/**
 * Thèmes de la FAQ avec un champ de recherche. Rendu côté serveur sans filtre (toutes
 * les questions dans le HTML, pour Google et sans JavaScript) ; la saisie réduit la
 * liste aux questions qui contiennent tous les mots, réponses dépliées.
 */
export function FaqFiltrable({ themes, textes }: Props) {
  const id = useId();
  const [requete, setRequete] = useState("");
  const differee = useDeferredValue(requete);
  const active = motsRecherche(differee).length > 0;
  const visibles = filtrerThemes(themes, differee);
  const total = visibles.reduce((n, t) => n + t.questions.length, 0);

  return (
    <div className="flex flex-col gap-16">
      <div role="search">
        <label htmlFor={id} className="surtitre mb-3 block">
          {textes.label}
        </label>
        <div className="relative">
          <input
            id={id}
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder={textes.exemple}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full border border-ligne bg-nuit-2 py-3.5 pl-3.5 pr-12 text-base text-ivoire transition-colors placeholder:text-sable/50 focus:border-or [&::-webkit-search-cancel-button]:hidden"
          />
          {requete && (
            <button
              type="button"
              onClick={() => setRequete("")}
              aria-label={textes.effacer}
              className="absolute inset-y-0 right-0 px-4 text-2xl leading-none text-sable transition-colors hover:text-or"
            >
              ×
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-3 min-h-6 text-sm text-sable">
          {active && total > 0 && (total === 1 ? textes.une : textes.plusieurs.replace("{n}", String(total)))}
        </p>
      </div>

      {active && total === 0 ? (
        <div>
          <p className="text-lg text-sable">{textes.aucune}</p>
          <Bouton href="/contact" variante="lien" className="mt-6">
            {textes.contact} →
          </Bouton>
        </div>
      ) : (
        <div className="flex flex-col gap-20">
          {visibles.map((t) => (
            <section key={t.id} id={t.id} className="scroll-mt-28">
              <h2 className="mb-8 font-display text-3xl leading-[1.1] md:text-4xl">{t.titre}</h2>
              <Faq questions={t.questions} ouvertes={active} />
              {t.lien && !active && (
                <Bouton href={t.lien.href} variante="lien" className="mt-8">
                  {t.lien.texte} →
                </Bouton>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
