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
  };
}
