import type { Metadata } from "next";
import Link from "next/link";
import { exigerAdmin, type ContexteAdmin } from "@/lib/admin/garde";
import { SECTIONS } from "@/lib/admin/navigation";
import { Icone } from "@/components/admin/Icones";

export const metadata: Metadata = { title: "Accueil" };

type ResumeDemandes = { nouvelles: number; sansEmail: number };

/**
 * Demandes à traiter, pour la carte « Demandes » : les nouvelles, et parmi
 * elles celles dont l'email de notification n'est pas parti. Deux comptages
 * (sans lire aucune ligne) ; null si la base ne répond pas — la carte reste
 * alors une simple carte.
 */
async function resumeDemandes(supabase: ContexteAdmin["supabase"]): Promise<ResumeDemandes | null> {
  const compter = () => supabase.from("demandes_contact").select("id", { count: "exact", head: true }).eq("statut", "nouvelle");
  const [nouvelles, sansEmail] = await Promise.all([compter(), compter().eq("email_envoye", false)]);
  const erreur = nouvelles.error ?? sansEmail.error;
  if (erreur) {
    console.warn(`[admin] Accueil — comptage des demandes : ${erreur.code ?? ""} ${erreur.message}`);
    return null;
  }
  return { nouvelles: nouvelles.count ?? 0, sansEmail: sansEmail.count ?? 0 };
}

export default async function AccueilAdmin() {
  const { supabase } = await exigerAdmin();
  const demandes = await resumeDemandes(supabase);
  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Bonjour Cédric</h1>
      <p className="mt-4 max-w-2xl text-sable">
        Avis, journal, photos des galeries et demandes de contact : tout ce que vous publiez ici apparaît sur le site en
        quelques secondes.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex h-full flex-col gap-3 border border-ligne bg-nuit-2 p-6 transition-colors hover:border-or"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 text-or">
                  <Icone nom={s.icone} className="size-6" />
                  <span className="font-display text-2xl text-ivoire group-hover:text-or">{s.libelle}</span>
                </span>
                {!s.disponible && <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-sable/60">bientôt</span>}
              </span>
              <span className="text-sm text-sable">{s.description}</span>
              {s.href === "/admin/demandes" && demandes && (
                <span className="mt-auto flex flex-col gap-1 pt-1 text-sm">
                  <span className={demandes.nouvelles > 0 ? "font-semibold text-or" : "text-sable/80"}>
                    {demandes.nouvelles === 0
                      ? "Aucune nouvelle demande"
                      : `${demandes.nouvelles} nouvelle${demandes.nouvelles > 1 ? "s" : ""} demande${demandes.nouvelles > 1 ? "s" : ""}`}
                  </span>
                  {demandes.sansEmail > 0 && (
                    <span className="font-semibold text-erreur">
                      ⚠ dont {demandes.sansEmail} sans email reçu — à traiter à la main
                    </span>
                  )}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
