import type { CheminStatique } from "@/i18n/routing";

export type EntreeNav = { href: CheminStatique; cle: string; frSeulement?: boolean };

/**
 * Menu principal (l'ordre est celui de l'affichage) : les trois portes d'entrée.
 * Avis, galerie et journal n'y figurent pas (choix de Cédric) : on les rejoint
 * par les liens placés sous les avis, les photos et les derniers articles, et
 * par le pied de page.
 */
export const MENU: EntreeNav[] = [
  { href: "/mariages", cle: "mariages" },
  { href: "/animations", cle: "animations" },
  { href: "/evenementiel", cle: "evenementiel" },
];

/** Pied de page : le menu, plus les pages qui n'y sont pas (utile aussi à Google). */
export const LIENS_PIED: EntreeNav[] = [
  ...MENU,
  { href: "/avis", cle: "avis" },
  { href: "/galerie", cle: "galerie" },
  { href: "/journal", cle: "journal", frSeulement: true },
];

function pourLangue(liste: EntreeNav[], locale: string): EntreeNav[] {
  return liste.filter((e) => locale === "fr" || !e.frSeulement);
}

export function menuPour(locale: string): EntreeNav[] {
  return pourLangue(MENU, locale);
}

export function liensPiedPour(locale: string): EntreeNav[] {
  return pourLangue(LIENS_PIED, locale);
}
