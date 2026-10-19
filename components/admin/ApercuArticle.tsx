import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { adressePublique, type LigneArticleAdmin } from "@/lib/journal/admin";
import { apercuDepuisLigne } from "@/lib/journal/apercu";
import { ContenuArticle } from "@/components/journal/ContenuArticle";
import { EnTeteArticle } from "@/components/journal/EnTeteArticle";

/**
 * Corps de l'aperçu d'un article (/admin/journal/[id]/apercu) : bandeau
 * « Aperçu » (statut, ce qui manque, retour à l'éditeur), puis exactement le
 * rendu de la page publique — `EnTeteArticle` et `ContenuArticle` sous
 * `prose-nuit`. Les liens du site (`Link` de next-intl) demandent un
 * fournisseur next-intl, absent du back office : il est posé ici (français).
 */
export function ApercuArticle({ ligne, erreurLecture = false }: { ligne: LigneArticleAdmin | null; erreurLecture?: boolean }) {
  const apercu = ligne ? apercuDepuisLigne(ligne) : null;
  return (
    <NextIntlClientProvider locale="fr" messages={{}}>
      <div className="sticky top-0 z-40 border-b border-or/40 bg-nuit-2/95 backdrop-blur-md">
        <div className="conteneur flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ivoire">
            <span className="font-semibold text-or">Aperçu</span>
            {ligne && (ligne.statut === "publie" ? ` — publié à l'adresse ${adressePublique(ligne.slug)}` : " — brouillon, pas encore sur le site")}
            {apercu?.ok && apercu.manques.length > 0 && <span className="block text-sable sm:inline"> · À compléter : {apercu.manques.join(", ")}</span>}
          </p>
          {ligne && (
            <Link href={`/admin/journal/${ligne.id}`} className="shrink-0 font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair">
              ← Retour à l&apos;éditeur
            </Link>
          )}
        </div>
      </div>

      {!apercu ? (
        <p role="alert" className="conteneur py-16 text-ivoire">
          {erreurLecture ? "L'article n'a pas pu être chargé (la base ne répond pas). Rechargez la page dans un instant." : "Article introuvable."}
        </p>
      ) : !apercu.ok ? (
        <p role="alert" className="conteneur py-16 text-ivoire">
          Le texte de l&apos;article ne peut pas être affiché : {apercu.message}
        </p>
      ) : (
        <main>
          <EnTeteArticle article={apercu.article} />
          <article className="conteneur py-16 md:py-24">
            <div className="prose-nuit mx-auto max-w-[44rem]">
              <ContenuArticle document={apercu.article.contenu} />
            </div>
          </article>
        </main>
      )}
    </NextIntlClientProvider>
  );
}
