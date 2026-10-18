"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { MENU, estActive } from "@/lib/admin/navigation";
import { seDeconnecter } from "@/app/admin/connexion/actions";
import { Icone } from "./Icones";

const CLE_REPLIE = "admin:menu-replie";

function lireReplie(): boolean {
  try {
    return window.localStorage.getItem(CLE_REPLIE) === "1";
  } catch {
    return false;
  }
}

function ecrireReplie(replie: boolean) {
  try {
    window.localStorage.setItem(CLE_REPLIE, replie ? "1" : "0");
  } catch {
    // Stockage indisponible (navigation privée…) : le menu reprendra sa largeur au rechargement.
  }
}

type Props = {
  children: ReactNode;
  /** Numéro de version (package.json) : le back office n'a qu'un utilisateur, Cédric. */
  version: string;
  email: string;
};

/**
 * Cadre du back office : menu latéral repliable (burger, état conservé dans ce
 * navigateur) sur ordinateur, tiroir sur téléphone. En bas du menu : lien vers
 * le site, numéro de version, déconnexion de cet appareil.
 */
export function CoqueAdmin({ children, version, email }: Props) {
  const chemin = usePathname();
  const [replie, setReplie] = useState(false);
  const [tiroir, setTiroir] = useState(false);

  useEffect(() => setReplie(lireReplie()), []);
  useEffect(() => setTiroir(false), [chemin]);
  useEffect(() => {
    if (!tiroir) return;
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setTiroir(false);
    document.addEventListener("keydown", surTouche);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = "";
    };
  }, [tiroir]);

  function basculer() {
    setReplie((v) => {
      ecrireReplie(!v);
      return !v;
    });
  }

  return (
    <div className="min-h-dvh">
      {/* Téléphone et tablette : barre du haut + tiroir. */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ligne bg-nuit/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/admin" className="text-lg text-ivoire">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setTiroir(true)}
          aria-expanded={tiroir}
          aria-controls="menu-admin-mobile"
          aria-label="Ouvrir le menu"
          className="flex size-11 items-center justify-center"
        >
          <Icone nom="burger" className="size-6" />
        </button>
      </header>

      {tiroir && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setTiroir(false)} className="absolute inset-0 bg-nuit/80" />
          <div id="menu-admin-mobile" className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r border-ligne bg-nuit-2">
            <div className="flex h-16 items-center justify-between border-b border-ligne px-4">
              <span className="surtitre">Back office</span>
              <button type="button" onClick={() => setTiroir(false)} aria-label="Fermer le menu" className="flex size-11 items-center justify-center">
                <Icone nom="fermer" className="size-6" />
              </button>
            </div>
            <ContenuMenu chemin={chemin} replie={false} version={version} email={email} />
          </div>
        </div>
      )}

      {/* Ordinateur : menu latéral fixe, repliable. */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ligne bg-nuit-2 transition-[width] duration-200 lg:flex ${replie ? "w-[4.5rem]" : "w-64"}`}
      >
        <div className={`flex h-20 items-center border-b border-ligne ${replie ? "justify-center" : "justify-between pl-6 pr-3"}`}>
          {!replie && (
            <Link href="/admin" className="text-lg text-ivoire">
              <Logo />
            </Link>
          )}
          <button
            type="button"
            onClick={basculer}
            aria-expanded={!replie}
            aria-label={replie ? "Déplier le menu" : "Replier le menu"}
            title={replie ? "Déplier le menu" : "Replier le menu"}
            className="flex size-11 items-center justify-center text-sable hover:text-or"
          >
            <Icone nom="burger" className="size-6" />
          </button>
        </div>
        <ContenuMenu chemin={chemin} replie={replie} version={version} email={email} />
      </aside>

      <div className={`transition-[padding] duration-200 ${replie ? "lg:pl-[4.5rem]" : "lg:pl-64"}`}>
        <main id="contenu" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}

function ContenuMenu({ chemin, replie, version, email }: { chemin: string; replie: boolean; version: string; email: string }) {
  const lien = `flex items-center gap-3 py-2.5 text-sm transition-colors ${replie ? "justify-center px-0" : "px-6"}`;
  return (
    <>
      <nav aria-label="Back office" className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-0.5">
          {MENU.map((s) => {
            const actif = estActive(s.href, chemin);
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-current={actif ? "page" : undefined}
                  title={replie ? s.libelle : undefined}
                  className={`${lien} border-l-2 ${actif ? "border-or bg-nuit-3 text-or" : "border-transparent text-ivoire hover:text-or"}`}
                >
                  <Icone nom={s.icone} />
                  <span className={replie ? "sr-only" : ""}>{s.libelle}</span>
                  {!replie && !s.disponible && <span className="ml-auto text-[0.6875rem] uppercase tracking-[0.12em] text-sable/60">bientôt</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-ligne py-3">
        <Link href="/" target="_blank" rel="noopener" title={replie ? "Voir le site" : undefined} className={`${lien} text-sable hover:text-or`}>
          <Icone nom="site" />
          <span className={replie ? "sr-only" : ""}>Voir le site</span>
        </Link>
        {/* Numéro de version au-dessus de la déconnexion (badge réservé à Cédric, seul utilisateur). */}
        <p className={`py-2 text-xs tracking-[0.08em] text-sable/70 ${replie ? "text-center" : "px-6"}`} title={email}>
          {replie ? `v${version}` : <>Version {version}</>}
        </p>
        <form action={seDeconnecter}>
          <button type="submit" title={replie ? "Se déconnecter" : undefined} className={`${lien} w-full text-sable hover:text-or`}>
            <Icone nom="sortie" />
            <span className={replie ? "sr-only" : ""}>Se déconnecter</span>
          </button>
        </form>
      </div>
    </>
  );
}
