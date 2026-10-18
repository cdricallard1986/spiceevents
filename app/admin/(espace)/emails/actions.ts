"use server";

import { exigerAdmin } from "@/lib/admin/garde";
import { creerLimiteur, traiterEnvoiTest, type EtatEnvoiTest } from "@/lib/admin/emails-test";
import { expediteurResend } from "@/lib/contact/resend";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public.
// Garde `exigerAdmin()` en tête, puis Zod (`schemaEnvoiTest`, dans
// traiterEnvoiTest) ; la logique vit dans lib/admin/emails-test.ts.

/** Un envoi toutes les 10 s par compte (mémoire de l'instance : garde-fou contre le double clic). */
const limiteur = creerLimiteur();

/**
 * Envoie un vrai email du formulaire (demande fictive, objet « [TEST] ») au
 * compte connecté, et à lui seul : l'adresse vient de la session, jamais de
 * l'appelant.
 */
export async function envoyerEmailTest(entree: unknown): Promise<EtatEnvoiTest> {
  const { utilisateur } = await exigerAdmin();
  const etat = await traiterEnvoiTest(entree, {
    destinataire: utilisateur.email,
    cle: utilisateur.id,
    expediteur: expediteurResend(),
    limiteur,
    maintenant: new Date(),
  });
  if (etat.statut === "erreur") console.warn(`[admin] Email de test non envoyé : ${etat.message}`);
  return etat;
}
