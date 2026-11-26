import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ESSONNE } from "@/contenu/pages/locales/essonne";
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
  return metadonnees({ locale, href: "/mariages/essonne", seo: ESSONNE.seo, image: ESSONNE.photos.entete });
}

export default async function PageEssonne({ params }: Props) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  setRequestLocale(locale);
  return <PageMariageLocale c={ESSONNE} locale={locale} href="/mariages/essonne" />;
}
