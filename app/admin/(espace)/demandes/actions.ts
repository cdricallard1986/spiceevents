"use server";

import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/admin/garde";
import type { ResultatSuivi } from "@/lib/demandes/admin";
import { validerSuivi } from "@/lib/demandes/schema";
import { COLONNES_SUIVI, type SuiviDemande } from "@/lib/demandes/types";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public,
// appelable par n'importe qui avec n'importe quels arguments. Ici une seule
// action : `exigerAdmin()` en tête, puis Zod (lib/demandes/schema.ts), écriture
// avec le client de SESSION (RLS : est_admin(), droit `update` limité aux
// colonnes statut et note_interne) — jamais la clé service_role.
// Pas de suppression : la purge RGPD sera une tâche planifiée.

/** Enregistrement automatique de la fiche d'une demande : statut et/ou note interne. */
export async function enregistrerSuiviDemande(entree: unknown): Promise<ResultatSuivi> {
  const { supabase } = await exigerAdmin();
  const v = validerSuivi(entree);
  if (!v.ok) return { ok: false, message: v.message };

  const { data, error } = await supabase.from("demandes_contact").update(v.champs).eq("id", v.id).select(COLONNES_SUIVI).maybeSingle();
  if (error) {
    // Le code seulement : aucune donnée de la demande dans les journaux.
    console.warn(`[admin] Demandes — enregistrement du suivi : ${error.code ?? ""} ${error.message}`);
    if (error.code === "42501") return { ok: false, message: "Droits refusés par la base : reconnectez-vous puis réessayez." };
    if (error.code === "23514") return { ok: false, message: "La base a refusé le suivi : la note dépasse 5 000 caractères ou le statut est inconnu." };
    return { ok: false, message: "Enregistrement impossible : la base ne répond pas. Réessayez dans un instant." };
  }
  if (!data) return { ok: false, message: "Demande introuvable : rechargez la page." };
  revalidatePath("/admin/demandes");
  return { ok: true, suivi: data as SuiviDemande };
}
