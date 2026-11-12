"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/routing";
import type { CleImage } from "@/lib/images";
import { Link } from "@/i18n/navigation";
import { Modale } from "@/components/admin/Modale";
import { Photo } from "@/components/ui/Photo";

export type MomentAffiche = {
  titre: string;
  texte: string;
  accroche: string;
  image: CleImage;
  /** Animations liées : slug traduit et titre dans la langue de la page. */
  options: { slug: string; titre: string }[];
};

type Props = { moments: MomentAffiche[]; locale: Locale; etiquette: string };

/**
 * « Chaque instant » (maquette Nocturne) : une carte par moment de la journée,
 * photo qui s'élève au survol ; un clic ouvre le détail du moment et ses animations.
 */
export function JourneeMariage({ moments, locale, etiquette }: Props) {
  const [ouvert, setOuvert] = useState<number | null>(null);
  const m = ouvert === null ? null : moments[ouvert];

  return (
    <>
      <ol className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {moments.map((moment, i) => (
          <li key={moment.titre}>
            <button
              type="button"
              onClick={() => setOuvert(i)}
              aria-haspopup="dialog"
              className="group flex w-full flex-col border-b border-ligne pb-6 text-left"
            >
              <span className="relative block aspect-[11/12] w-full overflow-hidden">
                <span className="absolute inset-0 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
                  <Photo cle={moment.image} remplir sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw" className="photo-arrivee" />
                </span>
              </span>
              <span className="mt-6 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-sable">
                {String(i + 1).padStart(2, "0")} / {etiquette}
              </span>
              <span className="mt-3 text-xl font-semibold tracking-tight group-hover:text-or">
                {moment.titre}{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
              <span className="mt-2 text-[0.9375rem] text-sable">{moment.accroche}</span>
            </button>
          </li>
        ))}
      </ol>

      <Modale ouverte={m !== null} onFermer={() => setOuvert(null)} titre={m?.titre ?? ""} largeur="normale">
        {m && (
          <div className="flex flex-col gap-6">
            <div className="relative aspect-[16/9] overflow-hidden">
              <Photo cle={m.image} remplir sizes="(min-width: 768px) 42rem, 100vw" />
            </div>
            <p className="text-lg text-sable">{m.texte}</p>
            {m.options.length > 0 && (
              <ul className="flex flex-wrap gap-x-6 gap-y-3">
                {m.options.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={{ pathname: "/animations/[option]", params: { option: o.slug } }}
                      className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
                    >
                      {o.titre} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/contact" className="self-start bg-or px-7 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-nuit hover:bg-or-clair">
              {locale === "fr" ? "Parlons de votre mariage" : "Let's talk about your wedding"} →
            </Link>
          </div>
        )}
      </Modale>
    </>
  );
}
