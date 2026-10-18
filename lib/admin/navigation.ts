/**
 * Sections du back office, dans l'ordre du menu latéral et des cartes de
 * l'accueil. `disponible: false` = étape du plan pas encore construite (la page
 * affiche « bientôt disponible »).
 */

export type IconeSection = "accueil" | "avis" | "journal" | "photos" | "demandes" | "tests" | "emails";

export type Section = {
  href: string;
  libelle: string;
  description: string;
  icone: IconeSection;
  disponible: boolean;
};

export const ACCUEIL_ADMIN: Section = {
  href: "/admin",
  libelle: "Accueil",
  description: "Vue d'ensemble du back office.",
  icone: "accueil",
  disponible: true,
};

export const SECTIONS: readonly Section[] = [
  {
    href: "/admin/avis",
    libelle: "Avis",
    description: "Avis des mariés : texte, traduction, pages où ils apparaissent, ordre.",
    icone: "avis",
    disponible: true,
  },
  {
    href: "/admin/journal",
    libelle: "Journal",
    description: "Articles du journal : rédaction, photos, publication.",
    icone: "journal",
    disponible: false,
  },
  {
    href: "/admin/photos",
    libelle: "Photos",
    description: "Photos des galeries : ajout, ordre, texte alternatif.",
    icone: "photos",
    disponible: true,
  },
  {
    href: "/admin/demandes",
    libelle: "Demandes",
    description: "Demandes reçues par le formulaire de contact, statut et notes.",
    icone: "demandes",
    disponible: true,
  },
  {
    href: "/admin/tests",
    libelle: "Tests",
    description: "Tests automatiques et audit des droits en base.",
    icone: "tests",
    disponible: true,
  },
  {
    href: "/admin/emails",
    libelle: "Emails",
    description: "Envoi réel des emails du formulaire à une adresse de test.",
    icone: "emails",
    disponible: true,
  },
];

export const MENU: readonly Section[] = [ACCUEIL_ADMIN, ...SECTIONS];

/** L'entrée du menu est-elle celle de la page affichée ? (L'accueil seulement sur `/admin` exact.) */
export function estActive(href: string, chemin: string): boolean {
  if (href === ACCUEIL_ADMIN.href) return chemin === href;
  return chemin === href || chemin.startsWith(`${href}/`);
}

/** Section d'après son adresse (pour les pages « bientôt disponible »). */
export function sectionDe(href: string): Section {
  const section = SECTIONS.find((s) => s.href === href);
  if (!section) throw new Error(`Section inconnue : ${href}`);
  return section;
}
