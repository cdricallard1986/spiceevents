/**
 * Sections du back office, dans l'ordre du menu latéral et des cartes de
 * l'accueil. `disponible: false` = étape du plan pas encore construite (la page
 * affiche « bientôt disponible »).
 */

export type IconeSection = "accueil" | "avis" | "dj" | "journal" | "photos" | "demandes" | "tests" | "emails" | "compte";

export type Section = {
  href: string;
  libelle: string;
  /** Seconde moitié du titre de la page, en orange (charte Nocturne) : « Photos. *Vos plus belles nuits.* » */
  accroche: string;
  description: string;
  icone: IconeSection;
  disponible: boolean;
};

export const ACCUEIL_ADMIN: Section = {
  href: "/admin",
  libelle: "Accueil",
  accroche: "Prêt à pimenter ?",
  description: "Vue d'ensemble du back office.",
  icone: "accueil",
  disponible: true,
};

export const SECTIONS: readonly Section[] = [
  {
    href: "/admin/avis",
    libelle: "Avis",
    accroche: "Ce qu'ils en disent.",
    description: "Avis des mariés : texte, traduction, pages où ils apparaissent, ordre.",
    icone: "avis",
    disponible: true,
  },
  {
    href: "/admin/dj",
    libelle: "DJ",
    accroche: "Ceux qui font danser.",
    description: "DJ et musiciens de la page Nos DJ : présentation, photo, ordre, publication.",
    icone: "dj",
    disponible: true,
  },
  {
    href: "/admin/journal",
    libelle: "Journal",
    accroche: "Le carnet pimenté.",
    description: "Articles du journal : rédaction, photos, publication.",
    icone: "journal",
    disponible: true,
  },
  {
    href: "/admin/photos",
    libelle: "Photos",
    accroche: "Vos plus belles nuits.",
    description: "Photos du site : diaporamas des en-têtes, galeries, ordre, texte alternatif.",
    icone: "photos",
    disponible: true,
  },
  {
    href: "/admin/demandes",
    libelle: "Demandes",
    accroche: "Ils veulent du piment.",
    description: "Demandes reçues par le formulaire de contact, statut et notes.",
    icone: "demandes",
    disponible: true,
  },
  {
    href: "/admin/tests",
    libelle: "Tests",
    accroche: "Sous le capot.",
    description: "Comportements SQL, audit des droits, tests automatiques, configuration.",
    icone: "tests",
    disponible: true,
  },
  {
    href: "/admin/emails",
    libelle: "Emails",
    accroche: "Le courrier qui part.",
    description: "Envoi réel des emails du formulaire à votre adresse, pour les vérifier.",
    icone: "emails",
    disponible: true,
  },
  {
    href: "/admin/compte",
    libelle: "Mon compte",
    accroche: "Votre clé du back office.",
    description: "Votre adresse de connexion et le changement de mot de passe.",
    icone: "compte",
    disponible: true,
  },
];

/** Adresse de « Mon compte » : en bas du menu, au clic sur son nom (règle de Cédric), pas dans la liste. */
export const HREF_COMPTE = "/admin/compte";

export const MENU: readonly Section[] = [ACCUEIL_ADMIN, ...SECTIONS.filter((s) => s.href !== HREF_COMPTE)];

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
