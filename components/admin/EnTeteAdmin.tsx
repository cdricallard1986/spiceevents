import type { ReactNode } from "react";
import type { Section } from "@/lib/admin/navigation";
import { Accent } from "@/components/common/Accent";
import { Icone } from "./Icones";

/**
 * En-tête d'une page du back office, dans la charte Nocturne du site : surtitre
 * orange, titre en capitales condensées dont la seconde moitié (l'accroche) est
 * orange, introduction, et éventuels boutons sous le texte.
 */
export function EnTeteAdmin({ section, titre, intro, children }: { section: Section; titre?: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-10 border-b border-ligne pb-8 md:mb-12">
      <p className="surtitre mb-4 flex items-center gap-3">
        <Icone nom={section.icone} className="size-4" />
        Back office
      </p>
      <h1 className="max-w-[18em] font-display text-[2.75rem] leading-[0.95] md:text-6xl">
        <Accent texte={titre ?? `${section.libelle}. *${section.accroche}*`} />
      </h1>
      {intro && <div className="mt-5 max-w-2xl text-sable">{intro}</div>}
      {children && <div className="mt-7 flex flex-wrap items-center gap-4">{children}</div>}
    </header>
  );
}
