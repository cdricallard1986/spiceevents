import type { Metadata } from "next";
import paquet from "@/package.json";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { etatConfiguration, nomEnvironnement } from "@/lib/admin/configuration";
import { formaterDateRapport, formaterDuree } from "@/lib/admin/rapport-tests";
import { RESUME_TESTS } from "@/lib/admin/rapport-tests.generated";
import { CHEMIN_RAPPORT_TESTS } from "@/lib/securite/entetes";
import { Icone } from "@/components/admin/Icones";
import { AuditRls } from "@/components/admin/AuditRls";
import { lancerAuditRls } from "./actions";

export const metadata: Metadata = { title: "Tests" };

const CLASSES_LIEN = "inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair";

/**
 * Tableau de santé du site : tests automatiques du dernier build, audit des
 * droits sur la vraie base, configuration de l'environnement.
 */
export default async function PageTests() {
  await exigerAdmin();
  const section = sectionDe("/admin/tests");
  const configuration = etatConfiguration(process.env);
  const resume = RESUME_TESTS;

  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <p className="mt-4 max-w-2xl text-sable">
        D&apos;un coup d&apos;œil : les tests automatiques passent-ils, et la base refuse-t-elle bien ce qu&apos;elle doit refuser ?
      </p>

      {/* 1. Rapport Vitest du build déployé. */}
      <section aria-labelledby="titre-rapport" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titre-rapport" className="font-display text-3xl leading-tight">
              Tests automatiques
            </h2>
            {resume ? (
              <p className={`mt-2 text-sm ${resume.succes ? "text-succes" : "text-erreur"}`}>
                {resume.succes ? "✓ Tous les tests passent" : `✗ ${resume.totaux.echoues} test${resume.totaux.echoues > 1 ? "s" : ""} en échec`}
                <span className="text-sable">
                  {" "}
                  · {resume.totaux.total} tests ({resume.totaux.reussis} réussis, {resume.totaux.echoues} échoués, {resume.totaux.ignores} ignorés) · lancés le{" "}
                  {formaterDateRapport(resume.date)} en {formaterDuree(resume.dureeMs)} · version {resume.version}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-sable">Rapport non encore généré : il l&apos;est à chaque build, avant la mise en ligne.</p>
            )}
          </div>
          <a href={CHEMIN_RAPPORT_TESTS} target="_blank" rel="noopener" className={CLASSES_LIEN}>
            Ouvrir dans un onglet
            <Icone nom="site" className="size-4" />
          </a>
        </div>
        {/* Cadre sans script (sandbox vide) ; la route du rapport est la seule page encadrable, par le site seulement. */}
        <iframe
          src={CHEMIN_RAPPORT_TESTS}
          title="Rapport des tests automatiques"
          sandbox=""
          className="mt-6 h-[70vh] min-h-[28rem] w-full border border-ligne bg-nuit"
        />
      </section>

      {/* 2. Audit des droits sur la vraie base. */}
      <section aria-labelledby="titre-audit" className="mt-16">
        <h2 id="titre-audit" className="font-display text-3xl leading-tight">
          Droits en base
        </h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm text-sable">
          Chaque vérification interroge réellement Supabase : en visiteur anonyme, puis avec votre session. Aucune donnée n&apos;est lue ; une
          écriture qui réussirait par erreur serait aussitôt effacée et signalée en rouge.
        </p>
        <AuditRls action={lancerAuditRls} />
      </section>

      {/* 3. Configuration (jamais la valeur d'un secret). */}
      <section aria-labelledby="titre-configuration" className="mt-16">
        <h2 id="titre-configuration" className="font-display text-3xl leading-tight">
          Configuration
        </h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm text-sable">
          Variables de cet environnement Vercel. Les secrets ne sont jamais affichés : seulement leur présence.
        </p>
        <dl className="border border-ligne bg-nuit-2">
          <LigneConfig nom="Version du site" valeur={paquet.version} />
          <LigneConfig nom="Environnement" valeur={nomEnvironnement(process.env)} />
          {configuration.map((c) => (
            <LigneConfig
              key={c.nom}
              nom={c.nom}
              code
              description={c.description}
              valeur={
                c.secret ? (
                  <span className={c.presente ? "text-succes" : "text-erreur"}>{c.presente ? "✓ présente" : "✗ absente"}</span>
                ) : (
                  <>
                    {c.valeur}
                    {c.parDefaut && <span className="ml-2 text-xs text-sable/70">(non définie : valeur par défaut)</span>}
                  </>
                )
              }
            />
          ))}
        </dl>
      </section>
    </>
  );
}

function LigneConfig({ nom, valeur, description, code = false }: { nom: string; valeur: React.ReactNode; description?: string; code?: boolean }) {
  return (
    <div className="grid gap-1 border-t border-ligne px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:gap-4">
      <dt>
        <span className={code ? "font-mono text-sm text-ivoire" : "text-ivoire"}>{nom}</span>
        {description && <span className="block text-xs text-sable/70">{description}</span>}
      </dt>
      <dd className="break-words text-sm text-ivoire">{valeur}</dd>
    </div>
  );
}
