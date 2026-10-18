import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientAdmin } from "@/lib/supabase/admin";
import { clientPublic } from "@/lib/supabase/public";
import type { ClientAudit, DependancesAudit, ReponseApi } from "./audit-rls";

/**
 * Branchement de l'audit RLS (lib/admin/audit-rls.ts) sur les vrais clients
 * Supabase. Seuls des comptes, des booléens et des codes d'erreur remontent :
 * aucune donnée des tables n'est lue ni renvoyée au navigateur.
 */

type ErreurSupabase = { code?: string; message: string } | null;

function erreur(e: ErreurSupabase): ReponseApi["erreur"] {
  return e ? { code: e.code || undefined, message: e.message } : null;
}

type ErreurStockage = { message: string; status?: number; statusCode?: string } | null;

/**
 * Erreur de Storage : un refus de droits (policy RLS de storage.objects, HTTP
 * 401/403 ou « row-level security ») devient `STORAGE-403` ; tout le reste
 * (réseau, bucket introuvable, fichier déjà présent…) reste inattendu.
 */
export function erreurStockage(e: ErreurStockage): ReponseApi["erreur"] {
  if (!e) return null;
  const refus = e.status === 401 || e.status === 403 || e.statusCode === "401" || e.statusCode === "403" || /row-level security/i.test(e.message);
  return { code: refus ? "STORAGE-403" : e.statusCode || undefined, message: e.message };
}

/** Adaptateur d'un client Supabase (visiteur ou session admin) aux opérations de l'audit. */
export function clientAudit(supabase: SupabaseClient): ClientAudit {
  return {
    async select(table, filtre = {}) {
      // `limit(0)` + compte exact : le nombre de lignes visibles, sans en lire aucune.
      // (Pas de requête HEAD : en erreur, elle n'a pas de corps, donc pas de code.)
      const { error, count } = await supabase.from(table).select("*", { count: "exact" }).match(filtre).limit(0);
      if (error) return { erreur: erreur(error) };
      if (typeof count === "number") return { erreur: null, lignes: count };
      // Compte absent : on regarde s'il existe au moins une ligne visible plutôt que de conclure « vide ».
      const repli = await supabase.from(table).select("*").match(filtre).limit(1);
      if (repli.error) return { erreur: erreur(repli.error) };
      return { erreur: null, lignes: Array.isArray(repli.data) ? repli.data.length : 0 };
    },
    async insert(table, ligne) {
      // `select("id")` : en cas de faille, l'identifiant permet d'effacer la ligne aussitôt.
      const { data, error } = await supabase.from(table).insert(ligne).select("id");
      if (error) return { erreur: erreur(error) };
      const id = Array.isArray(data) && data[0] && "id" in data[0] ? String(data[0].id) : null;
      return { erreur: null, id };
    },
    async update(table, valeurs, id) {
      const { error } = await supabase.from(table).update(valeurs).eq("id", id);
      return { erreur: erreur(error) };
    },
    async delete(table, id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      return { erreur: erreur(error) };
    },
    async rpc(fonction) {
      const { data, error } = await supabase.rpc(fonction);
      if (error) return { erreur: erreur(error) };
      return { erreur: null, valeur: data };
    },
    async upload(bucket, chemin, contenu, type) {
      // Jamais d'écrasement : un fichier déjà présent répond par une erreur (inattendue), pas par un succès.
      const { data, error } = await supabase.storage.from(bucket).upload(chemin, contenu, { contentType: type, upsert: false });
      if (error) return { erreur: erreurStockage(error) };
      return { erreur: null, id: data?.path ?? chemin };
    },
    async list(bucket) {
      // Seul le nombre d'éléments remonte, jamais leurs noms.
      const { data, error } = await supabase.storage.from(bucket).list("", { limit: 100 });
      if (error) return { erreur: erreurStockage(error) };
      return { erreur: null, lignes: Array.isArray(data) ? data.length : 0 };
    },
  };
}

/** Dépendances réelles de l'audit ; `sessionAdmin` = client de `exigerAdmin()`. */
export function dependancesAudit(sessionAdmin: SupabaseClient): DependancesAudit {
  const service = clientAdmin();
  return {
    clients: { visiteur: clientAudit(clientPublic()), admin: clientAudit(sessionAdmin) },
    nettoyer: service
      ? async (table, id) => {
          const { error } = await service.from(table).delete().eq("id", id);
          if (error) throw new Error(error.message);
        }
      : null,
    nettoyerFichier: service
      ? async (bucket, chemin) => {
          const { error } = await service.storage.from(bucket).remove([chemin]);
          if (error) throw new Error(error.message);
        }
      : null,
  };
}
