import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ANIMATIONS, CATEGORIES_ANIMATIONS } from "@/contenu/pages/animations";
import { OPTIONS, optionParSlug } from "@/contenu/options";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { CarteOption } from "@/components/common/CarteOption";
import { CatalogueFiltrable } from "@/components/common/CatalogueFiltrable";
import { Faq } from "@/components/common/Faq";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/animations", seo: ANIMATIONS[locale].seo, image: "presta-vinyles-installation" });
}

/** Page Animations, sur le modèle de la maquette « Nocturne » validée par Cédric. */
export default async function PageAnimations({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = ANIMATIONS[locale];
  const fr = locale === "fr";

  return (
    <>
      {/* Introduction en texte seul : le titre porte la page */}
      <section className="pb-14 pt-36 md:pb-20 md:pt-44">
        <div className="conteneur">
          <p className="surtitre mb-5">{c.intro.surtitre}</p>
          <h1 className="max-w-[12em] font-display text-6xl leading-[0.9] md:text-[6rem]">
            <Accent texte={c.intro.titre} />
          </h1>
          <p className="mt-8 max-w-xl text-lg text-sable">{c.intro.texte}</p>
          <Bouton href={{ pathname: "/animations", hash: "catalogue" }} variante="lien" className="mt-8">
            {fr ? "Composer ma fête" : "Build my party"} ↓
          </Bouton>
        </div>
      </section>

      {/* Deux animations en grand (photos d'événements différents) */}
      <section className="conteneur grid gap-4 pb-20 md:grid-cols-2 md:pb-28">
        {c.vedettes.map((v) => {
          const option = optionParSlug(v.option, "fr");
          if (!option) return null;
          return (
            <Link
              key={v.option}
              href={{ pathname: "/animations/[option]", params: { option: option.slug[locale] } }}
              className="group relative isolate flex min-h-[26rem] items-end overflow-hidden md:min-h-[34rem]"
            >
              <Photo cle={v.image} remplir sizes="(min-width: 768px) 50vw, 100vw" className="-z-10 transition-transform duration-700 group-hover:scale-[1.025]" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(transparent_35%,rgba(0,0,0,0.78))]" />
              <div className="flex w-full items-end justify-between gap-6 p-6 md:p-8">
                <div>
                  <p className="surtitre mb-3">{v.surtitre}</p>
                  <h2 className="font-display text-4xl leading-[0.95] md:text-5xl">{v.titre}</h2>
                  {v.texte && <p className="mt-3 text-ivoire/85">{v.texte}</p>}
                </div>
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center bg-or text-xl text-nuit transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Catalogue filtrable : toutes les animations, chacune vers sa page */}
      <Section id="catalogue" surtitre={c.catalogue.surtitre} titre={c.catalogue.titre} intro={c.catalogue.intro} alterne>
        <CatalogueFiltrable
          categories={c.catalogue.categories}
          libelleTout={c.catalogue.tout}
          libelleFiltres={c.catalogue.filtres}
          cartes={OPTIONS.map((o) => {
            const categorie = CATEGORIES_ANIMATIONS[o.slug.fr];
            return {
              cle: o.slug.fr,
              categorie,
              contenu: <CarteOption option={o} locale={locale} etiquette={c.catalogue.categories[categorie]} texte={c.accroches[o.slug.fr]} />,
            };
          })}
        />
      </Section>

      <Section surtitre={c.faq.surtitre} titre={c.faq.titre}>
        <Faq questions={c.faq.questions} />
        <Bouton href="/faq" variante="lien" className="mt-10">
          {c.faq.lien} →
        </Bouton>
      </Section>

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} />
    </>
  );
}
