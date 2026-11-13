import type { Metadata, Viewport } from "next";
import { SITE } from "@/contenu/site";
import { policeDisplay, policeTexte } from "@/lib/polices";
import { PillVersion } from "@/components/common/PillNouvelleVersion";
import { FournisseurToasts } from "@/components/admin/Toasts";
import { BarreDev } from "@/components/admin/BarreDev";
import messages from "@/messages/fr.json";
import "../globals.css";

/**
 * Mise en page racine du back office. `/admin` vit hors de `[locale]` (français
 * seul, hors next-intl) : c’est une seconde mise en page racine, avec son
 * propre `<html>`. Le segment statique `admin` passe avant `[locale]`, qui ne
 * peut donc jamais le capturer ; aller du site au back office recharge la page.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Back office", template: `%s · Back office ${SITE.nom}` },
  // Jamais indexé (balise meta ici + en-tête X-Robots-Tag ; robots.txt laisse lire ce « noindex »).
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  colorScheme: "dark",
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${policeDisplay.variable} ${policeTexte.variable}`}>
      <body className="min-h-dvh bg-nuit text-ivoire">
        <FournisseurToasts>
          {children}
          <PillVersion disponible={messages.version.disponible} recharger={messages.version.recharger} />
          <BarreDev />
        </FournisseurToasts>
      </body>
    </html>
  );
}
