import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PAGE_AVIS } from "@/contenu/pages/avis";
import { avis } from "@/contenu/avis";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { GrilleAvis } from "@/components/common/Avis";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { classesBouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/avis", seo: PAGE_AVIS[locale].seo, image: "maison-mariage-chapiteau-ovation" });
}

export default async function PageAvis({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = PAGE_AVIS[locale];
  const liste = avis(locale);
  const mariages = liste.filter((a) => a.categorie === "mariage");
  const evenements = liste.filter((a) => a.categorie === "evenement");
  const annees = new Intl.ListFormat(locale, { type: "conjunction" }).format(SITE.weddingAwards.map(String));

  return (
    <>
      <EnTetePage image="maison-mariage-chapiteau-ovation" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      {/* Distinctions Mariages.net */}
      <section className="border-y border-ligne">
        <div className="conteneur grid items-center gap-10 py-14 md:grid-cols-[1fr_auto]">
          <div>
            <p className="surtitre mb-3">{c.awards.surtitre}</p>
            <h2 className="font-display text-3xl leading-[1.1] md:text-4xl">
              <Accent texte={c.awards.titre} />
            </h2>
            <p className="mt-3 text-sable">{c.awards.texte(annees)}</p>
          </div>
          <ul className="flex flex-wrap gap-x-10 gap-y-4">
            {SITE.weddingAwards.map((annee) => (
              <li key={annee} className="font-display text-4xl text-or md:text-5xl">
                {annee}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section surtitre={c.mariages.surtitre} titre={c.mariages.titre}>
        <GrilleAvis liste={mariages} />
      </Section>

      <Section surtitre={c.evenements.surtitre} titre={c.evenements.titre} className="border-t border-ligne">
        <GrilleAvis liste={evenements} />
      </Section>

      <Section surtitre={c.mariagesNet.surtitre} titre={c.mariagesNet.titre} intro={c.mariagesNet.texte} alterne>
        <a href={SITE.reseaux.mariagesNet} target="_blank" rel="noopener" className={classesBouton("contour")}>
          {c.mariagesNet.lien} →
        </a>
      </Section>

      <AppelContact />
    </>
  );
}
