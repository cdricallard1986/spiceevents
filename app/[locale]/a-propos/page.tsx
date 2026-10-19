import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { A_PROPOS } from "@/contenu/pages/a-propos";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { GrandAvis } from "@/components/common/Avis";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Etapes } from "@/components/common/Etapes";
import { Section } from "@/components/common/Section";
import { Photo } from "@/components/ui/Photo";
import { classesBouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale }> };

const VIDEO = "https://www.youtube-nocookie.com/embed/zchNbRcZ_gI";

// Langue ou adresse non générée (« /favicon.ico »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/a-propos", seo: A_PROPOS[locale].seo, image: "cedric-platines" });
}

export default async function PageAPropos({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = A_PROPOS[locale];

  return (
    <>
      <EnTetePage image="maison-cedric-portrait" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      {/* Parcours : texte + portrait */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="surtitre mb-4">{c.parcours.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.parcours.titre} />
            </h2>
            {c.parcours.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
          </div>
          <div className="relative aspect-[4/5] lg:aspect-[3/4]">
            <Photo cle="cedric-platines" remplir sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      <GrandAvis citation={c.citationPhare.texte} auteurs={SITE.fondateur} image="maison-cedric-dessus" />

      {/* Aujourd'hui : organisation et recentrage, avec deux citations */}
      <Section surtitre={c.aujourdhui.surtitre} titre={c.aujourdhui.titre}>
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            {c.aujourdhui.paragraphes.map((p, i) => (
              <p key={p} className={`text-lg text-sable ${i > 0 ? "mt-6" : ""}`}>{p}</p>
            ))}
          </div>
          <div className="flex flex-col gap-10">
            {c.aujourdhui.citations.map((q) => (
              <figure key={q.texte} className="border-l-2 border-or pl-6">
                <blockquote className="font-display text-2xl italic leading-snug">« {q.texte} »</blockquote>
                <figcaption className="mt-4 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">
                  {SITE.fondateur}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Section>

      <Section surtitre={c.valeurs.surtitre} titre={c.valeurs.titre} intro={c.valeurs.intro} alterne>
        <Etapes etapes={c.valeurs.liste} />
      </Section>

      {/* Technique et partenariat MX Événement (cible des anciennes adresses « performances techniques ») */}
      <Section id="technique" surtitre={c.technique.surtitre} titre={c.technique.titre} intro={c.technique.intro}>
        <div className="grid gap-12 md:grid-cols-3">
          {c.technique.blocs.map((b) => (
            <div key={b.titre} className="border-t border-ligne pt-6">
              <h3 className="mb-4 text-lg font-semibold tracking-wide">{b.titre}</h3>
              <ul className="flex flex-col gap-3 text-[0.9375rem] text-sable">
                {b.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="text-or">—</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4]">
              <Photo cle="maison-atelier-mx" remplir sizes="(min-width: 1024px) 23vw, 50vw" />
            </div>
            <div className="relative aspect-[3/4]">
              <Photo cle="maison-console" remplir sizes="(min-width: 1024px) 23vw, 50vw" />
            </div>
          </div>
          <div>
            <h3 className="font-display text-3xl leading-[1.1] md:text-4xl">{c.technique.partenariat.titre}</h3>
            <p className="mt-6 text-lg text-sable">{c.technique.partenariat.texte}</p>
            <ul className="mt-6 flex flex-col gap-3 text-sable">
              {c.technique.partenariat.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden="true" className="text-or">—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <a
              href={SITE.partenaireTechnique.url}
              target="_blank"
              rel="noopener"
              className={`${classesBouton("lien")} mt-8`}
            >
              {c.technique.partenariat.lien} →
            </a>
          </div>
        </div>

        <p className="mx-auto mt-20 max-w-3xl text-center font-display text-3xl italic leading-snug md:text-[2.5rem]">
          « {c.technique.citation} »
        </p>
      </Section>

      <Section surtitre={c.video.surtitre} titre={c.video.titre} intro={c.video.intro} alterne>
        <div className="relative aspect-video w-full overflow-hidden border border-ligne bg-nuit">
          <iframe
            src={VIDEO}
            title={c.video.titreLecteur}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </Section>

      <AppelContact />
    </>
  );
}
