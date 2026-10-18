"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { clientAdmin } from "@/lib/supabase/admin";
import { clientServeur } from "@/lib/supabase/server";
import { ipDepuisEntetes } from "@/lib/contact/limite";
import { traiterConnexion, type EtatConnexion, type MagasinTentatives } from "@/lib/admin/connexion";
import { lireConnexion } from "@/lib/admin/schema";
import { CHEMIN_CONNEXION, aCookieSession, cheminDeRetour } from "@/lib/admin/session";
import { nomCookieSession } from "@/lib/supabase/config";
import type { Journal } from "@/lib/contact/traitement";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public.
// Ce sont les deux seules actions admin SANS garde `exigerAdmin()`, par nature :
// - `seConnecter` est la porte d'entrée (validation Zod, limite des tentatives,
//   durée minimale, vérification de `est_admin()` — logique dans lib/admin/) ;
// - `seDeconnecter` ne prend aucun argument et ne ferme que la session de
//   l'appelant, sur son seul appareil.
// Toute autre action admin commence par `await exigerAdmin()` puis Zod.

const TABLE = "tentatives_connexion";

/** Compteurs de tentatives via la clé service_role (null sans clé : développement local). */
function tentatives(): MagasinTentatives | null {
  const supabase = clientAdmin();
  if (!supabase) return null;
  return {
    async compter(type, empreinte, depuis) {
      const { count, error } = await supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("type", type)
        .eq("empreinte", empreinte)
        .gte("created_at", depuis.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    async enregistrer(type, empreinte) {
      const { error } = await supabase.from(TABLE).insert({ type, empreinte });
      if (error) throw error;
    },
  };
}

const journal: Journal = {
  info: (message, details) => (details === undefined ? console.info(message) : console.info(message, details)),
  avertir: (message, details) => (details === undefined ? console.warn(message) : console.warn(message, details)),
  erreur: (message, details) => (details === undefined ? console.error(message) : console.error(message, details)),
};

/** Connexion par email + mot de passe (utilisée avec `useActionState`). */
export async function seConnecter(_etat: EtatConnexion, formulaire: FormData): Promise<EtatConnexion> {
  const entetes = await headers();
  const supabase = await clientServeur();

  const etat = await traiterConnexion(lireConnexion(formulaire), {
    production: process.env.NODE_ENV === "production",
    ip: ipDepuisEntetes(entetes.get("x-forwarded-for")),
    secret: process.env.contact_secret_ip || null,
    tentatives: tentatives(),
    auth: {
      async verifierMotDePasse(email, motDePasse) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (!error) return "ok";
        if (isAuthRetryableFetchError(error) || error.status === 429 || (error.status ?? 0) >= 500) return "indisponible";
        return "refuse";
      },
      async estAdmin() {
        const { data, error } = await supabase.rpc("est_admin");
        if (error) throw error;
        return data === true;
      },
      async deconnecterLocalement() {
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) throw error;
      },
    },
    maintenant: () => Date.now(),
    attendre: (ms) => new Promise((resoudre) => setTimeout(resoudre, ms)),
    journal,
  });

  if (etat.statut === "connecte") redirect(cheminDeRetour(formulaire.get("suite")));
  return etat;
}

/**
 * Déconnexion de CET appareil seulement. ⚠️ Jamais `signOut()` sans argument :
 * son défaut (`global`) fermerait la session sur tous les appareils de Cédric.
 */
export async function seDeconnecter(): Promise<void> {
  const supabase = await clientServeur();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    // Supabase injoignable : la session n'a pas pu être révoquée côté serveur,
    // mais cet appareil l'oublie quand même (les cookies sont effacés).
    journal.avertir("[admin] Déconnexion : révocation impossible, cookies effacés localement.", error);
    const magasin = await cookies();
    const nom = nomCookieSession();
    for (const { name } of magasin.getAll()) if (aCookieSession([name], nom)) magasin.delete(name);
  }
  redirect(`${CHEMIN_CONNEXION}?raison=deconnecte`);
}
