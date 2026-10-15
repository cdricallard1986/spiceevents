import type { ReactNode } from "react";
import { Accent } from "./Accent";

type Props = {
  id?: string;
  surtitre?: string;
  titre?: string;
  intro?: string;
  centre?: boolean;
  /** Fond légèrement plus clair pour alterner les sections. */
  alterne?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Section de page : surtitre doré, titre (h2) avec accent, introduction, contenu. */
export function Section({ id, surtitre, titre, intro, centre = false, alterne = false, className = "", children }: Props) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 md:py-28 ${alterne ? "bg-nuit-2" : ""} ${className}`}>
      <div className="conteneur">
        {(surtitre || titre || intro) && (
          <header className={`mb-12 max-w-3xl md:mb-16 ${centre ? "mx-auto text-center" : ""}`}>
            {surtitre && <p className="surtitre mb-4">{surtitre}</p>}
            {titre && (
              <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
                <Accent texte={titre} />
              </h2>
            )}
            {intro && <p className="mt-6 text-lg text-sable">{intro}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
