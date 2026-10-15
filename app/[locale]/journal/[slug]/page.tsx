import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { compileMDX } from "next-mdx-remote/rsc";
import type { Locale } from "@/i18n/routing";
import { JOURNAL } from "@/contenu/pages/journal";
import { articleParSlug, articles, articlesLies } from "@/lib/journal/articles";
import { metadonnees } from "@/lib/seo/metadonnees";
import { article as donneesArticle, filAriane } from "@/lib/seo/donneesStructurees";
import { AppelContact } from "@/components/common/AppelContact";
import { JsonLd } from "@/components/common/JsonLd";
import { Section } from "@/components/common/Section";
import { CarteArticle } from "@/components/journal/CarteArticle";
import { EnTeteArticle } from "@/components/journal/EnTeteArticle";
import { LienArticle } from "@/components/journal/LienArticle";
import { PhotoArticle } from "@/components/journal/PhotoArticle";
import { Bouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

// Articles en français seulement : aucune page anglaise générée, les autres adresses renvoient une 404.
export const dynamicParams = false;

export function generateStaticParams() {
  // Donne aussi la langue : seules les adresses françaises sont générées.
  return articles().map((a) => ({ locale: "fr", slug: a.slug }));
}

/** Composants disponibles dans les fichiers MDX du journal. */
const COMPOSANTS = { PhotoArticle, a: LienArticle };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = articleParSlug(slug);
  if (locale !== "fr" || !a) notFound();
  const base = metadonnees({
    locale,
    href: { pathname: "/journal/[slug]", params: { slug } },
    seo: { titre: `${a.titre} — Spice Events`, description: a.description },
    type: "article",
  });
  // `metadonnees` n'accepte que les photos du registre : on remplace l'image de partage par la couverture.
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: a.couverture, alt: a.couvertureAlt }] },
  };
}

export default async function PageArticle({ params }: Props) {
  const { locale, slug } = await params;
  const a = articleParSlug(slug);
  if (locale !== "fr" || !a) notFound();
  setRequestLocale(locale);

  // Contenu du dépôt (pas de saisie extérieure) : les expressions JSX sont autorisées
  // pour les dimensions des photos (`width={1200}`) ; le reste du JavaScript reste bloqué.
  const { content } = await compileMDX({
    source: a.source,
    components: COMPOSANTS,
    options: { parseFrontmatter: true, blockJS: false, blockDangerousJS: true },
  });
  const lies = articlesLies(articles(), a, 3);
  const url = `/journal/${a.slug}`;

  return (
    <>
      <JsonLd
        donnees={donneesArticle({ titre: a.titre, description: a.description, date: a.date, url, image: a.couverture })}
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
        <div className="prose-nuit mx-auto max-w-[44rem]">{content}</div>
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
