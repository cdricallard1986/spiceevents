import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { GALERIE } from "@/contenu/pages/galerie";
import { photosDeGalerie } from "@/lib/photos/lecture";
import { metadonnees } from "@/lib/seo/metadonnees";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { Mosaique } from "@/components/galerie/Mosaique";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /favicon.ico »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/galerie", seo: GALERIE[locale].seo, image: "maison-mariage-charpente" });
}

export default async function PageGalerie({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = GALERIE[locale];
  // Photos gérées dans le back office (/admin/photos) ; listes du code en secours, sans Supabase.
  const [mariages, evenements] = await Promise.all([photosDeGalerie("galerie_mariages", locale), photosDeGalerie("galerie_evenements", locale)]);

  return (
    <>
      <EnTetePage image="maison-mariage-charpente" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      <Section surtitre={c.mariages.surtitre} titre={c.mariages.titre}>
        <Mosaique photos={mariages} />
      </Section>

      <Section surtitre={c.evenements.surtitre} titre={c.evenements.titre} alterne>
        <Mosaique photos={evenements} />
      </Section>

      <AppelContact />
    </>
  );
}
