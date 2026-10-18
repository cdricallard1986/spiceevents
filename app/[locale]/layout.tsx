import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { routing } from "@/i18n/routing";
import { policeDisplay, policeTexte } from "@/lib/polices";
import { SITE } from "@/contenu/site";
import { EnTete } from "@/components/layout/EnTete";
import { PiedDePage } from "@/components/layout/PiedDePage";
import { PillNouvelleVersion } from "@/components/common/PillNouvelleVersion";
import { JsonLd } from "@/components/common/JsonLd";
import { entreprise } from "@/lib/seo/donneesStructurees";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.nom,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e0d12",
  colorScheme: "dark",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Seules « fr » et « en » sont des langues : `/favicon.ico`, `/x.png`… répondent
// 404 au lieu de rendre une page avec une langue inconnue (erreur 500).
export const dynamicParams = false;

export default async function LayoutLangue({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${policeDisplay.variable} ${policeTexte.variable}`}>
      <body className="min-h-dvh bg-nuit text-ivoire">
        <NextIntlClientProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-or focus:px-4 focus:py-2 focus:text-nuit"
          >
            {locale === "fr" ? "Aller au contenu" : "Skip to content"}
          </a>
          <EnTete />
          <main id="contenu">{children}</main>
          <PiedDePage />
          <PillNouvelleVersion />
          <JsonLd donnees={entreprise(locale)} />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
