import type { AvisAffiche } from "@/lib/avis/types";
import type { CleImage } from "@/lib/images";
import { Photo } from "@/components/ui/Photo";

/**
 * Grande citation sur photo assombrie. `langue` : texte affiché dans une autre
 * langue que la page (avis anglais non traduit → `lang="fr"`).
 */
export function GrandAvis({ citation, auteurs, image, langue }: { citation: string; auteurs: string; image: CleImage; langue?: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-35">
        <div data-parallaxe className="absolute inset-x-0">
          <Photo cle={image} remplir sizes="100vw" />
        </div>
      </div>
      <figure className="conteneur relative max-w-5xl py-28 text-center md:py-40">
        <blockquote lang={langue} className="font-display text-3xl font-semibold leading-[1.3] md:text-[2.5rem]">« {citation} »</blockquote>
        <figcaption className="mt-9 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">{auteurs}</figcaption>
      </figure>
    </section>
  );
}

/** Carte d’un avis : le texte est déjà choisi (citation, extrait ou texte complet). */
export function CarteAvis({ avis: a, tabIndex }: { avis: AvisAffiche; tabIndex?: number }) {
  return (
    <li tabIndex={tabIndex} className="mb-6 break-inside-avoid border border-ligne bg-nuit-2 p-8 focus-visible:outline-2 focus-visible:outline-or">
      <figure>
        <blockquote lang={a.langue} className="text-[0.9375rem] leading-relaxed text-ivoire/90">« {a.texte} »</blockquote>
        <figcaption className="mt-6">
          <span className="block font-display text-xl">{a.auteurs}</span>
          {a.role && <span className="text-sm text-sable">{a.role}</span>}
        </figcaption>
      </figure>
    </li>
  );
}
