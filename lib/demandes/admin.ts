import { LIMITE_NOTE, OBJET_EMAIL, STATUTS, TAILLE_PAGE, type StatutDemande } from "./constantes";
import type { Demande, SuiviDemande } from "./types";

/**
 * Logique pure de la liste des demandes du back office (filtres, compteurs,
 * pagination, liens de contact, dates en français), testée et partagée avec
 * la Server Action.
 */

export type FiltreStatut = StatutDemande | "toutes";
export type FiltresDemandes = { statut: FiltreStatut; recherche: string };

export const FILTRES_PAR_DEFAUT: FiltresDemandes = { statut: "toutes", recherche: "" };

/** Ordre des filtres dans la liste. */
export const FILTRES_STATUT: readonly FiltreStatut[] = [...STATUTS, "toutes"];

/** Minuscules sans accents : « helene » trouve « Hélène ». */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Les plus récentes en tête (puis l'identifiant, pour un ordre stable). */
export function trierDemandes(liste: readonly Demande[]): Demande[] {
  return [...liste].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** La demande correspond-elle à la recherche (prénoms, nom, email, lieu) ? */
export function correspond(d: Demande, recherche: string): boolean {
  const r = normaliserRecherche(recherche);
  if (r === "") return true;
  const champs = [`${d.prenoms} ${d.nom}`, `${d.nom} ${d.prenoms}`, d.email, d.lieu ?? ""];
  return champs.some((c) => normaliserRecherche(c).includes(r));
}

export function filtrerDemandes(liste: readonly Demande[], f: FiltresDemandes): Demande[] {
  return trierDemandes(liste).filter((d) => (f.statut === "toutes" || d.statut === f.statut) && correspond(d, f.recherche));
}

export function filtresActifs(f: FiltresDemandes): boolean {
  return f.statut !== "toutes" || f.recherche.trim() !== "";
}

/**
 * Nombre de demandes par statut (et au total). La recherche s'applique aux
 * compteurs : ils disent combien de résultats chaque onglet montrerait.
 */
export function compterParStatut(liste: readonly Demande[], recherche = ""): Record<FiltreStatut, number> {
  const compteurs = Object.fromEntries(FILTRES_STATUT.map((s) => [s, 0])) as Record<FiltreStatut, number>;
  for (const d of liste) {
    if (!correspond(d, recherche)) continue;
    compteurs[d.statut] += 1;
    compteurs.toutes += 1;
  }
  return compteurs;
}

/** Demandes dont l'email de notification n'est pas parti (le filet du formulaire). */
export function sansEmail(liste: readonly Demande[]): Demande[] {
  return liste.filter((d) => !d.email_envoye);
}

export type Page<T> = { elements: T[]; page: number; pages: number; total: number };

/** Une page de la liste (numérotée à partir de 1, ramenée dans les bornes). */
export function paginer<T>(liste: readonly T[], page: number, taille = TAILLE_PAGE): Page<T> {
  const pages = Math.max(1, Math.ceil(liste.length / taille));
  const p = Math.min(Math.max(1, Math.trunc(Number.isFinite(page) ? page : 1)), pages);
  return { elements: liste.slice((p - 1) * taille, p * taille), page: p, pages, total: liste.length };
}

/** Intègre à la liste le suivi enregistré (statut, note, date de mise à jour). */
export function appliquerSuivi(liste: readonly Demande[], suivi: SuiviDemande): Demande[] {
  return liste.map((d) => (d.id === suivi.id ? { ...d, statut: suivi.statut, note_interne: suivi.note_interne, updated_at: suivi.updated_at } : d));
}

// --- Liens de contact ---------------------------------------------------------
// Ils sont construits à partir de saisies du formulaire : on n'accepte que des
// caractères attendus, sinon pas de lien (jamais d'injection de schéma).

/** Chiffres et « + » initial seulement (ex. « 06 12 34 56 78 » → « 0612345678 »). */
function chiffres(telephone: string): string | null {
  const n = telephone.trim().replace(/[\s.\-()/]/g, "");
  return /^\+?\d{6,15}$/.test(n) ? n : null;
}

/** `tel:+33612345678`, ou null si le numéro n'est pas exploitable. */
export function lienAppel(telephone: string): string | null {
  const n = chiffres(telephone);
  return n ? `tel:${n}` : null;
}

/**
 * Lien WhatsApp pour un portable français (06 / 07) : `https://wa.me/33612345678`.
 * null pour un fixe ou un numéro étranger (rien ne dit qu'il a WhatsApp).
 */
export function lienWhatsApp(telephone: string): string | null {
  let n = chiffres(telephone);
  if (!n) return null;
  if (n.startsWith("0033")) n = `+33${n.slice(4)}`;
  if (/^\+330[67]\d{8}$/.test(n)) n = `+33${n.slice(4)}`;
  if (/^0[67]\d{8}$/.test(n)) return `https://wa.me/33${n.slice(1)}`;
  if (/^\+33[67]\d{8}$/.test(n)) return `https://wa.me/${n.slice(1)}`;
  return null;
}

/** `mailto:` avec l'objet « Votre demande — Spice Events » (ou anglais), ou null si l'adresse est douteuse. */
export function lienEcrire(email: string, langue: "fr" | "en" = "fr"): string | null {
  const e = email.trim();
  if (!/^[^\s@<>()[\]\\,;:"'?&#%/]+@[^\s@<>()[\]\\,;:"'?&#%/]+\.[^\s@<>()[\]\\,;:"'?&#%/]+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(OBJET_EMAIL[langue])}`;
}

/** « +33612345678 » → « 06 12 34 56 78 » ; les numéros étrangers restent au format international. */
export function telephoneAffiche(telephone: string): string {
  if (!/^\+33\d{9}$/.test(telephone)) return telephone;
  return `0${telephone.slice(3)}`.replace(/(\d{2})(?=\d)/g, "$1 ");
}

// --- Dates en français (heure de Paris) ------------------------------------------

const FUSEAU = "Europe/Paris";

function dateValide(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Réception : « 18 octobre 2026 à 16:05 » (heure de Paris). */
export function formaterReception(iso: string): string {
  const d = dateValide(iso);
  if (!d) return "—";
  const jour = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, day: "numeric", month: "long", year: "numeric" }).format(d);
  const heure = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return `${jour} à ${heure}`;
}

/** Réception, version courte de la liste : « 18 oct. 2026 ». */
export function formaterReceptionCourte(iso: string): string {
  const d = dateValide(iso);
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** Date de l'événement (AAAA-MM-JJ) : « samedi 12 juin 2027 », ou null. */
export function formaterDateEvenement(date: string | null, avecJour = true): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [a, m, j] = date.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j, 12));
  if (d.getUTCMonth() !== m - 1) return null;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...(avecJour ? { weekday: "long" } : {}), day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** « 120 invités », « 1 invité », ou null. */
export function formaterInvites(invites: number | null): string | null {
  if (invites === null || !Number.isFinite(invites)) return null;
  return `${invites.toLocaleString("fr-FR")} invité${invites > 1 ? "s" : ""}`;
}

/** Note trop longue pour la base ? (Compte comme Postgres : en caractères.) */
export function noteTropLongue(note: string): boolean {
  return Array.from(note.trim()).length > LIMITE_NOTE;
}

// --- Réponse de la Server Action (app/admin/(espace)/demandes/actions.ts) ------

export type ResultatSuivi = { ok: true; suivi: SuiviDemande } | { ok: false; message: string };
