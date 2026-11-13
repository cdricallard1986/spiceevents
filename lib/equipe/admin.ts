import { TYPES_IMAGE, type TypeImage } from "@/lib/photos/envoi";
import { estCheminPhotoMembre } from "./constantes";
import type { ErreursMembre } from "./schema";
import type { MembreEquipe } from "./types";

export { ordreSuivant, rangsEchanges } from "@/lib/avis/admin";

/** Logique pure de la section DJ du back office, partagée avec les Server Actions. */

/** Tri du back office et du site : DJ puis musiciens, chacun par `ordre`. */
export function trierEquipe(liste: readonly MembreEquipe[]): MembreEquipe[] {
  const rang = (m: MembreEquipe) => (m.groupe === "dj" ? 0 : 1);
  return [...liste].sort((a, b) => rang(a) - rang(b) || a.ordre - b.ordre || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Chemin sûr d'une photo envoyée : `equipe/<aaaa>/<mm>/<horodatage>-<aléa>.<ext>`.
 * L'extension vient du type MIME (validé), jamais du nom du fichier.
 */
export function cheminEnvoiMembre(type: TypeImage, maintenant: Date, alea: string): string {
  const aaaa = String(maintenant.getUTCFullYear());
  const mm = String(maintenant.getUTCMonth() + 1).padStart(2, "0");
  const propre = alea.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (propre.length < 6) throw new Error("Aléa trop court pour un nom de fichier.");
  const chemin = `equipe/${aaaa}/${mm}/${maintenant.getTime()}-${propre}.${TYPES_IMAGE[type]}`;
  if (!estCheminPhotoMembre(chemin)) throw new Error("Chemin d'envoi invalide.");
  return chemin;
}

// --- Réponses des Server Actions (app/admin/(espace)/dj/actions.ts) ---------

export type ResultatEchecMembre = { ok: false; message: string; erreurs?: ErreursMembre };
export type ResultatMembre = { ok: true; membre: MembreEquipe } | ResultatEchecMembre;
export type ResultatSuppressionMembre = { ok: true; id: string } | ResultatEchecMembre;
export type ResultatEchangeMembres = { ok: true; rangs: { id: string; ordre: number }[] } | ResultatEchecMembre;
export type ResultatUrlEnvoiMembre = { ok: true; chemin: string; jeton: string } | ResultatEchecMembre;
