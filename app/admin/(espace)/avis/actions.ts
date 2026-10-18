"use server";

import { revalidateTag } from "next/cache";
import { exigerAdmin, type ContexteAdmin } from "@/lib/admin/garde";
import { emplacementsUniques, ordreSuivant, rangsEchanges, retraitsNecessaires, type ResultatAvis, type ResultatEchange, type ResultatEchec, type ResultatPublication, type ResultatSuppression, type Retrait } from "@/lib/avis/admin";
import { ETIQUETTE_AVIS } from "@/lib/avis/lecture";
import { premiereErreur, schemaEchange, schemaIdAvis, schemaPublication, validerChampsAvis } from "@/lib/avis/schema";
import { COLONNES_AVIS, type Avis } from "@/lib/avis/types";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public,
// appelable par n'importe qui avec n'importe quels arguments. Chaque export :
// `exigerAdmin()` en tête, puis Zod (lib/avis/schema.ts), écriture avec le
// client de SESSION (RLS : est_admin()) — jamais la clé service_role —, puis
// `revalidateTag("avis")` : les pages publiques se régénèrent à la visite suivante.

type Supabase = ContexteAdmin["supabase"];
type ErreurSupabase = { code?: string; message: string };

/** Message clair pour Cédric (le détail technique part dans les journaux du serveur). */
function echec(action: string, e: ErreurSupabase): ResultatEchec {
  console.warn(`[admin] Avis — ${action} : ${e.code ?? ""} ${e.message}`);
  if (e.code === "42501") return { ok: false, message: "Droits refusés par la base : reconnectez-vous puis réessayez." };
  if (e.code === "23514") return { ok: false, message: "La base a refusé la fiche : une valeur dépasse ses limites (longueur, lien, emplacement)." };
  return { ok: false, message: `${action} impossible : la base ne répond pas. Réessayez dans un instant.` };
}

const INTROUVABLE: ResultatEchec = { ok: false, message: "Avis introuvable : il a peut-être été supprimé. Rechargez la page." };

/**
 * Un emplacement unique (grand avis, page d'option) n'appartient qu'à un avis :
 * on le retire aux autres avis qui l'avaient. Appelé APRÈS l'écriture de l'avis
 * (un échec laisse au pire deux titulaires — le site affiche le premier —,
 * jamais aucun).
 */
async function libererEmplacements(supabase: Supabase, id: string, emplacements: readonly string[]): Promise<{ retraits: Retrait[]; avertissement?: string }> {
  const uniques = emplacementsUniques(emplacements);
  if (uniques.length === 0) return { retraits: [] };
  const { data: autres, error } = await supabase.from("avis").select("id, auteurs, emplacements").overlaps("emplacements", uniques).neq("id", id);
  const avertissement = "L'avis est enregistré, mais l'emplacement n'a pas pu être retiré à l'avis qui l'avait : décochez-le à la main.";
  if (error) {
    console.warn(`[admin] Avis — retrait des emplacements uniques : ${error.code ?? ""} ${error.message}`);
    return { retraits: [], avertissement };
  }
  const retraits = retraitsNecessaires(id, emplacements, (autres ?? []) as Pick<Avis, "id" | "auteurs" | "emplacements">[]);
  const parAvis = new Map(retraits.map((r) => [r.id, r.emplacements]));
  const faits: Retrait[] = [];
  for (const [autreId, restants] of parAvis) {
    const { error: e } = await supabase.from("avis").update({ emplacements: restants }).eq("id", autreId);
    if (e) {
      console.warn(`[admin] Avis — retrait d'emplacement sur ${autreId} : ${e.code ?? ""} ${e.message}`);
      return { retraits: faits, avertissement };
    }
    faits.push(...retraits.filter((r) => r.id === autreId));
  }
  return { retraits: faits };
}

