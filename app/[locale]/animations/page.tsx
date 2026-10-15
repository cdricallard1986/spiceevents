import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ANIMATIONS } from "@/contenu/pages/animations";
import { OPTIONS } from "@/contenu/options";
import { metadonnees } from "@/lib/seo/metadonnees";
import { AppelContact } from "@/components/common/AppelContact";
import { CarteOption } from "@/components/common/CarteOption";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Faq } from "@/components/common/Faq";
import { Section } from "@/components/common/Section";
import { Accent } from "@/components/common/Accent";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/animations", seo: ANIMATIONS[locale].seo, image: "presta-photobooth-temoins" });
}

export default async function PageAnimations({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = ANIMATIONS[locale];
  const fr = locale === "fr";

  return (
    <>
      <EnTetePage image="presta-chateau-mapping" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href={{ pathname: "/animations", hash: "options" }}>{fr ? "Voir les animations" : "See the ideas"}</Bouton>
        <Bouton href="/contact" variante="contour">{fr ? "Demander un devis" : "Request a quote"}</Bouton>
      </EnTetePage>

      {/* Approche : texte et citation */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="surtitre mb-4">{c.intro.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.intro.titre} />
            </h2>
            {c.intro.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
          </div>
          <figure className="border-l-2 border-or pl-6">
            <blockquote className="font-display text-3xl italic leading-snug md:text-4xl">« {c.intro.citation} »</blockquote>
          </figure>
        </div>
      </section>

      <Section id="options" surtitre={c.options.surtitre} titre={c.options.titre} intro={c.options.intro} alterne>
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {OPTIONS.map((o) => (
            <li key={o.slug.fr}>
              <CarteOption option={o} locale={locale} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Autres idées, sans page dédiée */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative min-h-[22rem] lg:min-h-0">
            <Photo cle="presta-mapping-facade" remplir sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div>
            <p className="surtitre mb-4">{c.idees.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.idees.titre} />
            </h2>
            <p className="mt-6 text-lg text-sable">{c.idees.intro}</p>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2">
              {c.idees.liste.map((i) => (
                <li key={i.titre} className="border-t border-ligne pt-6">
                  <h3 className="mb-2 text-lg font-semibold tracking-wide">{i.titre}</h3>
                  <p className="text-[0.9375rem] text-sable">{i.texte}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm text-sable">{c.idees.note}</p>
          </div>
        </div>
      </section>

      <Section surtitre={c.faq.surtitre} titre={c.faq.titre} alterne>
        <Faq questions={c.faq.questions} />
        <Bouton href="/faq" variante="lien" className="mt-10">
          {fr ? "Toutes les questions" : "All questions"} →
        </Bouton>
      </Section>

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} />
    </>
  );
}
