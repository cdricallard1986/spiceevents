import type { CheminStatique, Locale } from "@/i18n/routing";
import type { PageLocale } from "@/contenu/pages/locales/types";
import { adresse } from "@/lib/seo/metadonnees";
import { filAriane } from "@/lib/seo/donneesStructurees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { JsonLd } from "@/components/common/JsonLd";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { c: PageLocale; locale: Locale; href: CheminStatique };

const LIBELLES = {
  fr: { date: "Vérifier ma date", offre: "Notre offre mariage", avis: "Tous les avis de nos mariés", animations: "Nos animations de mariage", technique: "Notre matériel son & lumière", accueil: "Accueil", mariages: "Mariages" },
  en: { date: "Check my date", offre: "Our wedding offer", avis: "All our couples’ reviews", animations: "Our wedding entertainment", technique: "Our sound & lighting equipment", accueil: "Home", mariages: "Weddings" },
} as const;

/**
 * Page locale du mariage (département ou lieu) : en-tête, promesse avec une
 * seule photo, lieux ou mariages réellement animés (texte seul : aucune photo
 * attribuée à un lieu sans en être sûr), avis rattachés, atouts, anecdote, appel.
 */
export function PageMariageLocale({ c, locale, href }: Props) {
  const l = LIBELLES[locale];
  const ariane = filAriane([
    { nom: l.accueil, url: adresse("/", locale) },
    { nom: l.mariages, url: adresse("/mariages", locale) },
    { nom: c.ariane, url: adresse(href, locale) },
  ]);

  return (
    <>
      <JsonLd donnees={ariane} />

      <EnTetePage image={c.photos.entete} surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">{l.date}</Bouton>
        <Bouton href="/mariages" variante="contour">
          {l.offre}
        </Bouton>
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

      <Section surtitre={c.cartes.surtitre} titre={c.cartes.titre} intro={c.cartes.intro} alterne>
        <ul className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {c.cartes.liste.map((x) => (
            <li key={x.titre + x.texte} className="border-t border-ligne pt-6">
              <p className="surtitre">{x.surtitre}</p>
              <h3 className="mt-3 font-display text-3xl leading-[1.1]">{x.titre}</h3>
              <p className="mt-2 text-sm text-ivoire/70">{x.detail}</p>
              <p className="mt-4 text-sable">{x.texte}</p>
            </li>
          ))}
        </ul>
        {c.cartes.aussi && <p className="mt-14 max-w-3xl text-sable">{c.cartes.aussi}</p>}
      </Section>

      <Section surtitre={c.avis.surtitre} titre={c.avis.titre}>
        <ul className="grid gap-10 md:grid-cols-2">
          {c.avis.liste.map((a) => (
            <li key={a.auteurs + a.contexte}>
              <figure className="flex h-full flex-col border-l-2 border-or pl-6">
                <blockquote className="text-lg text-ivoire">« {a.texte} »</blockquote>
                <figcaption className="mt-4 text-sm text-sable">
                  <span className="font-semibold text-ivoire">{a.auteurs}</span> · {a.contexte}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <Bouton href="/avis" variante="lien" className="mt-12">
          {l.avis} →
        </Bouton>
      </Section>

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
            {l.animations} →
          </Bouton>
          <Bouton href="/son-et-lumiere" variante="lien">
            {l.technique} →
          </Bouton>
        </div>
      </Section>

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
