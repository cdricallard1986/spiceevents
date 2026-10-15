import type { ReactNode } from "react";
import type { CleImage } from "@/lib/images";
import { Photo } from "@/components/ui/Photo";
import { Accent } from "./Accent";

type Props = {
  image: CleImage;
  surtitre: string;
  titre: string;
  intro?: string;
  /** Accueil : plein écran ; pages intérieures : un peu moins haut. */
  pleinEcran?: boolean;
  children?: ReactNode;
};

/** Grand visuel d'ouverture de page, titre (h1) posé en bas de l'image. */
export function EnTetePage({ image, surtitre, titre, intro, pleinEcran = false, children }: Props) {
  return (
    <section className={`relative flex items-end overflow-hidden ${pleinEcran ? "min-h-[100svh]" : "min-h-[78svh]"}`}>
      <Photo cle={image} remplir priority sizes="100vw" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,18,0.7)_0%,rgba(14,13,18,0.2)_35%,rgba(14,13,18,0.94)_100%)]"
      />
      <div className="conteneur relative pb-16 pt-36 md:pb-24">
        <p className="surtitre mb-5">{surtitre}</p>
        <h1 className={`max-w-[13em] font-display leading-[0.98] ${pleinEcran ? "text-5xl sm:text-6xl md:text-[5.75rem]" : "text-5xl md:text-7xl"}`}>
          <Accent texte={titre} />
        </h1>
        {intro && <p className="mt-6 max-w-2xl text-lg text-ivoire/90 md:text-xl">{intro}</p>}
        {children && <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">{children}</div>}
      </div>
    </section>
  );
}
