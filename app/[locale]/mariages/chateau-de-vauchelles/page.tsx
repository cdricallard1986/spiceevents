import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { CHATEAU_DE_VAUCHELLES } from "@/contenu/pages/locales/chateau-de-vauchelles";
import { metadonnees } from "@/lib/seo/metadonnees";
import { PageMariageLocale } from "@/components/mariages/PageMariageLocale";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const c = CHATEAU_DE_VAUCHELLES[locale];
  return metadonnees({ locale, href: "/mariages/chateau-de-vauchelles", seo: c.seo, image: c.photos.entete });
}

// En français et en anglais : beaucoup de couples y viennent de l’étranger.
export default async function PageChateauDeVauchelles({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageMariageLocale c={CHATEAU_DE_VAUCHELLES[locale]} locale={locale} href="/mariages/chateau-de-vauchelles" />;
}
