"use server";

import { randomBytes } from "node:crypto";
import { revalidateTag } from "next/cache";
import { exigerAdmin } from "@/lib/admin/garde";
import {
  cheminEnvoiMembre,
  ordreSuivant,
  rangsEchanges,
  type ResultatEchangeMembres,
  type ResultatEchecMembre,
  type ResultatMembre,
  type ResultatSuppressionMembre,
  type ResultatUrlEnvoiMembre,
} from "@/lib/equipe/admin";
import { ETIQUETTE_EQUIPE } from "@/lib/equipe/lecture";
import { premiereErreurMembre, schemaEchangeMembres, schemaIdMembre, schemaPublicationMembre, validerChampsMembre } from "@/lib/equipe/schema";
import { COLONNES_EQUIPE, type MembreEquipe } from "@/lib/equipe/types";
import { BUCKET_MEDIAS } from "@/lib/photos/constantes";
import { schemaDemandeEnvoi } from "@/lib/photos/schema";

// ⚠️ Fichier « use server » : chaque export est un point d’entrée HTTP public,
// appelable par n’importe qui avec n’importe quels arguments. Chaque export :
// `exigerAdmin()` en tête, puis Zod (lib/equipe/schema.ts), écriture avec le
// client de SESSION (RLS et policies Storage : est_admin()) — jamais la clé
// service_role —, puis `revalidateTag("equipe")` : la page Nos DJ se régénère
// à la visite suivante. Aucune photo ne transite par ici : le navigateur
// l’envoie directement à Storage avec l’URL signée de `creerUrlEnvoiMembre`.

type ErreurSupabase = { code?: string; message: string; statusCode?: string; status?: number };

/** Message clair pour Cédric (le détail technique part dans les journaux du serveur). */
function echec(action: string, e: ErreurSupabase): ResultatEchecMembre {
  console.warn(`[admin] DJ — ${action} : ${e.code ?? e.statusCode ?? ""} ${e.message}`);
  if (e.code === "42501" || e.statusCode === "403" || e.status === 403) return { ok: false, message: "Droits refusés par la base : reconnectez-vous puis réessayez." };
  if (e.code === "23514") return { ok: false, message: "La base a refusé la fiche : une valeur dépasse ses limites (longueur, lien, photo)." };
  return { ok: false, message: `${action} impossible : la base ne répond pas. Réessayez dans un instant.` };
}

const INTROUVABLE: ResultatEchecMembre = { ok: false, message: "Fiche introuvable : elle a peut-être été supprimée. Rechargez la page." };

/** Enregistrement automatique de la modale d’édition (tous les champs du formulaire). */
export async function enregistrerMembre(id: unknown, champs: unknown): Promise<ResultatMembre> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdMembre.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const v = validerChampsMembre(champs);
  if (!v.ok) return { ok: false, message: premiereErreurMembre(v.erreurs), erreurs: v.erreurs };

  const { data, error } = await supabase.from("equipe").update(v.champs).eq("id", idValide.data).select(COLONNES_EQUIPE).maybeSingle();
  if (error) return echec("Enregistrement", error);
  if (!data) return INTROUVABLE;
  revalidateTag(ETIQUETTE_EQUIPE);
  return { ok: true, membre: data as MembreEquipe };
}

/** Création (bouton « Créer » de la modale) : toujours NON publiée, à la fin de la liste. */
export async function creerMembre(champs: unknown): Promise<ResultatMembre> {
  const { supabase } = await exigerAdmin();
  const v = validerChampsMembre(champs);
  if (!v.ok) return { ok: false, message: premiereErreurMembre(v.erreurs), erreurs: v.erreurs };

  const { data: dernier, error: erreurOrdre } = await supabase.from("equipe").select("ordre").order("ordre", { ascending: false }).limit(1);
  if (erreurOrdre) return echec("Création", erreurOrdre);
  const ordre = ordreSuivant((dernier ?? []).map((l) => Number(l.ordre)));

  const { data, error } = await supabase
    .from("equipe")
    .insert({ ...v.champs, publie: false, ordre })
    .select(COLONNES_EQUIPE)
    .single();
  if (error) return echec("Création", error);
  revalidateTag(ETIQUETTE_EQUIPE);
  return { ok: true, membre: data as MembreEquipe };
}

