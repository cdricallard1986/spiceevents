import type { CheminStatique } from "@/i18n/routing";

export type EntreeNav = { href: CheminStatique; cle: string; frSeulement?: boolean };

/** Menu principal (l'ordre est celui de l'affichage). */
export const MENU: EntreeNav[] = [
  { href: "/mariages", cle: "mariages" },
  { href: "/animations", cle: "animations" },
  { href: "/evenementiel", cle: "evenementiel" },
  { href: "/avis", cle: "avis" },
  { href: "/galerie", cle: "galerie" },
  { href: "/journal", cle: "journal", frSeulement: true },
];

export function menuPour(locale: string): EntreeNav[] {
  return MENU.filter((e) => locale === "fr" || !e.frSeulement);
}
