"use server";

import { exigerAdmin } from "@/lib/admin/garde";
import { traiterChangement, type EtatMotDePasse } from "@/lib/admin/mot-de-passe";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public.
// Garde `exigerAdmin()` en tête, puis Zod (dans traiterChangement).

/** Nouveau mot de passe du compte connecté. */
export async function changerMotDePasse(entree: { nouveau: unknown; confirmation: unknown }): Promise<EtatMotDePasse> {
  const { supabase } = await exigerAdmin();
  return traiterChangement({ nouveau: entree?.nouveau, confirmation: entree?.confirmation }, async (motDePasse) => {
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    if (!error) return "ok";
    if (error.code === "same_password") return "identique";
    console.warn("[admin] Changement de mot de passe refusé :", error.code ?? error.message);
    return "refuse";
  });
}
