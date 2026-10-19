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
import { BarreDev } from "@/components/admin/BarreDev";
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

// Seules « fr » et « en » sont des langues : `/favicon.ico`, `/x.png`… doivent
// répondre 404 au lieu de rendre une page avec une langue inconnue (erreur 500).
// Ce n'est PAS déclaré ici par `dynamicParams = false` : Next l'appliquerait à
// toutes les pages sous [locale], y compris les articles du journal, qui
// doivent être rendus à la demande (article publié après le déploiement).
// Chaque page le déclare donc elle-même, sauf `journal/[slug]` et la page
// 404 `[...reste]` ; ici, `hasLocale` reste le garde-fou.

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
          <BarreDev />
          <JsonLd donnees={entreprise(locale)} />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
