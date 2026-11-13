"use server";

import { exigerAdmin } from "@/lib/admin/garde";
import { traiterChangement, type EtatMotDePasse } from "@/lib/admin/mot-de-passe";

// ⚠️ Fichier « use server » : chaque export est un point d’entrée HTTP public.
// Garde `exigerAdmin()` en tête, puis Zod (dans traiterChangement).

/**
 * Nouveau mot de passe du compte connecté. Règle de Cédric : après le
 * changement, tous les AUTRES appareils sont déconnectés (une session volée
 * ne survit pas au changement) ; celui-ci reste connecté.
 */
export async function changerMotDePasse(entree: { nouveau: unknown; confirmation: unknown }): Promise<EtatMotDePasse> {
  const { supabase } = await exigerAdmin();
  return traiterChangement({ nouveau: entree?.nouveau, confirmation: entree?.confirmation }, async (motDePasse) => {
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    if (!error) {
      const { error: erreurDeconnexion } = await supabase.auth.signOut({ scope: "others" });
      if (erreurDeconnexion) console.warn("[admin] Déconnexion des autres appareils impossible :", erreurDeconnexion.code ?? erreurDeconnexion.message);
      return "ok";
    }
    if (error.code === "same_password") return "identique";
    if (error.code === "weak_password") return "faible";
    if (error.code === "reauthentication_needed" || error.code === "reauthentication_not_valid") return "reconnexion";
    console.warn("[admin] Changement de mot de passe refusé :", error.code ?? error.message);
    return "refuse";
  });
}