/** Enregistrement automatique de la modale d'édition (tous les champs du formulaire). */
export async function enregistrerAvis(id: unknown, champs: unknown): Promise<ResultatAvis> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdAvis.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const v = validerChampsAvis(champs);
  if (!v.ok) return { ok: false, message: premiereErreur(v.erreurs), erreurs: v.erreurs };

  const { data, error } = await supabase.from("avis").update(v.champs).eq("id", idValide.data).select(COLONNES_AVIS).maybeSingle();
  if (error) return echec("Enregistrement", error);
  if (!data) return INTROUVABLE;
  const { retraits, avertissement } = await libererEmplacements(supabase, idValide.data, v.champs.emplacements);
  revalidateTag(ETIQUETTE_AVIS);
  return { ok: true, avis: data as Avis, retraits, ...(avertissement ? { avertissement } : {}) };
}

/** Création (bouton « Créer » de la modale) : toujours NON publié, à la fin de la liste. */
export async function creerAvis(champs: unknown): Promise<ResultatAvis> {
  const { supabase } = await exigerAdmin();
  const v = validerChampsAvis(champs);
  if (!v.ok) return { ok: false, message: premiereErreur(v.erreurs), erreurs: v.erreurs };

  const { data: dernier, error: erreurOrdre } = await supabase.from("avis").select("ordre").order("ordre", { ascending: false }).limit(1);
  if (erreurOrdre) return echec("Création", erreurOrdre);
  const ordre = ordreSuivant((dernier ?? []).map((l) => Number(l.ordre)));

  const { data, error } = await supabase
    .from("avis")
    .insert({ ...v.champs, publie: false, ordre })
    .select(COLONNES_AVIS)
    .single();
  if (error) return echec("Création", error);
  const avis = data as Avis;
  const { retraits, avertissement } = await libererEmplacements(supabase, avis.id, v.champs.emplacements);
  revalidateTag(ETIQUETTE_AVIS);
  return { ok: true, avis, retraits, ...(avertissement ? { avertissement } : {}) };
}

/** Publier ou retirer du site (confirmé dans l'interface). */
export async function changerPublication(entree: unknown): Promise<ResultatPublication> {
  const { supabase } = await exigerAdmin();
  const v = schemaPublication.safeParse(entree);
  if (!v.success) return INTROUVABLE;
  const { data, error } = await supabase.from("avis").update({ publie: v.data.publie }).eq("id", v.data.id).select(COLONNES_AVIS).maybeSingle();
  if (error) return echec(v.data.publie ? "Publication" : "Retrait du site", error);
  if (!data) return INTROUVABLE;
  revalidateTag(ETIQUETTE_AVIS);
  return { ok: true, avis: data as Avis };
}

/** Suppression définitive (confirmée dans l'interface ; l'historique reste dans audit_log). */
export async function supprimerAvis(id: unknown): Promise<ResultatSuppression> {
  const { supabase } = await exigerAdmin();
  const v = schemaIdAvis.safeParse(id);
  if (!v.success) return INTROUVABLE;
  const { data, error } = await supabase.from("avis").delete().eq("id", v.data).select("id");
  if (error) return echec("Suppression", error);
  if (!data || data.length === 0) return INTROUVABLE;
  revalidateTag(ETIQUETTE_AVIS);
  return { ok: true, id: v.data };
}

/** Monter / descendre : échange le rang de deux avis voisins dans la liste affichée. */
export async function echangerOrdre(entree: unknown): Promise<ResultatEchange> {
  const { supabase } = await exigerAdmin();
  const v = schemaEchange.safeParse(entree);
  if (!v.success) return INTROUVABLE;
  const { id, avecId, sens } = v.data;

  const { data, error } = await supabase.from("avis").select("id, ordre").in("id", [id, avecId]);
  if (error) return echec("Changement d'ordre", error);
  const a = data?.find((l) => l.id === id);
  const b = data?.find((l) => l.id === avecId);
  if (!a || !b) return INTROUVABLE;

  const rangs = rangsEchanges(a, b, sens === "monter");
  for (const [cible, ordre] of [[id, rangs.a], [avecId, rangs.b]] as const) {
    const { error: e } = await supabase.from("avis").update({ ordre }).eq("id", cible);
    if (e) {
      revalidateTag(ETIQUETTE_AVIS);
      return { ...echec("Changement d'ordre", e), message: "Changement d'ordre interrompu : rechargez la page pour voir l'ordre réel." };
    }
  }
  revalidateTag(ETIQUETTE_AVIS);
  return { ok: true, rangs: [{ id, ordre: rangs.a }, { id: avecId, ordre: rangs.b }] };
}
