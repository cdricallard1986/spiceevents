"use server";

import { z } from "zod";
import { exigerAdmin } from "@/lib/admin/garde";
import { lancerAudit, type ResultatAudit } from "@/lib/admin/audit-rls";
import { dependancesAudit } from "@/lib/admin/audit-rls-serveur";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public.
// Garde `exigerAdmin()` en tête, puis Zod ; la logique vit dans lib/admin/audit-rls.ts.

/** Aucun argument accepté : la liste des vérifications est fixée par le code, jamais par l'appelant. */
const schemaAudit = z.tuple([]);

/** Lance l'audit des droits en base (visiteur + session admin). */
export async function lancerAuditRls(...args: unknown[]): Promise<ResultatAudit> {
  const { supabase } = await exigerAdmin();
  schemaAudit.parse(args);
  const audit = await lancerAudit(dependancesAudit(supabase));
  if (audit.resultats.some((r) => r.faille)) {
    console.error("[admin] Audit RLS : FAILLE détectée.", audit.resultats.filter((r) => r.faille).map((r) => `${r.verification.role} ${r.verification.operation} ${r.verification.cible}`));
  }
  return audit;
}
