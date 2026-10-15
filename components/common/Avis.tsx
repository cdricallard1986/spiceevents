import type { AvisClient } from "@/contenu/avis";
import type { CleImage } from "@/lib/images";
import { Photo } from "@/components/ui/Photo";

/** Grande citation sur photo assombrie. */
export function GrandAvis({ citation, auteurs, image }: { citation: string; auteurs: string; image: CleImage }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-35">
        <Photo cle={image} remplir sizes="100vw" />
      </div>
      <figure className="conteneur relative max-w-5xl py-28 text-center md:py-40">
        <blockquote className="font-display text-3xl italic leading-[1.3] md:text-[2.5rem]">« {citation} »</blockquote>
        <figcaption className="mt-9 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">{auteurs}</figcaption>
      </figure>
    </section>
  );
}

/** Grille d'avis (page Avis, bas des pages). */
export function GrilleAvis({ liste }: { liste: (AvisClient & { citation?: string })[] }) {
  return (
    <ul className="columns-1 gap-6 md:columns-2 lg:columns-3">
      {liste.map((a) => (
        <li key={a.auteurs + a.texte.slice(0, 20)} className="mb-6 break-inside-avoid border border-ligne bg-nuit-2 p-8">
          <figure>
            <blockquote className="text-[0.9375rem] leading-relaxed text-ivoire/90">« {a.citation ?? a.texte} »</blockquote>
            <figcaption className="mt-6">
              <span className="block font-display text-xl">{a.auteurs}</span>
              {a.role && <span className="text-sm text-sable">{a.role}</span>}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
