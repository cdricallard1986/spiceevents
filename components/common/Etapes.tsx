import type { CSSProperties } from "react";
import type { Etape } from "@/contenu/types";

const ROMAINS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * Étapes numérotées en chiffres romains. Sur grand écran (≥ 1280 px), toutes
 * sur une seule ligne, quel que soit leur nombre ; entre 1024 et 1280 px, une
 * ligne jusqu'à 4 étapes, sinon 3 par ligne (colonnes trop étroites au-delà).
 */
export function Etapes({ etapes }: { etapes: Etape[] }) {
  const n = etapes.length;
  const colonnes = { "--etapes": n, "--etapes-lg": n <= 4 ? n : 3 } as CSSProperties;
  return (
    <ol
      style={colonnes}
      className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[repeat(var(--etapes-lg),minmax(0,1fr))] xl:grid-cols-[repeat(var(--etapes),minmax(0,1fr))] xl:gap-x-8"
    >
      {etapes.map((e, i) => (
        <li key={e.titre} className="border-t border-ligne pt-6">
          <p aria-hidden="true" className="mb-3 font-display text-2xl text-or">{ROMAINS[i]}.</p>
          <h3 className="mb-2 text-lg font-semibold tracking-wide">{e.titre}</h3>
          <p className="text-[0.9375rem] text-sable">{e.texte}</p>
        </li>
      ))}
    </ol>
  );
}
