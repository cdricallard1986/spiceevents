import { useLocale } from "next-intl";
import { SITE } from "@/contenu/site";

const { note, nombre, url } = SITE.avisMariagesNet;

/** Cinq étoiles remplies au prorata de la note (4,9 → 98 %). */
export function Etoiles({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block leading-none tracking-[0.12em] ${className}`}
      aria-hidden="true"
    >
      <span className="text-ivoire/25">★★★★★</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-or"
        style={{ width: `${(note / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

function noteAffichee(fr: boolean) {
  return fr ? String(note).replace(".", ",") : String(note);
}

/**
 * La note Mariages.net en une ligne (sous les avis qui défilent) : étoiles, note,
 * nombre d'avis et lien vers la page d'avis Mariages.net. Aucun script extérieur.
 */
export function NoteMariagesNet() {
  const fr = useLocale() === "fr";
  const etiquette = fr
    ? `Note de ${noteAffichee(true)} sur 5, ${nombre} avis sur Mariages.net`
    : `Rated ${noteAffichee(false)} out of 5 from ${nombre} reviews on Mariages.net`;
  return (
    <div className="mt-8">
      <a
        href={url}
        target="_blank"
        rel="noopener"
        aria-label={etiquette}
        className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border border-ivoire/20 bg-nuit/60 px-5 py-2.5 text-sm backdrop-blur-sm transition-colors hover:border-or"
      >
        <Etoiles />
        <span className="font-semibold">{noteAffichee(fr)}/5</span>
        <span className="text-sable">
          {nombre} {fr ? "avis sur" : "reviews on"}{" "}
          <span className="font-semibold text-ivoire">Mariages.net</span> ↗
        </span>
      </a>
    </div>
  );
}

export const NOTE_MARIAGES_NET = { note, nombre, url, noteAffichee };
