"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { ResultatAudit } from "@/lib/admin/audit-rls";
import { interrogerSuiteSql, type ResultatSuiteSql } from "@/lib/admin/tests-sql";
import {
  ONGLETS,
  PARAMETRE_ONGLET,
  etatPastilleSuite,
  ongletVoisin,
  pastille,
  type CleOnglet,
  type EtatPastille,
} from "@/lib/admin/onglets-tests";
import { useSuite } from "@/hooks/useSuite";
import { AuditRls } from "./AuditRls";
import { SuiteSql } from "./SuiteSql";

type PanneauStatique = {
  /** Verdict calculé côté serveur (rapport du build, variables d'environnement). */
  etat: EtatPastille;
  contenu: ReactNode;
};

type Props = {
  /** Onglet demandé par l'adresse (`?onglet=`). */
  ongletInitial: CleOnglet;
  /** Server Action `lancerAuditRls` (injectée pour pouvoir tester le composant). */
  lancerAudit: () => Promise<ResultatAudit>;
  /** Exécution des comportements SQL ; par défaut, la route gardée `/admin/tests/sql`. */
  lancerSql?: () => Promise<ResultatSuiteSql>;
  unitaires: PanneauStatique;
  configuration: PanneauStatique;
};

const TONS = {
  succes: "bg-succes/15 text-succes",
  erreur: "bg-erreur/15 text-erreur",
  neutre: "bg-nuit-3 text-sable",
} as const;

const INTRO_SUITES: Record<"sql" | "droits", ReactNode> = {
  sql: (
    <>
      Contraintes, triggers et cascades, vérifiés sur la vraie base : ce que les tests unitaires ne peuvent pas voir, puisqu&apos;ils ne connaissent que le
      code. Chaque cas écrit puis annule : la base ressort inchangée. Les cas vivent dans la fonction <code className="font-mono text-ivoire">tests_sql()</code>{" "}
      (migration 0010).
    </>
  ),
  droits: (
    <>
      Chaque vérification interroge réellement Supabase : en visiteur anonyme, puis avec votre session. Aucune donnée n&apos;est lue ; une écriture qui
      réussirait par erreur serait aussitôt effacée et signalée en rouge.
    </>
  ),
};

function messageAudit(): string {
  return "L'audit n'a pas pu être lancé. Rechargez la page (la session a peut-être expiré) puis réessayez.";
}

function messageSql(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "La suite n'a pas pu être lancée.";
}

/** Pastille de verdict d'un onglet, lisible aussi par un lecteur d'écran (dans le nom de l'onglet). */
function Pastille({ etat }: { etat: EtatPastille }) {
  const p = pastille(etat);
  return (
    <span title={p.libelle} className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${TONS[p.ton]}`}>
      <span aria-hidden="true">{p.signe}</span>
      <span className="sr-only">({p.libelle})</span>
    </span>
  );
}

/**
 * Page Tests en onglets : comportements SQL, audit des droits, tests unitaires
 * du dernier build, configuration.
 *
 * Les onglets plutôt qu'un empilement : chaque section mesure plusieurs
 * dizaines de lignes, et surtout la pastille de chaque onglet donne le verdict
 * SANS l'ouvrir. Les deux suites « live » partent dès l'ouverture de la page,
 * onglet affiché ou non, en parallèle. L'onglet ouvert est gardé dans
 * l'adresse (`?onglet=droits`) : un lien ou un rechargement y revient.
 */
export function OngletsTests({ ongletInitial, lancerAudit, lancerSql = interrogerSuiteSql, unitaires, configuration }: Props) {
  const [actif, setActif] = useState<CleOnglet>(ongletInitial);
  const boutons = useRef<Partial<Record<CleOnglet, HTMLButtonElement | null>>>({});

  const sql = useSuite(lancerSql, messageSql);
  const droits = useSuite(lancerAudit, messageAudit);

  const etats: Record<CleOnglet, EtatPastille> = {
    sql: etatPastilleSuite({ enCours: sql.enCours, erreur: sql.erreur, echecs: sql.resultat ? sql.resultat.checks.filter((c) => !c.ok).length : null }),
    droits: etatPastilleSuite({ enCours: droits.enCours, erreur: droits.erreur, echecs: droits.resultat ? droits.resultat.echoues : null }),
    unitaires: unitaires.etat,
    configuration: configuration.etat,
  };

  function choisir(cle: CleOnglet) {
    setActif(cle);
    // L'adresse garde l'onglet (sans navigation : rien n'est rechargé).
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(PARAMETRE_ONGLET, cle);
      window.history.replaceState(null, "", url);
    } catch {
      // Navigateur qui refuse (cadre, mode restreint) : l'onglet change quand même.
    }
  }

  function clavier(e: KeyboardEvent<HTMLDivElement>) {
    const voisin = ongletVoisin(actif, e.key);
    if (!voisin) return;
    e.preventDefault();
    choisir(voisin);
    boutons.current[voisin]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Suites de tests" onKeyDown={clavier} className="flex overflow-x-auto">
        {ONGLETS.map((o) => {
          const selectionne = actif === o.cle;
          return (
            <button
              key={o.cle}
              ref={(b) => {
                boutons.current[o.cle] = b;
              }}
              type="button"
              role="tab"
              id={`onglet-${o.cle}`}
              aria-selected={selectionne}
              aria-controls={`panneau-${o.cle}`}
              tabIndex={selectionne ? 0 : -1}
              onClick={() => choisir(o.cle)}
              className={`inline-flex shrink-0 items-center gap-2.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                selectionne ? "border-or text-or" : "border-ligne text-sable hover:text-ivoire"
              }`}
            >
              {o.titre}{" "}
              <Pastille etat={etats[o.cle]} />
            </button>
          );
        })}
        <span aria-hidden="true" className="min-w-4 flex-1 border-b-2 border-ligne" />
      </div>

      <Panneau cle="sql" actif={actif}>
        <p className="mb-6 max-w-2xl text-sm text-sable">{INTRO_SUITES.sql}</p>
        <SuiteSql suite={sql} />
      </Panneau>
      <Panneau cle="droits" actif={actif}>
        <p className="mb-6 max-w-2xl text-sm text-sable">{INTRO_SUITES.droits}</p>
        <AuditRls suite={droits} />
      </Panneau>
      <Panneau cle="unitaires" actif={actif}>
        {unitaires.contenu}
      </Panneau>
      <Panneau cle="configuration" actif={actif}>
        {configuration.contenu}
      </Panneau>
    </div>
  );
}

/** Panneau d'un onglet : toujours rendu (le rapport encadré ne se recharge pas à chaque changement), masqué s'il n'est pas actif. */
function Panneau({ cle, actif, children }: { cle: CleOnglet; actif: CleOnglet; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`panneau-${cle}`} aria-labelledby={`onglet-${cle}`} hidden={actif !== cle} tabIndex={0} className="pt-8">
      {children}
    </div>
  );
}
