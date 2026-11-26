import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { SEINE_ET_MARNE } from "@/contenu/pages/locales/seine-et-marne";
import { metadonnees } from "@/lib/seo/metadonnees";
import { PageMariageLocale } from "@/components/mariages/PageMariageLocale";

type Props = { params: Promise<{ locale: Locale }> };

// Page en français seulement : seule la version française est générée, l’anglais renvoie une 404.
export function generateStaticParams() {
  return [{ locale: "fr" }];
}

// Langue ou adresse non générée → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "fr") return {};
  return metadonnees({ locale, href: "/mariages/seine-et-marne", seo: SEINE_ET_MARNE.seo, image: SEINE_ET_MARNE.photos.entete });
}

export default async function PageSeineEtMarne({ params }: Props) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  setRequestLocale(locale);
  return <PageMariageLocale c={SEINE_ET_MARNE} locale={locale} href="/mariages/seine-et-marne" />;
}
