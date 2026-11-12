"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { SelecteurLangue } from "./SelecteurLangue";
import { SelecteurPiment, appliquerCouleur, couleurMemorisee } from "./SelecteurPiment";
import { menuPour } from "./navigation";

export function EnTete() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  // Petit secret : clic droit sur le logo → sélecteur de couleur en forme de piment.
  const [piment, setPiment] = useState<{ x: number; y: number } | null>(null);
  const menu = menuPour(locale);

  useEffect(() => setOuvert(false), [chemin]);
  useEffect(() => appliquerCouleur(couleurMemorisee()), []);
  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 24);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);
  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
  }, [ouvert]);

  const fond = defile || ouvert ? "bg-nuit/90 backdrop-blur-md border-ligne" : "bg-transparent border-transparent";

  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${fond}`}>
      {/* Plus haut en haut de page, un peu plus fin dès qu'on fait défiler. */}
      <div
        className={`conteneur flex items-center justify-between gap-6 transition-[height] duration-300 ${defile ? "h-16 md:h-[4.5rem]" : "h-20 md:h-28"}`}
      >
        <Link
          href="/"
          aria-label={t("accueil")}
          className="shrink-0"
          onContextMenu={(e) => {
            e.preventDefault();
            setPiment({ x: e.clientX, y: e.clientY });
          }}
        >
          <Logo className={`transition-[height] duration-300 ${defile ? "h-10 md:h-12" : "h-12 md:h-[4.5rem]"}`} />
        </Link>

        <nav aria-label={t("principale")} className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.8125rem] font-medium uppercase tracking-[0.16em]">
            {menu.map((e) => {
              const actif = chemin === e.href || chemin.startsWith(`${e.href}/`);
              return (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    aria-current={actif ? "page" : undefined}
                    className={`transition-colors hover:text-or ${actif ? "text-or" : "text-ivoire"}`}
                  >
                    {t(e.cle)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <SelecteurLangue className="hidden text-[0.8125rem] font-medium tracking-[0.16em] text-sable hover:text-or sm:inline" />
          <Link
            href="/contact"
            className="hidden border border-or px-5 py-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-or transition-colors hover:bg-or hover:text-nuit sm:inline-block"
          >
            {t("devis")}
          </Link>
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-controls="menu-mobile"
            aria-label={ouvert ? t("fermer") : t("menu")}
            className="flex size-11 items-center justify-center lg:hidden"
          >
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {ouvert ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {ouvert && (
        <nav id="menu-mobile" aria-label={t("principale")} className="h-[calc(100dvh-5rem)] overflow-y-auto border-t border-ligne bg-nuit lg:hidden">
          <ul className="conteneur flex flex-col py-6">
            {menu.map((e) => (
              <li key={e.href} className="border-b border-ligne">
                <Link href={e.href} className="block py-4 font-display text-3xl">
                  {t(e.cle)}
                </Link>
              </li>
            ))}
            <li className="border-b border-ligne">
              <Link href="/a-propos" className="block py-4 font-display text-3xl">
                {t("aPropos")}
              </Link>
            </li>
            <li className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/contact" className="bg-or px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-nuit">
                {t("devis")}
              </Link>
              <SelecteurLangue className="text-sm font-medium tracking-[0.16em] text-sable" />
            </li>
          </ul>
        </nav>
      )}
      {piment && <SelecteurPiment position={piment} onFermer={() => setPiment(null)} />}
    </header>
  );
}