/** Publier sur la page Nos DJ ou l’en retirer (confirmé dans l’interface). */
export async function changerPublicationMembre(entree: unknown): Promise<ResultatMembre> {
  const { supabase } = await exigerAdmin();
  const v = schemaPublicationMembre.safeParse(entree);
  if (!v.success) return INTROUVABLE;
  const { data, error } = await supabase.from("equipe").update({ publie: v.data.publie }).eq("id", v.data.id).select(COLONNES_EQUIPE).maybeSingle();
  if (error) return echec(v.data.publie ? "Publication" : "Retrait du site", error);
  if (!data) return INTROUVABLE;
  revalidateTag(ETIQUETTE_EQUIPE);
  return { ok: true, membre: data as MembreEquipe };
}

/** Suppression définitive (confirmée dans l’interface ; l’historique reste dans audit_log). */
export async function supprimerMembre(id: unknown): Promise<ResultatSuppressionMembre> {
  const { supabase } = await exigerAdmin();
  const v = schemaIdMembre.safeParse(id);
  if (!v.success) return INTROUVABLE;
  const { data, error } = await supabase.from("equipe").delete().eq("id", v.data).select("id");
  if (error) return echec("Suppression", error);
  if (!data || data.length === 0) return INTROUVABLE;
  revalidateTag(ETIQUETTE_EQUIPE);
  return { ok: true, id: v.data };
}

/** Monter / descendre : échange le rang de deux membres voisins. */
export async function echangerOrdreMembres(entree: unknown): Promise<ResultatEchangeMembres> {
  const { supabase } = await exigerAdmin();
  const v = schemaEchangeMembres.safeParse(entree);
  if (!v.success) return INTROUVABLE;
  const { id, avecId, sens } = v.data;

  const { data, error } = await supabase.from("equipe").select("id, ordre").in("id", [id, avecId]);
  if (error) return echec("Changement d’ordre", error);
  const a = data?.find((l) => l.id === id);
  const b = data?.find((l) => l.id === avecId);
  if (!a || !b) return INTROUVABLE;

  const rangs = rangsEchanges(a, b, sens === "monter");
  for (const [cible, ordre] of [[id, rangs.a], [avecId, rangs.b]] as const) {
    const { error: e } = await supabase.from("equipe").update({ ordre }).eq("id", cible);
    if (e) {
      revalidateTag(ETIQUETTE_EQUIPE);
      return { ...echec("Changement d’ordre", e), message: "Changement d’ordre interrompu : rechargez la page pour voir l’ordre réel." };
    }
  }
  revalidateTag(ETIQUETTE_EQUIPE);
  return { ok: true, rangs: [{ id, ordre: rangs.a }, { id: avecId, ordre: rangs.b }] };
}

/** URL signée pour envoyer UN portrait directement à Storage, sous `equipe/<aaaa>/<mm>/…`. */
export async function creerUrlEnvoiMembre(entree: unknown): Promise<ResultatUrlEnvoiMembre> {
  const { supabase } = await exigerAdmin();
  const v = schemaDemandeEnvoi.safeParse(entree);
  if (!v.success) return { ok: false, message: v.error.issues[0]?.message ?? "Demande invalide : rechargez la page puis réessayez." };
  const chemin = cheminEnvoiMembre(v.data.type, new Date(), randomBytes(6).toString("hex"));
  const { data, error } = await supabase.storage.from(BUCKET_MEDIAS).createSignedUploadUrl(chemin);
  if (error || !data) return echec("Préparation de l’envoi", error ?? { message: "réponse vide" });
  return { ok: true, chemin: data.path, jeton: data.token };
}
