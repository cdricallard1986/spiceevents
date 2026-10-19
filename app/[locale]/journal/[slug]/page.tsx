import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { JOURNAL } from "@/contenu/pages/journal";
import { articlesLies } from "@/lib/journal/articles";
import { srcImage } from "@/lib/journal/constantes";
import { articleParSlug, articlesPublies } from "@/lib/journal/lecture";
import { metadonnees } from "@/lib/seo/metadonnees";
import { article as donneesArticle, filAriane } from "@/lib/seo/donneesStructurees";
import { AppelContact } from "@/components/common/AppelContact";
import { JsonLd } from "@/components/common/JsonLd";
import { Section } from "@/components/common/Section";
import { CarteArticle } from "@/components/journal/CarteArticle";
import { EnTeteArticle } from "@/components/journal/EnTeteArticle";
import { ContenuArticle } from "@/components/journal/ContenuArticle";
import { Bouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

// Un article publié dans le back office après le déploiement est rendu à sa
// première visite (puis gardé en cache, étiquette « articles ») : pas de
// reconstruction du site. Adresse inconnue ou page anglaise → 404 traduite.
export const dynamicParams = true;

export async function generateStaticParams() {
  // Donne aussi la langue : seules les adresses françaises sont générées au build.
  return (await articlesPublies()).map((a) => ({ locale: "fr", slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = locale === "fr" ? await articleParSlug(slug) : undefined;
  if (!a) notFound();
  const base = metadonnees({
    locale,
    href: { pathname: "/journal/[slug]", params: { slug } },
    seo: { titre: `${a.titre} — Spice Events`, description: a.description },
    type: "article",
  });
  // `metadonnees` n'accepte que les photos du registre : on remplace l'image de partage par la couverture.
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: srcImage(a.couverture), alt: a.couvertureAlt }] },
  };
}

export default async function PageArticle({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== "fr") notFound();
  const tous = await articlesPublies();
  const a = tous.find((x) => x.slug === slug);
  if (!a) notFound();
  setRequestLocale(locale);

  const lies = articlesLies(tous, a, 3);
  const url = `/journal/${a.slug}`;

  return (
    <>
      <JsonLd
        donnees={donneesArticle({ titre: a.titre, description: a.description, date: a.date, url, image: srcImage(a.couverture) })}
      />
      <JsonLd
        donnees={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Journal", url: "/journal" },
          { nom: a.titre, url },
        ])}
      />

      <EnTeteArticle article={a} />

      <article className="conteneur py-16 md:py-24">
        <div className="prose-nuit mx-auto max-w-[44rem]">
          <ContenuArticle document={a.contenu} />
        </div>
        <div className="mx-auto mt-14 max-w-[44rem] border-t border-ligne pt-8">
          <Bouton href="/journal" variante="lien">
            ← {JOURNAL.article.retour}
          </Bouton>
        </div>
      </article>

      {lies.length > 0 && (
        <Section surtitre={JOURNAL.article.lies.surtitre} titre={JOURNAL.article.lies.titre} alterne>
          <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {lies.map((l) => (
              <li key={l.slug}>
                <CarteArticle article={l} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <AppelContact />
    </>
  );
}
