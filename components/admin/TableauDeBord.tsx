import Link from "next/link";
import { SECTIONS, type Section } from "@/lib/admin/navigation";
import { Accent } from "@/components/common/Accent";
import { CLASSES_PANNEAU } from "./champs";
import { Icone } from "./Icones";

export type ResumeDemandes = { nouvelles: number; sansEmail: number };

/** Un chiffre clé de l'accueil (null : la base n'a pas répondu, la case affiche un tiret). */
export type Chiffre = { valeur: number | null; libelle: string; href: string; alerte?: boolean };

/** « Bonjour » le jour, « Bonsoir » à partir de 18 h (heure de Paris). */
export function salutation(maintenant: Date = new Date()): string {
  const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Paris" }).format(maintenant));
  return heure >= 18 || heure < 5 ? "Bonsoir" : "Bonjour";
}

function texteDemandes(d: ResumeDemandes): string {
  return d.nouvelles === 0 ? "Aucune nouvelle demande" : `${d.nouvelles} nouvelle${d.nouvelles > 1 ? "s" : ""} demande${d.nouvelles > 1 ? "s" : ""}`;
}

/**
 * Accueil du back office (charte Nocturne) : salutation, chiffres clés, puis
 * une carte numérotée par section. Composant d'affichage seul : la page lit
 * les chiffres en base.
 */
export function TableauDeBord({ salut, chiffres, demandes }: { salut: string; chiffres: Chiffre[]; demandes: ResumeDemandes | null }) {
  return (
    <>
      <header className="mb-10 md:mb-12">
        <p className="surtitre mb-4">Back office · Spice Events</p>
        <h1 className="max-w-[16em] font-display text-[2.75rem] leading-[0.95] md:text-7xl">
          <Accent texte={`${salut} Cédric. *Prêt à pimenter ?*`} />
        </h1>
        <p className="mt-5 max-w-2xl text-sable">Avis, journal, photos et demandes : tout ce que vous publiez ici apparaît sur le site en quelques secondes.</p>
      </header>

      <ul className="grid grid-cols-2 border-l border-t border-ligne lg:grid-cols-4" aria-label="En chiffres">
        {chiffres.map((c) => (
          <li key={c.libelle} className="border-b border-r border-ligne">
            <Link href={c.href} className="group flex h-full flex-col gap-2 p-5 transition-colors hover:bg-nuit-2 md:p-6">
              <span className={`font-display text-5xl leading-none tabular-nums md:text-6xl ${c.alerte ? "text-or" : "text-ivoire group-hover:text-or"}`}>
                {c.valeur ?? "–"}
              </span>
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-sable">{c.libelle}</span>
            </Link>
          </li>
        ))}
      </ul>

      {demandes && demandes.sansEmail > 0 && (
        <p role="alert" className="mt-6 border-l-4 border-erreur bg-nuit-2 px-5 py-4 text-sm text-ivoire">
          ⚠ {demandes.sansEmail} nouvelle{demandes.sansEmail > 1 ? "s" : ""} demande{demandes.sansEmail > 1 ? "s" : ""} sans email reçu —{" "}
          <Link href="/admin/demandes" className="font-semibold text-erreur underline underline-offset-4">
            à traiter à la main
          </Link>
        </p>
      )}

      <h2 className="surtitre mb-6 mt-14">Tout le back office</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s, i) => (
          <li key={s.href}>
            <CarteSection section={s} numero={i + 1} demandes={s.href === "/admin/demandes" ? demandes : null} />
          </li>
        ))}
      </ul>
    </>
  );
}

function CarteSection({ section: s, numero, demandes }: { section: Section; numero: number; demandes: ResumeDemandes | null }) {
  return (
    <Link href={s.href} className={`group relative flex h-full flex-col gap-4 overflow-hidden p-6 transition-colors hover:border-or ${CLASSES_PANNEAU}`}>
      <span className="flex items-start justify-between gap-3">
        <span className="font-display text-sm tracking-[0.2em] text-or tabular-nums">{String(numero).padStart(2, "0")}</span>
        <Icone nom={s.icone} className="size-6 text-sable transition-colors group-hover:text-or" />
      </span>
      <span className="font-display text-3xl leading-none text-ivoire">
        {s.libelle}
        {!s.disponible && <span className="ml-3 align-middle text-[0.6875rem] tracking-[0.12em] text-sable/60">bientôt</span>}
      </span>
      <span className="text-sm text-sable">{s.description}</span>
      {demandes && (
        <span className={`text-sm font-semibold ${demandes.nouvelles > 0 ? "text-or" : "text-sable/80"}`}>{texteDemandes(demandes)}</span>
      )}
      <span aria-hidden="true" className="mt-auto pt-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or">
        <span className="inline-block transition-transform group-hover:translate-x-1">Ouvrir →</span>
      </span>
    </Link>
  );
}
