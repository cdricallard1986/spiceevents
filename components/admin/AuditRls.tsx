"use client";

import type { ResultatAudit, ResultatVerification, Role } from "@/lib/admin/audit-rls";
import type { Suite } from "@/hooks/useSuite";
import { CommandesSuite } from "./CommandesSuite";

const ROLES: Record<Role, { titre: string; description: string }> = {
  visiteur: { titre: "Visiteur", description: "Clé publique, sans session : ce que n'importe qui peut tenter depuis Internet." },
  admin: { titre: "Cédric", description: "Votre session : les droits du back office." },
};

const OPERATIONS = { select: "lecture", insert: "écriture", update: "modification", delete: "suppression", rpc: "appel", upload: "envoi dans", list: "liste de" } as const;

/**
 * Audit des droits en base : le résultat ligne par ligne (vert : conforme,
 * rouge : à corriger), par rôle. L'audit est lancé automatiquement à
 * l'ouverture de la page (`useSuite`, dans `OngletsTests`, qui appelle la
 * Server Action `lancerAuditRls`) ; « Relancer » le rejoue.
 */
export function AuditRls({ suite }: { suite: Suite<ResultatAudit> }) {
  const audit = suite.resultat;
  return (
    <div>
      <CommandesSuite suite={suite} bilan={audit ? { reussis: audit.reussis, total: audit.resultats.length } : null} unite="vérifications" />

      {audit &&
        (Object.keys(ROLES) as Role[]).map((role) => {
          const lignes = audit.resultats.filter((r) => r.verification.role === role);
          if (lignes.length === 0) return null;
          return (
            <div key={role} className="mt-8">
              <h3 className="text-lg font-semibold text-ivoire">{ROLES[role].titre}</h3>
              <p className="text-sm text-sable">{ROLES[role].description}</p>
              <ul className="mt-3 border border-ligne bg-nuit-2">
                {lignes.map((r, i) => (
                  <LigneAudit key={i} resultat={r} />
                ))}
              </ul>
            </div>
          );
        })}
    </div>
  );
}

function LigneAudit({ resultat }: { resultat: ResultatVerification }) {
  const { verification: v, ok, constat } = resultat;
  return (
    <li className={`flex gap-3 border-t border-ligne px-4 py-3 first:border-t-0 ${ok ? "" : "bg-erreur/10"}`}>
      <span aria-hidden="true" className={`mt-0.5 w-4 shrink-0 text-center font-semibold ${ok ? "text-succes" : "text-erreur"}`}>
        {ok ? "✓" : "✗"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ivoire">
          <span className="sr-only">{ok ? "Conforme : " : "En échec : "}</span>
          {v.libelle}
          <span className="ml-2 font-mono text-xs text-sable/80">
            {OPERATIONS[v.operation]} {v.cible}
            {v.filtre &&
              ` (${Object.entries(v.filtre)
                .map(([colonne, valeur]) => `${colonne} = ${String(valeur)}`)
                .join(", ")})`}{" "}
            · attendu : {v.attendu}
          </span>
        </p>
        <p className={`text-sm ${ok ? "text-sable" : "text-erreur"}`}>{constat}</p>
        {v.note && <p className="mt-1 text-xs text-sable/70">{v.note}</p>}
      </div>
    </li>
  );
}
