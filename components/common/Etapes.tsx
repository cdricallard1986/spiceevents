import type { Etape } from "@/contenu/types";

const ROMAINS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** Étapes numérotées en chiffres romains, en ligne sur grand écran. */
export function Etapes({ etapes }: { etapes: Etape[] }) {
  return (
    <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
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
