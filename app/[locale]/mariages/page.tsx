import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { MARIAGES } from "@/contenu/pages/mariages";
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
import { Faq } from "@/components/common/Faq";
import { GrillePhotos } from "@/components/common/GrillePhotos";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/mariages", seo: MARIAGES[locale].seo, image: "presta-mariage-hero" });
}

const ROMAINS = ["I", "II", "III", "IV", "V"];

/** Avis mis en avant (vrais avis de mariés, choisis pour couvrir toute la journée). */
const AVIS_GRAND = "Harold & David";
const AVIS_GRILLE = [
  "Aaron & Niamha",
  "Pascal & Abigaïl",
  "Marine & Gaëtan",
  "David & Elodie",
  "Azline & Edouard",
  "Quentin & Pauline",
];

const PHOTOS = [
  "presta-maries-enlaces",
  "presta-mariee-piste",
  "presta-salle-rouge",
  "presta-boules-disco",
  "presta-piste-laser",
] as const;

export default async function PageMariages({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = MARIAGES[locale];
  const tous = avis(locale, "mariage");
  const grand = avisDe(AVIS_GRAND, locale);
  const choisis = AVIS_GRILLE.flatMap((nom) => tous.filter((a) => a.auteurs === nom).slice(0, 1)).map((a) => ({
    ...a,
    citation: extrait(a.texte, 260),
  }));

  return (
    <>
      <EnTetePage image="presta-mariage-hero" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">{c.hero.ctaPrincipal}</Bouton>
        <Bouton href={{ pathname: "/mariages", hash: "methode" }} variante="contour">{c.hero.ctaSecondaire}</Bouton>
        <span className="text-sm text-ivoire/85">
          Wedding Awards Mariages.net — <span className="text-or">{SITE.weddingAwards.join(" · ")}</span>
        </span>
      </EnTetePage>

      <BandeauPreuves />

      {/* Promesse et garanties */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid gap-14 lg:grid-cols-2">
          <div>
            <p className="surtitre mb-4">{c.promesse.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.promesse.titre} />
            </h2>
            {c.promesse.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
          </div>
          <ul className="grid gap-10 self-end sm:grid-cols-2">
            {c.promesse.garanties.map((g) => (
              <li key={g.titre} className="border-t border-ligne pt-6">
                <h3 className="mb-2 text-lg font-semibold tracking-wide">{g.titre}</h3>
                <p className="text-[0.9375rem] text-sable">{g.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* La journée, moment par moment, avec les options correspondantes */}
      <Section surtitre={c.journee.surtitre} titre={c.journee.titre} intro={c.journee.intro} alterne>
        <ol className="flex flex-col gap-16 md:gap-20">
          {c.journee.moments.map((m, i) => {
            const options = m.options.flatMap((slug) => OPTIONS.filter((o) => o.slug.fr === slug));
            return (
              <li key={m.titre} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <div className={`relative aspect-[3/2] ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <Photo cle={m.image} remplir sizes="(min-width: 768px) 45vw, 100vw" />
                </div>
                <div>
                  <p aria-hidden="true" className="mb-3 font-display text-2xl text-or">{ROMAINS[i]}.</p>
                  <h3 className="font-display text-3xl leading-[1.1] md:text-4xl">{m.titre}</h3>
                  <p className="mt-5 text-lg text-sable">{m.texte}</p>
                  {options.length > 0 && (
                    <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                      {options.map((o) => (
                        <li key={o.slug.fr}>
                          <Bouton
                            href={{ pathname: "/animations/[option]", params: { option: o.slug[locale] } }}
                            variante="lien"
                          >
                            {o.titre[locale]} →
                          </Bouton>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* Méthode : cible de l'ancienne page /accompagnement */}
      <Section id="methode" surtitre={c.methode.surtitre} titre={c.methode.titre} intro={c.methode.intro}>
        <Etapes etapes={c.methode.etapes} />
        <p className="mx-auto mt-20 max-w-3xl text-center font-display text-3xl italic leading-snug md:text-[2.5rem]">
          « {c.methode.citation} »
        </p>
      </Section>

      {/* Le DJ */}
      <section className="border-y border-ligne bg-nuit-2 py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative aspect-[3/4] max-h-[44rem]">
            <Photo cle="presta-cedric-portrait" remplir sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div>
            <p className="surtitre mb-4">{c.dj.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.dj.titre} />
            </h2>
            <figure className="mt-8 border-l-2 border-or pl-6">
              <blockquote className="font-display text-2xl italic leading-snug">« {c.dj.citation} »</blockquote>
              <figcaption className="mt-4 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">
                {SITE.fondateur}
              </figcaption>
            </figure>
            {c.dj.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {c.dj.differences.map((d) => (
                <li key={d.titre} className="border-t border-ligne pt-5">
                  <h3 className="mb-2 font-semibold tracking-wide">{d.titre}</h3>
                  <p className="text-[0.9375rem] text-sable">{d.texte}</p>
                </li>
              ))}
            </ul>
            <Bouton href="/a-propos" variante="lien" className="mt-10">{c.dj.lien} →</Bouton>
          </div>
        </div>
      </section>

      <Section surtitre={c.photos.surtitre} titre={c.photos.titre}>
        <GrillePhotos cles={PHOTOS} />
        <Bouton href="/galerie" variante="lien" className="mt-10">{c.photos.lien} →</Bouton>
      </Section>

      <GrandAvis citation={extrait(grand.texte, 320)} auteurs={grand.auteurs} image="presta-diner-chateau" />

      <Section surtitre={c.avis.surtitre} titre={c.avis.titre}>
        <GrilleAvis liste={choisis} />
        <Bouton href="/avis" variante="lien" className="mt-6">{c.avis.lien} →</Bouton>
      </Section>

      <Section surtitre={c.faq.surtitre} titre={c.faq.titre} alterne>
        <Faq questions={c.faq.questions} />
        <Bouton href="/faq" variante="lien" className="mt-10">{c.faq.lien} →</Bouton>
      </Section>

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} />
    </>
  );
}
