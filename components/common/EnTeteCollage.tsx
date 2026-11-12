import type { ReactNode } from "react";
import type { CleImage } from "@/lib/images";
import { Photo } from "@/components/ui/Photo";
import { Accent } from "./Accent";
import { FondAleatoire } from "./FondAleatoire";

type Props = {
  /** Grande photo inclinée : une clé, ou une liste dont une est tirée au hasard à chaque visite. */
  images: CleImage | CleImage[];
  /** Petite photo en médaillon, d'un autre événement que la grande. */
  medaillon: CleImage;
  legende: string;
  pastille: string;
  surtitre: string;
  titre: string;
  intro?: string;
  children?: ReactNode;
};

/**
 * En-tête « collage » de la charte Nocturne : le titre à gauche, une grande photo
 * inclinée à droite, une petite photo en médaillon et une pastille orange.
 */
export function EnTeteCollage({ images, medaillon, legende, pastille, surtitre, titre, intro, children }: Props) {
  return (
    <section className="overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="conteneur grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div>
          <p className="surtitre mb-5">{surtitre}</p>
          <h1 className="font-display text-5xl leading-[0.9] sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem]">
            <Accent texte={titre} />
          </h1>
          {intro && <p className="mt-7 max-w-lg text-lg text-sable">{intro}</p>}
          {children && <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">{children}</div>}
        </div>

        <div className="relative pb-16 pl-6 sm:pb-20 sm:pl-10" data-sans-apparition>
          <div className="relative h-[20rem] rotate-[4deg] sm:h-[26rem] lg:h-[29rem]">
            {Array.isArray(images) ? (
              <FondAleatoire images={images} sizes="(min-width: 1024px) 45vw, 100vw" />
            ) : (
              <Photo cle={images} remplir priority sizes="(min-width: 1024px) 45vw, 100vw" />
            )}
          </div>
          <figure className="absolute bottom-0 left-0 w-40 -rotate-[8deg] border-8 border-nuit bg-nuit sm:w-56">
            <div className="relative aspect-[11/10]">
              <Photo cle={medaillon} remplir sizes="(min-width: 640px) 14rem, 10rem" />
            </div>
            <figcaption className="pt-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-sable">{legende}</figcaption>
          </figure>
          <p className="absolute bottom-6 right-0 flex size-28 rotate-12 items-center justify-center rounded-full bg-or p-3 text-center text-sm font-bold uppercase leading-snug text-nuit sm:size-36 sm:text-base">
            {pastille}
          </p>
        </div>
      </div>
    </section>
  );
}
