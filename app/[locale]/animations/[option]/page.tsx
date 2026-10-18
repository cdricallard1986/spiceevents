import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { OPTIONS, optionParSlug, type Option } from "@/contenu/options";
import { contenuOption } from "@/contenu/pages/options";
import { emplacementOption } from "@/lib/avis/constantes";
import { avisPublies } from "@/lib/avis/lecture";
import { grandAvis } from "@/lib/avis/selection";
import { MINIMUM_PHOTOS_OPTION, galerieOption } from "@/lib/photos/constantes";
import { photosDeGalerie } from "@/lib/photos/lecture";
import { adresse, metadonnees } from "@/lib/seo/metadonnees";
import { filAriane } from "@/lib/seo/donneesStructurees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { GrandAvis } from "@/components/common/Avis";
import { CarteOption } from "@/components/common/CarteOption";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Etapes } from "@/components/common/Etapes";
import { GrillePhotos } from "@/components/common/GrillePhotos";
import { JsonLd } from "@/components/common/JsonLd";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale; option: string }> };

/** Chaque option, sous son slug traduit, dans la langue de la page parente. */
export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  return OPTIONS.map((o) => ({ option: o.slug[locale] }));
}

/** Adresse de l'option dans une langue (slug traduit). */
function hrefOption(option: Option, locale: Locale) {
  return { pathname: "/animations/[option]" as const, params: { option: option.slug[locale] } };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, option: slug } = await params;
  const option = optionParSlug(slug, locale);
  if (!option) notFound();
  const c = contenuOption(option);
  return metadonnees({
    locale,
    href: hrefOption(option, locale),
    seo: c.textes[locale].seo,
    image: c.image,
    alternatives: { fr: hrefOption(option, "fr"), en: hrefOption(option, "en") },
  });
}

/** Quatre autres options, à la suite de celle-ci dans la liste. */
function autresOptions(option: Option) {
  const i = OPTIONS.indexOf(option);
  return [1, 2, 3, 4].map((d) => OPTIONS[(i + d) % OPTIONS.length]);
}

export default async function PageOption({ params }: Props) {
  const { locale, option: slug } = await params;
  setRequestLocale(locale);
  const option = optionParSlug(slug, locale);
  if (!option) notFound();
  const c = contenuOption(option);
  const t = c.textes[locale];
  const fr = locale === "fr";
  // Avis choisi dans le back office (emplacement « Page <option> ») ; sa citation commence d'ordinaire à la phrase sur l'option.
  const avisOption = grandAvis(await avisPublies(), emplacementOption(option.slug.fr), locale, 260);
  // Photos choisies dans le back office (galerie « option:<slug> ») ; listes du code en secours, sans Supabase.
  const galerie = await photosDeGalerie(galerieOption(option.slug.fr), locale);

  const ariane = filAriane([
    { nom: fr ? "Accueil" : "Home", url: adresse("/", locale) },
    { nom: fr ? "Animations" : "Entertainment", url: adresse("/animations", locale) },
    { nom: option.titre[locale], url: adresse(hrefOption(option, locale), locale) },
  ]);

  return (
    <>
      <JsonLd donnees={ariane} />

      <EnTetePage image={c.image} surtitre={t.hero.surtitre} titre={t.hero.titre} intro={t.hero.intro}>
        <Bouton href="/contact">{fr ? "Demander un devis" : "Request a quote"}</Bouton>
        <Bouton href="/animations" variante="contour">{fr ? "Toutes les animations" : "All entertainment"}</Bouton>
      </EnTetePage>

      {/* Présentation : le texte, et à côté ce qui est inclus / les usages. */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="surtitre mb-4">{t.presentation.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={t.presentation.titre} />
            </h2>
            {t.presentation.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
            {t.avertissement && (
              <p className="mt-10 border-l-2 border-or pl-6 text-ivoire/90">
                <span className="font-semibold text-or">{fr ? "À noter : " : "Please note: "}</span>
                {t.avertissement}
              </p>
            )}
          </div>
          {t.listes && (
            <div className="flex flex-col gap-6 self-start">
              {t.listes.map((l) => (
                <div key={l.titre} className="border border-ligne bg-nuit-2 p-8">
                  <h3 className="mb-4 text-lg font-semibold tracking-wide">{l.titre}</h3>
                  {l.intro && <p className="mb-4 text-[0.9375rem] text-sable">{l.intro}</p>}
                  <ul className="flex flex-col gap-3 text-[0.9375rem] text-sable">
                    {l.points.map((p) => (
                      <li key={p} className="flex gap-3">
                        <span aria-hidden="true" className="text-or">—</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {t.etapes && (
        <Section surtitre={t.etapes.surtitre} titre={t.etapes.titre} alterne>
          <Etapes etapes={t.etapes.liste} />
        </Section>
      )}

      {/* Galerie seulement avec assez de vraies photos de nos prestations. */}
      {galerie.length >= MINIMUM_PHOTOS_OPTION && (
        <Section
          surtitre={fr ? "En images" : "In pictures"}
          titre={fr ? `${option.titre.fr}, *en situation*.` : `${option.titre.en}, *in action*.`}
          alterne={!t.etapes}
        >
          <GrillePhotos photos={galerie} />
        </Section>
      )}

      {avisOption && <GrandAvis citation={avisOption.texte} auteurs={avisOption.auteurs} langue={avisOption.langue} image={c.imageAvis ?? c.image} />}

      <Section surtitre={fr ? "À combiner" : "Mix and match"} titre={fr ? "D'autres idées pour *votre fête*." : "More ideas for *your celebration*."}>
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {autresOptions(option).map((o) => (
            <li key={o.slug.fr}>
              <CarteOption option={o} locale={locale} />
            </li>
          ))}
        </ul>
        <Bouton href="/animations" variante="lien" className="mt-12">
          {fr ? "Toutes les animations" : "All entertainment"} →
        </Bouton>
      </Section>

      <AppelContact titre={t.appel.titre} texte={t.appel.texte} />
    </>
  );
}
