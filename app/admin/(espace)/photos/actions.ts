"use server";

import { randomBytes } from "node:crypto";
import { revalidateTag } from "next/cache";
import { exigerAdmin } from "@/lib/admin/garde";
import {
  estSupprimable,
  messageMinimum,
  ordreSuivant,
  rangsEchanges,
  sousLeMinimum,
  type ResultatAjout,
  type ResultatEchangePhotos,
  type ResultatEchec,
  type ResultatEnregistrement,
  type ResultatPhoto,
  type ResultatRetrait,
  type ResultatSuppressionPhoto,
  type ResultatUrlEnvoi,
} from "@/lib/photos/admin";
import { BUCKET_MEDIAS } from "@/lib/photos/constantes";
import { cheminEnvoi } from "@/lib/photos/envoi";
import { ETIQUETTE_GALERIES } from "@/lib/photos/lecture";
import {
  premiereErreurPhoto,
  schemaAjoutGalerie,
  schemaDemandeEnvoi,
  schemaEchangePhotos,
  schemaEnregistrement,
  schemaIdPhoto,
  schemaPhotoDansGalerie,
  validerChampsPhoto,
} from "@/lib/photos/schema";
import { COLONNES_LIAISON, COLONNES_PHOTO, type Liaison, type Photo } from "@/lib/photos/types";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public,
// appelable par n'importe qui avec n'importe quels arguments. Chaque export :
// `exigerAdmin()` en tête, puis Zod (lib/photos/schema.ts), écriture avec le
// client de SESSION (RLS et policies Storage : est_admin()) — jamais la clé
// service_role —, puis `revalidateTag("galeries")`.
//
// Aucun fichier ne transite par ici : le navigateur l'envoie directement à
// Storage avec l'URL signée de `creerUrlEnvoi` (limite de 4,5 Mo de Vercel).

type ErreurSupabase = { code?: string; message: string; statusCode?: string; status?: number };

/** Message clair pour Cédric (le détail technique part dans les journaux du serveur). */
function echec(action: string, e: ErreurSupabase): ResultatEchec {
  console.warn(`[admin] Photos — ${action} : ${e.code ?? e.statusCode ?? ""} ${e.message}`);
  if (e.code === "42501" || e.statusCode === "403" || e.status === 403) return { ok: false, message: "Droits refusés : reconnectez-vous puis réessayez." };
  if (e.code === "23514") return { ok: false, message: "La base a refusé la fiche : une valeur dépasse ses limites (texte, chemin, galerie)." };
  if (e.code === "23505") return { ok: false, message: "Cette photo est déjà enregistrée (ou déjà dans cette galerie). Rechargez la page." };
  return { ok: false, message: `${action} impossible : le serveur ne répond pas. Réessayez dans un instant.` };
}

const INTROUVABLE: ResultatEchec = { ok: false, message: "Photo introuvable : elle a peut-être été supprimée. Rechargez la page." };

function invalide(message: string | undefined): ResultatEchec {
  return { ok: false, message: message ?? "Demande invalide : rechargez la page puis réessayez." };
}

/** 1. URL signée pour envoyer UNE photo directement à Storage (valable 2 heures, pour ce seul chemin). */
export async function creerUrlEnvoi(entree: unknown): Promise<ResultatUrlEnvoi> {
  const { supabase } = await exigerAdmin();
  const v = schemaDemandeEnvoi.safeParse(entree);
  if (!v.success) return invalide(v.error.issues[0]?.message);
  const chemin = cheminEnvoi(v.data.type, new Date(), randomBytes(6).toString("hex"));
  const { data, error } = await supabase.storage.from(BUCKET_MEDIAS).createSignedUploadUrl(chemin);
  if (error || !data) return echec("Préparation de l'envoi", error ?? { message: "réponse vide" });
  return { ok: true, chemin: data.path, jeton: data.token };
}

/**
 * 2. Après l'envoi : enregistre la photo (métadonnées seules) et, si une galerie
 * est donnée, l'y ajoute en dernière position.
 */
