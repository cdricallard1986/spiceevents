import type { Metadata } from "next";
import Link from "next/link";
import { exigerAdmin } from "@/lib/admin/garde";
import { SECTIONS } from "@/lib/admin/navigation";
import { Icone } from "@/components/admin/Icones";

export const metadata: Metadata = { title: "Accueil" };

export default async function AccueilAdmin() {
  await exigerAdmin();
  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Bonjour Cédric</h1>
      <p className="mt-4 max-w-2xl text-sable">
        Avis, journal, photos des galeries et demandes de contact : tout ce que vous publiez ici apparaît sur le site en
        quelques secondes.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex h-full flex-col gap-3 border border-ligne bg-nuit-2 p-6 transition-colors hover:border-or"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 text-or">
                  <Icone nom={s.icone} className="size-6" />
                  <span className="font-display text-2xl text-ivoire group-hover:text-or">{s.libelle}</span>
                </span>
                {!s.disponible && <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-sable/60">bientôt</span>}
              </span>
              <span className="text-sm text-sable">{s.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
