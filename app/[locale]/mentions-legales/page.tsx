import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { MENTIONS_LEGALES } from "@/contenu/pages/legal";
import { metadonnees } from "@/lib/seo/metadonnees";
import { PageLegale } from "@/components/legal/PageLegale";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /favicon.ico »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/mentions-legales", seo: MENTIONS_LEGALES[locale].seo });
}

export default async function PageMentionsLegales({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageLegale contenu={MENTIONS_LEGALES[locale]} image="maison-mariage-chapiteau-nuit" />;
}
