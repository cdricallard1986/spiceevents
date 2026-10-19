import type { Metadata } from "next";
import paquet from "@/package.json";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { etatConfiguration, nomEnvironnement } from "@/lib/admin/configuration";
import { etatPastilleConfiguration, etatPastilleUnitaires, ongletDepuis, PARAMETRE_ONGLET } from "@/lib/admin/onglets-tests";
import { formaterDateRapport, formaterDuree } from "@/lib/admin/rapport-tests";
import { RESUME_TESTS } from "@/lib/admin/rapport-tests.generated";
import { CHEMIN_RAPPORT_TESTS } from "@/lib/securite/entetes";
import { Icone } from "@/components/admin/Icones";
import { OngletsTests } from "@/components/admin/OngletsTests";
import { lancerAuditRls } from "./actions";

export const metadata: Metadata = { title: "Tests" };

const CLASSES_LIEN = "inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Tableau de santé du site, en onglets : comportements SQL et audit des droits
 * (joués sur la vraie base dès l'ouverture), tests unitaires du dernier build,
 * configuration de l'environnement. La pastille de chaque onglet donne le
 * verdict sans l'ouvrir.
 */
export default async function PageTests({ searchParams }: Props) {
  await exigerAdmin();
  const section = sectionDe("/admin/tests");
  const onglet = ongletDepuis((await searchParams)[PARAMETRE_ONGLET]);
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
        D&apos;un coup d&apos;œil : la base refuse-t-elle bien ce qu&apos;elle doit refuser, et les tests automatiques passent-ils ? La pastille de chaque
        onglet donne le verdict sans l&apos;ouvrir ; les deux premiers interrogent la vraie base dès l&apos;ouverture de la page.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-sable/80">
        Les mêmes audits tournent à chaque commit (job « Audits base » de la vérification GitHub) : l&apos;audit côté visiteur toujours, les comportements SQL
        dès que le secret <code className="font-mono">supabase_service_role_key</code> est défini dans GitHub.
      </p>

      <div className="mt-10">
        <OngletsTests
          ongletInitial={onglet}
          lancerAudit={lancerAuditRls}
          unitaires={{
            etat: etatPastilleUnitaires(resume),
            contenu: (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    {resume ? (
                      <p className={`text-sm ${resume.succes ? "text-succes" : "text-erreur"}`}>
                        {resume.succes ? "✓ Tous les tests passent" : `✗ ${resume.totaux.echoues} test${resume.totaux.echoues > 1 ? "s" : ""} en échec`}
                        <span className="text-sable">
                          {" "}
                          · {resume.totaux.total} tests ({resume.totaux.reussis} réussis, {resume.totaux.echoues} échoués, {resume.totaux.ignores} ignorés)
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-sable">Rapport non encore généré : il l&apos;est à chaque build, avant la mise en ligne.</p>
                    )}
                    <p className="mt-1 text-sm text-sable">
                      {resume
                        ? `Build de la version ${resume.version}, tests lancés le ${formaterDateRapport(resume.date)} en ${formaterDuree(resume.dureeMs)}.`
                        : `Version ${paquet.version}.`}{" "}
                      Régénéré à chaque build (étape <code className="font-mono">prebuild</code>) : il date du dernier déploiement, contrairement aux deux
                      premiers onglets qui interrogent la base maintenant.
                    </p>
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
                  loading="lazy"
                  className="mt-6 h-[70vh] min-h-[28rem] w-full border border-ligne bg-nuit"
                />
              </>
            ),
          }}
          configuration={{
            etat: etatPastilleConfiguration(configuration),
            contenu: (
              <>
                <p className="mb-6 max-w-2xl text-sm text-sable">
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
              </>
            ),
          }}
        />
      </div>
    </>
  );
}

function LigneConfig({ nom, valeur, description, code = false }: { nom: string; valeur: React.ReactNode; description?: string; code?: boolean }) {
  return (
    <div className="grid gap-1 border-t border-ligne px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:gap-4">
      <dt>
        <span className={code ? "break-all font-mono text-sm text-ivoire" : "text-ivoire"}>{nom}</span>
        {description && <span className="block text-xs text-sable/70">{description}</span>}
      </dt>
      <dd className="break-words text-sm text-ivoire">{valeur}</dd>
    </div>
  );
}