export async function enregistrerPhoto(entree: unknown): Promise<ResultatEnregistrement> {
  const { supabase } = await exigerAdmin();
  const v = schemaEnregistrement.safeParse(entree);
  if (!v.success) {
    const champs = validerChampsPhoto(entree);
    if (!champs.ok) return { ok: false, message: premiereErreurPhoto(champs.erreurs), erreurs: champs.erreurs };
    return invalide(v.error.issues[0]?.message);
  }
  const { chemin, largeur, hauteur, alt_fr, alt_en, credit, galerie } = v.data;

  // Le fichier doit être arrivé dans le bucket : pas de photo qui pointe dans le vide.
  const present = await supabase.storage.from(BUCKET_MEDIAS).exists(chemin);
  if (present.data !== true) {
    if (present.error && present.error.status !== 400 && present.error.status !== 404) return echec("Vérification du fichier", present.error);
    return { ok: false, message: "Le fichier n'est pas arrivé dans le stockage : renvoyez la photo." };
  }

  const { data, error } = await supabase
    .from("photos")
    .insert({ origine: "stockage", chemin, largeur, hauteur, alt_fr, alt_en, credit })
    .select(COLONNES_PHOTO)
    .single();
  if (error) return echec("Enregistrement de la photo", error);
  const photo = data as Photo;

  let liaison: Liaison | null = null;
  let avertissement: string | undefined;
  if (galerie) {
    const r = await lierEnFin(supabase, galerie, [photo.id]);
    if (r.ok) liaison = r.liaisons[0] ?? null;
    else avertissement = `La photo est enregistrée dans la photothèque, mais n'a pas pu être ajoutée à la galerie : ajoutez-la depuis la photothèque. (${r.message})`;
  }
  revalidateTag(ETIQUETTE_GALERIES);
  return { ok: true, photo, liaison, ...(avertissement ? { avertissement } : {}) };
}

type Supabase = Awaited<ReturnType<typeof exigerAdmin>>["supabase"];

/** Ajoute des photos à la fin d'une galerie (dans l'ordre donné). */
async function lierEnFin(supabase: Supabase, galerie: string, photoIds: readonly string[]): Promise<ResultatAjout> {
  const { data: dernier, error: erreurOrdre } = await supabase.from("galeries_photos").select("ordre").eq("galerie", galerie).order("ordre", { ascending: false }).limit(1);
  if (erreurOrdre) return echec("Ajout à la galerie", erreurOrdre);
  const depart = ordreSuivant((dernier ?? []).map((l) => Number(l.ordre)));
  const lignes = photoIds.map((photo_id, i) => ({ galerie, photo_id, ordre: depart + i * 10 }));
  const { data, error } = await supabase.from("galeries_photos").insert(lignes).select(COLONNES_LIAISON);
  if (error) return echec("Ajout à la galerie", error);
  return { ok: true, liaisons: (data ?? []) as Liaison[] };
}

/** Enregistrement automatique de la fiche d'une photo (textes alternatifs, crédit). */
export async function modifierPhoto(id: unknown, champs: unknown): Promise<ResultatPhoto> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdPhoto.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const v = validerChampsPhoto(champs);
  if (!v.ok) return { ok: false, message: premiereErreurPhoto(v.erreurs), erreurs: v.erreurs };
  const { data, error } = await supabase.from("photos").update(v.champs).eq("id", idValide.data).select(COLONNES_PHOTO).maybeSingle();
  if (error) return echec("Enregistrement", error);
  if (!data) return INTROUVABLE;
  revalidateTag(ETIQUETTE_GALERIES);
  return { ok: true, photo: data as Photo };
}

/** Ajoute des photos de la photothèque à la fin d'une galerie (celles qui y sont déjà sont ignorées). */
export async function ajouterAGalerie(entree: unknown): Promise<ResultatAjout> {
  const { supabase } = await exigerAdmin();
  const v = schemaAjoutGalerie.safeParse(entree);
  if (!v.success) return invalide(v.error.issues[0]?.message);
  const { galerie, photoIds } = v.data;
  const { data: deja, error } = await supabase.from("galeries_photos").select("photo_id").eq("galerie", galerie).in("photo_id", photoIds);
  if (error) return echec("Ajout à la galerie", error);
  const presentes = new Set((deja ?? []).map((l) => String(l.photo_id)));
  const nouvelles = photoIds.filter((id) => !presentes.has(id));
  if (nouvelles.length === 0) return { ok: true, liaisons: [] };
  const r = await lierEnFin(supabase, galerie, nouvelles);
  if (r.ok) revalidateTag(ETIQUETTE_GALERIES);
  return r;
}

