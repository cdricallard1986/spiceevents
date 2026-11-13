import type { GroupeEquipe } from "./types";

/** Limites de la table `equipe` (migration 0012), reprises par le formulaire et Zod. */
export const LIMITES_EQUIPE = {
  nom: 80,
  alias: 80,
  role: 80,
  style: 40,
  styles: 8,
  accroche: 200,
  presentation: 2000,
  avisTexte: 600,
  avisAuteur: 120,
  lieux: 400,
  lien: 500,
  lienLibelle: 60,
} as const;

export const GROUPES: readonly GroupeEquipe[] = ["dj", "musicien"];

export const LIBELLES_GROUPE: Record<GroupeEquipe, string> = {
  dj: "Les DJ",
  musicien: "Musiciens en live",
};

/** Cadrage par défaut : le centre de la photo. */
export const CADRAGE_CENTRE = "50% 50%";

/** « 50% 30% » : deux pourcentages de 0 à 100 (le motif de la base). */
export const MOTIF_CADRAGE = /^(\d{1,2}|100)% (\d{1,2}|100)%$/;

/** Fichier du site (`/images/…`) ou fichier envoyé dans le dossier `equipe/` du bucket `medias`. */
export const MOTIF_PHOTO_SITE = /^\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/;
export const MOTIF_PHOTO_STOCKAGE = /^equipe\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/;

export function estCheminPhotoMembre(chemin: string): boolean {
  if (MOTIF_PHOTO_SITE.test(chemin)) return true;
  return MOTIF_PHOTO_STOCKAGE.test(chemin) && !chemin.includes("//") && !/\/\./.test(chemin);
}

/** Cadrage arrondi au pour cent, à partir d'un clic sur la photo (fractions 0–1). */
export function cadrageDepuisClic(x: number, y: number): string {
  const pc = (v: number) => Math.round(Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.5)) * 100);
  return `${pc(x)}% ${pc(y)}%`;
}

/** Les deux pourcentages d'un cadrage (le centre s'il est illisible). */
export function lireCadrage(cadrage: string): { x: number; y: number } {
  const m = MOTIF_CADRAGE.exec(cadrage);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 };
}
