"use client";

import type { Suite } from "@/hooks/useSuite";
import { classesBouton } from "@/components/ui/Bouton";

type Props = {
  suite: Suite<unknown>;
  /** Bilan du dernier résultat (null tant que rien n'est revenu). */
  bilan: { reussis: number; total: number } | null;
  /** Ce qu'on compte, au pluriel (« vérifications », « cas »). */
  unite: string;
};

/**
 * Commandes communes aux suites « live » de /admin/tests : bouton Relancer,
 * état (en cours, conforme, en échec, heure de la dernière exécution) et
 * message clair si la suite n'a pas pu s'exécuter.
 */
export function CommandesSuite({ suite, bilan, unite }: Props) {
  const { enCours, erreur, termineeA, relancer } = suite;
  const echecs = bilan ? bilan.total - bilan.reussis : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => void relancer()} disabled={enCours} className={`${classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}>
          {enCours ? "Exécution en cours…" : "Relancer"}
        </button>
        <p role="status" className={`text-sm ${enCours || !bilan ? "text-sable" : echecs ? "text-erreur" : "text-succes"}`}>
          {enCours
            ? "Exécution sur la vraie base…"
            : bilan && (
                <>
                  {echecs ? `${echecs} en échec` : "Tout est conforme"} · {bilan.reussis}/{bilan.total} {unite}
                  {termineeA && ` · ${termineeA.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
                </>
              )}
        </p>
      </div>
      {erreur && !enCours && (
        <p role="alert" className="mt-6 border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          {erreur}
        </p>
      )}
    </>
  );
}
