"use client";

import { useState, useTransition } from "react";
import type { ResultatAudit, ResultatVerification, Role } from "@/lib/admin/audit-rls";
import { classesBouton } from "@/components/ui/Bouton";
import { useToasts } from "./Toasts";

const ROLES: Record<Role, { titre: string; description: string }> = {
  visiteur: { titre: "Visiteur", description: "Clé publique, sans session : ce que n'importe qui peut tenter depuis Internet." },
  admin: { titre: "Cédric", description: "Votre session : les droits du back office." },
};

const OPERATIONS = { select: "lecture", insert: "écriture", update: "modification", delete: "suppression", rpc: "appel" } as const;

type Props = {
  /** Server Action `lancerAuditRls` (injectée pour pouvoir tester le composant). */
  action: () => Promise<ResultatAudit>;
};

/**
 * Audit des droits en base : un bouton lance les vérifications sur la vraie
 * base, le résultat s'affiche ligne par ligne (vert : conforme, rouge : à
 * corriger).
 */
export function AuditRls({ action }: Props) {
  const [audit, setAudit] = useState<ResultatAudit | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const { afficher } = useToasts();

  function lancer() {
    setErreur(null);
    demarrer(async () => {
      try {
        const resultat = await action();
        setAudit(resultat);
        if (resultat.echoues === 0) afficher("Audit terminé : tous les droits sont conformes.");
        else afficher(`Audit terminé : ${resultat.echoues} vérification${resultat.echoues > 1 ? "s" : ""} en échec.`, "erreur");
      } catch {
        setErreur("L'audit n'a pas pu être lancé. Rechargez la page (la session a peut-être expiré) puis réessayez.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={lancer} disabled={enCours} className={`${classesBouton("primaire")} disabled:cursor-wait disabled:opacity-70`}>
          {enCours ? "Audit en cours…" : audit ? "Relancer l'audit" : "Lancer l'audit"}
        </button>
        {audit && (
          <p role="status" className={`text-sm ${audit.echoues ? "text-erreur" : "text-succes"}`}>
            {audit.echoues ? `${audit.echoues} en échec` : "Tout est conforme"} · {audit.reussis}/{audit.resultats.length} vérifications ·{" "}
            {new Date(audit.date).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        )}
      </div>

      {erreur && (
        <p role="alert" className="mt-6 border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          {erreur}
        </p>
      )}

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
