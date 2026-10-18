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
        <Photo cle={image} remplir sizes="100vw" />
      </div>
      <figure className="conteneur relative max-w-5xl py-28 text-center md:py-40">
        <blockquote lang={langue} className="font-display text-3xl italic leading-[1.3] md:text-[2.5rem]">« {citation} »</blockquote>
        <figcaption className="mt-9 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">{auteurs}</figcaption>
      </figure>
    </section>
  );
}

/** Grille d'avis (page Avis, bas des pages) : le texte de chaque avis est déjà choisi (citation, extrait ou texte complet). */
export function GrilleAvis({ liste }: { liste: AvisAffiche[] }) {
  return (
    <ul className="columns-1 gap-6 md:columns-2 lg:columns-3">
      {liste.map((a) => (
        <li key={a.cle} className="mb-6 break-inside-avoid border border-ligne bg-nuit-2 p-8">
          <figure>
            <blockquote lang={a.langue} className="text-[0.9375rem] leading-relaxed text-ivoire/90">« {a.texte} »</blockquote>
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
