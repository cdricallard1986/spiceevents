import type { ComponentProps } from "react";
import type { Link } from "@/i18n/navigation";
import { routing, type CheminStatique } from "@/i18n/routing";

type HrefLien = ComponentProps<typeof Link>["href"];

const CHEMINS_STATIQUES = Object.keys(routing.pathnames).filter((c) => !c.includes("[")) as CheminStatique[];

/**
 * Lien d'un article (adresse française, écrite par le script de conversion) →
 * href typé pour le `Link` de next-intl, ou null si ce n'est pas une page connue
 * du site (ancre, fichier, adresse externe) : on garde alors un simple `<a>`.
 */
export function hrefInterne(adresse: string): HrefLien | null {
  if (!adresse.startsWith("/") || adresse.startsWith("//") || /[?#]/.test(adresse)) return null;
  const chemin = adresse.length > 1 ? adresse.replace(/\/$/, "") : adresse;
  if ((CHEMINS_STATIQUES as string[]).includes(chemin)) return chemin as CheminStatique;
  const article = chemin.match(/^\/journal\/([a-z0-9-]+)$/);
  if (article) return { pathname: "/journal/[slug]", params: { slug: article[1] } };
  const option = chemin.match(/^\/animations\/([a-z0-9-]+)$/);
  if (option) return { pathname: "/animations/[option]", params: { option: option[1] } };
  return null;
}

/** Vrai pour une adresse externe (ouverte dans un nouvel onglet). */
export function estExterne(adresse: string): boolean {
  return /^https?:\/\//i.test(adresse);
}
