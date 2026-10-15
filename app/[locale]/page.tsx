import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ACCUEIL } from "@/contenu/pages/accueil";
import { OPTIONS } from "@/contenu/options";
import { avis, avisDe, extrait } from "@/contenu/avis";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { GrandAvis, GrilleAvis } from "@/components/common/Avis";
import { BandeauPreuves } from "@/components/common/BandeauPreuves";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Etapes } from "@/components/common/Etapes";
import { Section } from "@/components/common/Section";
import { CarteOption } from "@/components/common/CarteOption";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/", seo: ACCUEIL[locale].seo });
}

const AVIS_ACCUEIL = ["Frédéric & Selda", "Clémentine & Kévin", "Charlotte & David"];

export default async function Accueil({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = ACCUEIL[locale];
  const grand = avisDe("Pierre & Nina", locale);
  const choisis = avis(locale).filter((a) => AVIS_ACCUEIL.includes(a.auteurs)).map((a) => ({ ...a, citation: extrait(a.texte, 260) }));

  return (
    <>
      <EnTetePage image="hero-premiere-danse" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} pleinEcran>
        <Bouton href="/contact">{c.hero.ctaPrincipal}</Bouton>
        <Bouton href="/mariages" variante="contour">{c.hero.ctaSecondaire}</Bouton>
        <span className="text-sm text-ivoire/85">
          Wedding Awards Mariages.net — <span className="text-or">{SITE.weddingAwards.join(" · ")}</span>
        </span>
      </EnTetePage>

      <BandeauPreuves />

      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.dj.titre} />
            </h2>
            {c.dj.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
            <Bouton href="/a-propos" variante="lien" className="mt-8">{c.dj.lien} →</Bouton>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative row-span-2 min-h-[24rem] md:min-h-[32rem]">
              <Photo cle="cedric-platines" remplir sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
            <div className="relative aspect-[4/3]">
              <Photo cle="piste-invites" remplir sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
            <div className="relative aspect-[4/3]">
              <Photo cle="chateau-cour" remplir sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <Section surtitre={c.journee.surtitre} titre={c.journee.titre} intro={c.journee.intro} alterne>
        <Etapes etapes={c.journee.etapes} />
        <Bouton href="/mariages" variante="lien" className="mt-12">{c.journee.lien} →</Bouton>
      </Section>

      <GrandAvis citation={extrait(grand.texte, 300)} auteurs={grand.auteurs} image="chapiteau-diner" />

      <Section surtitre={c.animations.surtitre} titre={c.animations.titre}>
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {OPTIONS.slice(0, 4).map((o) => (
            <li key={o.slug.fr}>
              <CarteOption option={o} locale={locale} />
            </li>
          ))}
        </ul>
        <Bouton href="/animations" variante="lien" className="mt-12">{c.animations.lien} →</Bouton>
      </Section>

      <section className="relative overflow-hidden border-y border-ligne">
        <div className="conteneur grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[3/2]">
            <Photo cle="couple-faisceaux" remplir sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
          <div>
            <p className="surtitre mb-4">{c.evenements.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-5xl">
              <Accent texte={c.evenements.titre} />
            </h2>
            <p className="mt-6 text-lg text-sable">{c.evenements.texte}</p>
            <Bouton href="/evenementiel" variante="lien" className="mt-8">{c.evenements.lien} →</Bouton>
          </div>
        </div>
      </section>

      <Section surtitre={c.avis.surtitre} titre={c.avis.titre}>
        <GrilleAvis liste={choisis} />
        <Bouton href="/avis" variante="lien" className="mt-6">
          {locale === "fr" ? "Lire tous les avis" : "Read all reviews"} →
        </Bouton>
      </Section>

      <AppelContact />
    </>
  );
}
