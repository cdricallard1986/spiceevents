import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { GALERIE, PHOTOS_EVENEMENTS, PHOTOS_MARIAGES } from "@/contenu/pages/galerie";
import { metadonnees } from "@/lib/seo/metadonnees";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { Mosaique } from "@/components/galerie/Mosaique";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/galerie", seo: GALERIE[locale].seo, image: "maison-mariage-charpente" });
}

export default async function PageGalerie({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = GALERIE[locale];

  return (
    <>
      <EnTetePage image="maison-mariage-charpente" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      <Section surtitre={c.mariages.surtitre} titre={c.mariages.titre}>
        <Mosaique photos={PHOTOS_MARIAGES} />
      </Section>

      <Section surtitre={c.evenements.surtitre} titre={c.evenements.titre} alterne>
        <Mosaique photos={PHOTOS_EVENEMENTS} />
      </Section>

      <AppelContact />
    </>
  );
}
