"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { HREF_COMPTE, MENU, estActive } from "@/lib/admin/navigation";
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
  /** Demandes au statut « nouvelle » (pastille du menu) ; null si la base n'a pas répondu. */
  nouvellesDemandes: number | null;
  /** Relit ce nombre (Server Action) : à chaque page et au retour sur l'onglet. */
  relireDemandes: () => Promise<number | null>;
};

/** Toutes les deux minutes au plus, même onglet ouvert sans bouger. */
const RELECTURE_MS = 120_000;

/**
 * Cadre du back office, charte Nocturne : menu latéral noir repliable (burger,
 * état conservé dans ce navigateur) sur ordinateur, tiroir sur téléphone ; la
 * page active est un bloc orange au texte noir, comme le bandeau du site. À côté
 * de « Demandes », une pastille compte les nouvelles demandes. En bas du menu :
 * lien vers le site, numéro de version, déconnexion de cet appareil.
 */
export function CoqueAdmin({ children, version, email, nouvellesDemandes, relireDemandes }: Props) {
  const chemin = usePathname();
  const [replie, setReplie] = useState(false);
  const [tiroir, setTiroir] = useState(false);
  const [nouvelles, setNouvelles] = useState(nouvellesDemandes);
  const relire = useRef(relireDemandes);

  useEffect(() => setReplie(lireReplie()), []);
  useEffect(() => setTiroir(false), [chemin]);
  useEffect(() => setNouvelles(nouvellesDemandes), [nouvellesDemandes]);

  // Pastille à jour : à chaque changement de page, au retour sur l'onglet, et toutes les deux minutes.
  useEffect(() => {
    let actif = true;
    const maj = () => {
      if (document.visibilityState !== "visible") return;
      relire.current().then(
        (n) => actif && n !== null && setNouvelles(n),
        () => {},
      );
    };
    maj();
    const minuteur = window.setInterval(maj, RELECTURE_MS);
    document.addEventListener("visibilitychange", maj);
    return () => {
      actif = false;
      window.clearInterval(minuteur);
      document.removeEventListener("visibilitychange", maj);
    };
  }, [chemin]);

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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ligne bg-nuit-0/95 px-4 backdrop-blur-md lg:hidden">
        <Link href="/admin" className="shrink-0">
          <Logo className="h-9" />
        </Link>
        <button
          type="button"
          onClick={() => setTiroir(true)}
          aria-expanded={tiroir}
          aria-controls="menu-admin-mobile"
          aria-label={nouvelles ? `Ouvrir le menu (${libelleNouvelles(nouvelles)})` : "Ouvrir le menu"}
          className="relative flex size-11 items-center justify-center"
        >
          <Icone nom="burger" className="size-6" />
          {nouvelles ? <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2.5 bg-or" /> : null}
        </button>
      </header>

      {tiroir && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setTiroir(false)} className="absolute inset-0 bg-nuit/80" />
          <div id="menu-admin-mobile" className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r border-ligne bg-nuit-0">
            <div className="flex h-16 items-center justify-between border-b border-ligne px-5">
              <span className="surtitre">Back office</span>
              <button type="button" onClick={() => setTiroir(false)} aria-label="Fermer le menu" className="flex size-11 items-center justify-center">
                <Icone nom="fermer" className="size-6" />
              </button>
            </div>
            <ContenuMenu chemin={chemin} replie={false} version={version} email={email} nouvelles={nouvelles} />
          </div>
        </div>
      )}

      {/* Ordinateur : menu latéral fixe, repliable. */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ligne bg-nuit-0 transition-[width] duration-200 lg:flex ${replie ? "w-[4.5rem]" : "w-64"}`}
      >
        <div className={`flex items-center border-b border-ligne ${replie ? "h-24 justify-center" : "h-28 justify-between pl-6 pr-3"}`}>
          {!replie && (
            <Link href="/admin" className="flex shrink-0 flex-col items-start gap-2">
              <Logo className="h-12" />
              <span className="text-[0.625rem] font-semibold uppercase tracking-[0.32em] text-or">Back office</span>
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
        <ContenuMenu chemin={chemin} replie={replie} version={version} email={email} nouvelles={nouvelles} />
      </aside>

      <div className={`transition-[padding] duration-200 ${replie ? "lg:pl-[4.5rem]" : "lg:pl-64"}`}>
        <main id="contenu" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-12 lg:py-14">
          {children}
        </main>
      </div>
    </div>
  );
}

/** « 1 nouvelle demande », « 3 nouvelles demandes ». */
export function libelleNouvelles(n: number): string {
  return `${n} nouvelle${n > 1 ? "s" : ""} demande${n > 1 ? "s" : ""}`;
}

/** Pastille orange du nombre de nouvelles demandes (noire sur la ligne active, qui est orange). */
function Pastille({ nombre, actif, replie }: { nombre: number; actif: boolean; replie: boolean }) {
  const couleurs = actif ? "bg-nuit text-or" : "bg-or text-nuit";
  return (
    // Menu replié : un petit carré au coin de l'icône (comme sur le burger mobile), sans la cacher ;
    // le nombre reste dans l'infobulle de l'entrée.
    replie ? (
      <span aria-hidden="true" className={`absolute left-[calc(50%+0.375rem)] top-2.5 size-2.5 ${actif ? "bg-nuit" : "bg-or"}`} />
    ) : (
      <span aria-hidden="true" className={`${couleurs} ml-auto inline-flex min-w-6 items-center justify-center px-1.5 font-display text-sm leading-6 tabular-nums`}>
        {nombre > 99 ? "99+" : nombre}
      </span>
    )
  );
}

function ContenuMenu({ chemin, replie, version, email, nouvelles }: { chemin: string; replie: boolean; version: string; email: string; nouvelles: number | null }) {
  const lien = `relative flex items-center gap-3 py-3 transition-colors ${replie ? "justify-center" : "px-3"}`;
  const secondaire = `flex items-center gap-3 py-2.5 text-sm transition-colors ${replie ? "justify-center px-0" : "px-6"}`;
  return (
    <>
      <nav aria-label="Back office" className="flex-1 overflow-y-auto py-5">
        <ul className="flex flex-col gap-1">
          {MENU.map((s) => {
            const actif = estActive(s.href, chemin);
            const pastille = s.href === "/admin/demandes" && nouvelles ? nouvelles : 0;
            return (
              <li key={s.href} className={replie ? "px-2" : "px-3"}>
                <Link
                  href={s.href}
                  aria-current={actif ? "page" : undefined}
                  title={replie ? (pastille ? `${s.libelle} — ${libelleNouvelles(pastille)}` : s.libelle) : undefined}
                  className={`${lien} font-display text-[1.0625rem] uppercase tracking-[0.06em] ${
                    actif ? "bg-or text-nuit" : "text-ivoire hover:bg-nuit-2 hover:text-or"
                  }`}
                >
                  <Icone nom={s.icone} className="size-5 shrink-0" />
                  <span className={replie ? "sr-only" : ""}>{s.libelle}</span>
                  {pastille > 0 && (
                    <>
                      <Pastille nombre={pastille} actif={actif} replie={replie} />
                      <span className="sr-only"> ({libelleNouvelles(pastille)})</span>
                    </>
                  )}
                  {!replie && !s.disponible && <span className="ml-auto text-[0.6875rem] uppercase tracking-[0.12em] text-sable/60">bientôt</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-ligne py-3">
        {/* « Mon compte » au clic sur son nom, avec le rôle en sous-titre. */}
        <Link
          href={HREF_COMPTE}
          aria-current={estActive(HREF_COMPTE, chemin) ? "page" : undefined}
          title={replie ? `Mon compte — ${email}` : email}
          className={`${secondaire} h-14 ${estActive(HREF_COMPTE, chemin) ? "text-or" : "text-ivoire hover:text-or"}`}
        >
          <Icone nom="compte" />
          <span className={replie ? "sr-only" : "flex min-w-0 flex-col leading-tight"}>
            <span className="truncate font-semibold">Cédric</span>
            <span className="truncate text-xs text-sable">Administrateur · Mon compte</span>
          </span>
        </Link>
        <Link href="/" target="_blank" rel="noopener" title={replie ? "Voir le site" : undefined} className={`${secondaire} text-sable hover:text-or`}>
          <Icone nom="site" />
          <span className={replie ? "sr-only" : ""}>Voir le site</span>
        </Link>
        <form action={seDeconnecter}>
          <button type="submit" title={replie ? "Se déconnecter" : undefined} className={`${secondaire} w-full text-sable hover:text-or`}>
            <Icone nom="sortie" />
            <span className={replie ? "sr-only" : ""}>Se déconnecter</span>
          </button>
        </form>
        {/* Numéro de version (réservé à Cédric, seul utilisateur). */}
        <p className={`pt-2 text-[0.6875rem] uppercase tracking-[0.16em] text-sable/60 ${replie ? "text-center" : "px-6"}`} title={email}>
          {replie ? `v${version}` : <>Version {version}</>}
        </p>
      </div>
    </>
  );
}
