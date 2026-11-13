import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { COLONNES_LISTE, type ArticleListe } from "@/lib/journal/admin";
import { nettoyerBrouillonsVides } from "@/lib/journal/nettoyage";
import { sourceArticles } from "@/lib/journal/source";
import { GestionJournal } from "@/components/admin/GestionJournal";
import { creerArticle } from "./actions";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";

export const metadata: Metadata = { title: "Journal" };

/**
 * Articles du journal : liste (brouillons en tête), filtres, création d'un
 * brouillon qui ouvre l'éditeur. Les brouillons abandonnés vides depuis plus
 * de 24 heures sont supprimés à l'ouverture. Session de Cédric (RLS : est_admin()).
 */
export default async function PageJournal() {
  const { supabase } = await exigerAdmin();
  const section = sectionDe("/admin/journal");
  await nettoyerBrouillonsVides(supabase);
  const { data, error } = await supabase.from("articles").select(COLONNES_LISTE).order("date_publication", { ascending: false, nullsFirst: true });
  if (error) console.warn(`[admin] Journal — lecture : ${error.code ?? ""} ${error.message}`);
  const siteSurFichiers = sourceArticles(process.env) === "fichiers";
  const baseVide = !error && (data ?? []).length === 0;

  return (
    <>
      <EnTeteAdmin
        section={section}
        intro={
          <>
            Les articles du journal : rédaction dans l&apos;éditeur visuel, photos, publication. Tout est enregistré automatiquement ; un article publié
            apparaît sur le site à la visite suivante d&apos;une page.
          </>
        }
      />

      {siteSurFichiers && (
        <p className="mt-6 max-w-2xl border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Supabase n&apos;est pas configuré dans cet environnement (<code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> absente) : les pages
          publiques d&apos;ici affichent les articles de secours du code, et vos modifications n&apos;y apparaîtront pas.
        </p>
      )}
      {baseVide && (
        <p className="mt-6 max-w-2xl border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Aucun article en base : l&apos;import des articles actuels (migration <code className="font-mono">0009_import_articles.sql</code>) n&apos;a pas encore
          été appliqué. Tant qu&apos;il ne l&apos;est pas, le journal du site en ligne serait vide.
        </p>
      )}

      <div className="mt-10">
        {error ? (
          <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
            Les articles n&apos;ont pas pu être chargés (la base ne répond pas). Rechargez la page dans un instant.
          </p>
        ) : (
          <GestionJournal articles={(data ?? []) as ArticleListe[]} creer={creerArticle} />
        )}
      </div>
    </>
  );
}
