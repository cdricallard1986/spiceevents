import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { SEINE_ET_MARNE } from "@/contenu/pages/seine-et-marne";
import { adresse, metadonnees } from "@/lib/seo/metadonnees";
import { filAriane } from "@/lib/seo/donneesStructurees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { JsonLd } from "@/components/common/JsonLd";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

// Page en français seulement : seule la version française est générée, l’anglais renvoie une 404.
export function generateStaticParams() {
  return [{ locale: "fr" }];
}

// Langue ou adresse non générée → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "fr") return {};
  return metadonnees({ locale, href: "/mariages/seine-et-marne", seo: SEINE_ET_MARNE.seo, image: SEINE_ET_MARNE.photos.entete });
}

export default async function PageSeineEtMarne({ params }: Props) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  setRequestLocale(locale);
  const c = SEINE_ET_MARNE;
  const ariane = filAriane([
    { nom: "Accueil", url: adresse("/", locale) },
    { nom: "Mariages", url: adresse("/mariages", locale) },
    { nom: "Seine-et-Marne", url: adresse("/mariages/seine-et-marne", locale) },
  ]);

  return (
    <>
      <JsonLd donnees={ariane} />

      <EnTetePage image={c.photos.entete} surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">Vérifier ma date</Bouton>
        <Bouton href="/mariages" variante="contour">Notre offre mariage</Bouton>
      </EnTetePage>

      {/* Promesse, avec une seule photo (jamais deux photos d’un même mariage côte à côte). */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="surtitre mb-4">{c.promesse.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.promesse.titre} />
            </h2>
            {c.promesse.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">
                {p}
              </p>
            ))}
          </div>
          <div className="relative aspect-[4/3]">
            <Photo cle={c.photos.promesse} remplir sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
        </div>
      </section>

      {/* Les lieux : du texte seulement, aucune photo attribuée à un lieu sans en être sûr. */}
      <Section surtitre={c.lieux.surtitre} titre={c.lieux.titre} intro={c.lieux.intro} alterne>
        <ul className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {c.lieux.liste.map((l) => (
            <li key={l.nom} className="border-t border-ligne pt-6">
              <p className="surtitre">{l.commune}</p>
              <h3 className="mt-3 font-display text-3xl leading-[1.1]">{l.nom}</h3>
              <p className="mt-2 text-sm text-ivoire/70">{l.mariages}</p>
              <p className="mt-4 text-sable">{l.texte}</p>
            </li>
          ))}
        </ul>
        <p className="mt-14 max-w-3xl text-sable">{c.lieux.aussi}</p>
      </Section>

      {/* Avis déjà publiés sur le site, rattachés à leur lieu. */}
      <Section surtitre={c.avis.surtitre} titre={c.avis.titre}>
        <ul className="grid gap-10 md:grid-cols-2">
          {c.avis.liste.map((a) => (
            <li key={a.auteurs + a.lieu}>
              <figure className="flex h-full flex-col border-l-2 border-or pl-6">
                <blockquote className="text-lg text-ivoire">« {a.texte} »</blockquote>
                <figcaption className="mt-4 text-sm text-sable">
                  <span className="font-semibold text-ivoire">{a.auteurs}</span> · {a.lieu}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <Bouton href="/avis" variante="lien" className="mt-12">
          Tous les avis de nos mariés →
        </Bouton>
      </Section>

      {/* Les atouts des lieux du 77 (seulement ce qui les met en valeur). */}
      <Section surtitre={c.atouts.surtitre} titre={c.atouts.titre} intro={c.atouts.intro} alterne>
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {c.atouts.liste.map((x) => (
            <li key={x.titre}>
              <h3 className="text-xl font-semibold tracking-tight">{x.titre}</h3>
              <p className="mt-3 text-[0.9375rem] text-sable">{x.texte}</p>
            </li>
          ))}
        </ul>
        <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4">
          <Bouton href="/animations" variante="lien">
            Nos animations de mariage →
          </Bouton>
          <Bouton href="/son-et-lumiere" variante="lien">
            Notre matériel son & lumière →
          </Bouton>
        </div>
      </Section>

      {/* Anecdote : la fête de Vaux-le-Vicomte. */}
      <section className="py-20 md:py-28">
        <div className="conteneur">
          <div className="max-w-3xl border-l-2 border-or pl-6 md:pl-10">
            <p className="surtitre mb-4">{c.anecdote.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-5xl">
              <Accent texte={c.anecdote.titre} />
            </h2>
            <p className="mt-6 text-lg text-sable">{c.anecdote.texte}</p>
          </div>
        </div>
      </section>

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} bouton={c.appel.bouton} />
    </>
  );
}
