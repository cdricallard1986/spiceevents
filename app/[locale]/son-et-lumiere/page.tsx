import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { FAQ } from "@/contenu/pages/faq";
import { SON_ET_LUMIERE } from "@/contenu/pages/son-et-lumiere";
import { OPTIONS } from "@/contenu/options";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { CarteOption } from "@/components/common/CarteOption";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Etapes } from "@/components/common/Etapes";
import { Faq } from "@/components/common/Faq";
import { Section } from "@/components/common/Section";
import { Bouton, classesBouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

/** Vidéo de présentation de MX Événement (celle de l'ancienne page « performances techniques »). */
const VIDEO = "https://www.youtube-nocookie.com/embed/DWSC6XgbY_M";

/** Installations liées à la technique, présentées en bas de page. */
const OPTIONS_TECHNIQUES = ["sonorisation-ceremonie-laique", "sonorisation-deportee", "ouverture-de-bal", "guirlandes-lumineuses"];

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/son-et-lumiere", seo: SON_ET_LUMIERE[locale].seo, image: "son-lumiere-installation" });
}

export default async function PageSonEtLumiere({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = SON_ET_LUMIERE[locale];
  const fr = locale === "fr";
  const questions = FAQ[locale].themes.find((t) => t.id === "technique")?.questions ?? [];
  const options = OPTIONS.filter((o) => OPTIONS_TECHNIQUES.includes(o.slug.fr));

  return (
    <>
      <EnTetePage image={["son-lumiere-installation", "son-lumiere-regie-lets-dance"]} surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">{fr ? "Demander un devis" : "Request a quote"}</Bouton>
        <Bouton href={{ pathname: "/son-et-lumiere", hash: "materiel" }} variante="contour">
          {fr ? "Voir le matériel" : "See the equipment"}
        </Bouton>
      </EnTetePage>

      {/* Promesse et citation */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="surtitre mb-4">{c.promesse.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.promesse.titre} />
            </h2>
            {c.promesse.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
          </div>
          <figure className="border-l-2 border-or pl-6">
            <blockquote className="font-display text-3xl font-semibold leading-snug md:text-4xl">« {c.promesse.citation} »</blockquote>
          </figure>
        </div>
      </section>

      {/* Le matériel, par famille, avec une photo du vrai matériel (jamais deux du même événement côte à côte) */}
      <Section id="materiel" surtitre={c.materiel.surtitre} titre={c.materiel.titre} intro={c.materiel.intro} alterne>
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {c.materiel.familles.map((f) => (
            <li key={f.titre} className="flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Photo cle={f.image} remplir sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </div>
              <h3 className="mt-6 font-display text-2xl">{f.titre}</h3>
              <p className="mt-3 text-[0.9375rem] text-sable">{f.texte}</p>
              <ul className="mt-5 flex flex-col gap-2.5 border-t border-ligne pt-5 text-[0.9375rem]">
                {f.modeles.map((m) => (
                  <li key={m} className="flex gap-3">
                    <span aria-hidden="true" className="text-or">—</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-12 max-w-3xl text-sable">{c.materiel.note}</p>
      </Section>

      {/* Avant chaque date */}
      <Section surtitre={c.preparation.surtitre} titre={c.preparation.titre} intro={c.preparation.intro}>
        <Etapes etapes={c.preparation.etapes} />
      </Section>

      {/* Sécurité : photo + liste */}
      <section className="border-y border-ligne bg-nuit-2 py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4]">
              <Photo cle="materiel-projecteurs-rack" remplir sizes="(min-width: 1024px) 23vw, 50vw" />
            </div>
            <div className="relative aspect-[3/4]">
              <Photo cle="materiel-connectique" remplir sizes="(min-width: 1024px) 23vw, 50vw" />
            </div>
          </div>
          <div>
            <p className="surtitre mb-4">{c.securite.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.25rem]">
              <Accent texte={c.securite.titre} />
            </h2>
            <p className="mt-6 text-lg text-sable">{c.securite.intro}</p>
            <ul className="mt-8 flex flex-col gap-4">
              {c.securite.points.map((p) => (
                <li key={p} className="flex gap-4 border-t border-ligne pt-4 text-[0.9375rem] text-sable">
                  <span aria-hidden="true" className="text-or">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Le partenaire MX Événement */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="surtitre mb-4">{c.partenaire.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.partenaire.titre} />
            </h2>
            {c.partenaire.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
            <ul className="mt-6 flex flex-col gap-3 text-sable">
              {c.partenaire.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden="true" className="text-or">—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <a href={SITE.partenaireTechnique.url} target="_blank" rel="noopener" className={`${classesBouton("lien")} mt-8`}>
              {c.partenaire.lien} ↗
            </a>
          </div>
          <div className="relative aspect-[4/5] lg:aspect-[3/4]">
            <Photo cle="materiel-atelier" remplir sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
        </div>
      </section>

      <Section surtitre={c.video.surtitre} titre={c.video.titre} alterne>
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

      {/* Les installations qui s'appuient sur cette technique */}
      <Section titre={c.liens.titre} intro={c.liens.texte}>
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((o) => (
            <li key={o.slug.fr}>
              <CarteOption option={o} locale={locale} />
            </li>
          ))}
        </ul>
      </Section>

      {questions.length > 0 && (
        <Section surtitre={c.faq.surtitre} titre={c.faq.titre} alterne>
          <Faq questions={questions} />
          <Bouton href={{ pathname: "/faq", hash: "technique" }} variante="lien" className="mt-10">
            {c.faq.lien} →
          </Bouton>
        </Section>
      )}

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} />
    </>
  );
}