/** Retire une photo d'une galerie (confirmé dans l'interface) : la photo reste dans la photothèque. */
export async function retirerDeGalerie(entree: unknown): Promise<ResultatRetrait> {
  const { supabase } = await exigerAdmin();
  const v = schemaPhotoDansGalerie.safeParse(entree);
  if (!v.success) return INTROUVABLE;
  const { galerie, photoId } = v.data;
  const { data, error } = await supabase.from("galeries_photos").delete().eq("galerie", galerie).eq("photo_id", photoId).select("photo_id");
  if (error) return echec("Retrait de la galerie", error);
  if (!data || data.length === 0) return { ok: false, message: "Cette photo n'est déjà plus dans la galerie. Rechargez la page." };
  revalidateTag(ETIQUETTE_GALERIES);

  const { count, error: erreurCompte } = await supabase.from("galeries_photos").select("photo_id", { count: "exact", head: true }).eq("galerie", galerie);
  if (erreurCompte || typeof count !== "number") return { ok: true, galerie, photoId, restantes: -1 };
  return { ok: true, galerie, photoId, restantes: count, ...(sousLeMinimum(galerie, count) ? { avertissement: messageMinimum(galerie, count) } : {}) };
}

/** Monter / descendre : échange le rang de deux photos voisines d'une galerie. */
export async function echangerOrdrePhotos(entree: unknown): Promise<ResultatEchangePhotos> {
  const { supabase } = await exigerAdmin();
  const v = schemaEchangePhotos.safeParse(entree);
  if (!v.success) return INTROUVABLE;
  const { galerie, photoId, avecId, sens } = v.data;

  const { data, error } = await supabase.from("galeries_photos").select("photo_id, ordre").eq("galerie", galerie).in("photo_id", [photoId, avecId]);
  if (error) return echec("Changement d'ordre", error);
  const a = data?.find((l) => l.photo_id === photoId);
  const b = data?.find((l) => l.photo_id === avecId);
  if (!a || !b) return INTROUVABLE;

  const rangs = rangsEchanges(a, b, sens === "monter");
  for (const [cible, ordre] of [[photoId, rangs.a], [avecId, rangs.b]] as const) {
    const { error: e } = await supabase.from("galeries_photos").update({ ordre }).eq("galerie", galerie).eq("photo_id", cible);
    if (e) {
      revalidateTag(ETIQUETTE_GALERIES);
      return { ...echec("Changement d'ordre", e), message: "Changement d'ordre interrompu : rechargez la page pour voir l'ordre réel." };
    }
  }
  revalidateTag(ETIQUETTE_GALERIES);
  return { ok: true, rangs: [{ photoId, ordre: rangs.a }, { photoId: avecId, ordre: rangs.b }] };
}

/**
 * Suppression définitive d'une photo ENVOYÉE (confirmée dans l'interface) :
 * le fichier du bucket d'abord, puis la ligne (ses liaisons partent avec elle).
 * Une photo du site (fichier livré avec le code) ne se supprime pas.
 */
export async function supprimerPhoto(id: unknown): Promise<ResultatSuppressionPhoto> {
  const { supabase } = await exigerAdmin();
  const v = schemaIdPhoto.safeParse(id);
  if (!v.success) return INTROUVABLE;
  const { data: photo, error } = await supabase.from("photos").select("id, origine, chemin").eq("id", v.data).maybeSingle();
  if (error) return echec("Suppression", error);
  if (!photo) return INTROUVABLE;
  if (!estSupprimable(photo)) {
    return { ok: false, message: "Cette photo fait partie des fichiers du site : elle ne peut pas être supprimée, seulement retirée des galeries." };
  }

  const { error: erreurFichier } = await supabase.storage.from(BUCKET_MEDIAS).remove([photo.chemin]);
  if (erreurFichier) return echec("Suppression du fichier", erreurFichier);
  const { data: supprimees, error: erreurLigne } = await supabase.from("photos").delete().eq("id", v.data).select("id");
  revalidateTag(ETIQUETTE_GALERIES);
  if (erreurLigne) return { ...echec("Suppression", erreurLigne), message: "Le fichier est supprimé, mais pas la fiche de la photo : réessayez la suppression." };
  if (!supprimees || supprimees.length === 0) return INTROUVABLE;
  return { ok: true, id: v.data };
}
