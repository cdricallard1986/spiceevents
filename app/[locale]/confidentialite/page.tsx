import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { CONFIDENTIALITE } from "@/contenu/pages/legal";
import { metadonnees } from "@/lib/seo/metadonnees";
import { PageLegale } from "@/components/legal/PageLegale";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/confidentialite", seo: CONFIDENTIALITE[locale].seo });
}

export default async function PageConfidentialite({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageLegale contenu={CONFIDENTIALITE[locale]} image="maison-mariage-chapiteau-nuit" />;
}
