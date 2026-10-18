import Link from "next/link";
import type { Section } from "@/lib/admin/navigation";
import { Icone } from "@/components/admin/Icones";

/** Page d'une section prévue au plan mais pas encore construite. */
export function BientotDisponible({ section }: { section: Section }) {
  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <div className="mt-10 max-w-2xl border border-ligne bg-nuit-2 p-6 sm:p-8">
        <p className="text-ivoire">{section.description}</p>
        <p className="mt-3 text-sable">Cette section sera bientôt disponible.</p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
        >
          ← Accueil du back office
        </Link>
      </div>
    </>
  );
}
