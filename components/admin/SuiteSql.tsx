"use client";

import type { Suite } from "@/hooks/useSuite";
import type { ResultatSuiteSql } from "@/lib/admin/tests-sql";
import { CommandesSuite } from "./CommandesSuite";

/**
 * Comportements SQL (fonction `tests_sql()`, migration 0010) : un cas par
 * ligne, vert s'il est conforme, rouge sinon, avec ce qui a été observé.
 * L'exécution vit dans `useSuite`, appelé par `OngletsTests`.
 */
export function SuiteSql({ suite }: { suite: Suite<ResultatSuiteSql> }) {
  const { resultat } = suite;
  const bilan = resultat ? { reussis: resultat.checks.filter((c) => c.ok).length, total: resultat.checks.length } : null;

  return (
    <div>
      <CommandesSuite suite={suite} bilan={bilan} unite="cas" />
      {resultat && (
        <ul className="mt-8 border border-ligne bg-nuit-2">
          {resultat.checks.map((c, i) => (
            <li key={i} className={`flex gap-3 border-t border-ligne px-4 py-3 first:border-t-0 ${c.ok ? "" : "bg-erreur/10"}`}>
              <span aria-hidden="true" className={`mt-0.5 w-4 shrink-0 text-center font-semibold ${c.ok ? "text-succes" : "text-erreur"}`}>
                {c.ok ? "✓" : "✗"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ivoire">
                  <span className="sr-only">{c.ok ? "Conforme : " : "En échec : "}</span>
                  {c.nom}
                </p>
                <p className={`break-words text-sm ${c.ok ? "text-sable" : "text-erreur"}`}>{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
