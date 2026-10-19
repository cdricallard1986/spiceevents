import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { FAQ, questionsFaq } from "@/contenu/pages/faq";
import { pageFaq } from "@/lib/seo/donneesStructurees";
import { metadonnees } from "@/lib/seo/metadonnees";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Faq } from "@/components/common/Faq";
import { JsonLd } from "@/components/common/JsonLd";
import { Bouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /favicon.ico »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/faq", seo: FAQ[locale].seo, image: "maison-cedric-dessus" });
}

export default async function PageFaq({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = FAQ[locale];

  return (
    <>
      <JsonLd donnees={pageFaq(questionsFaq(locale))} />
      <EnTetePage image="maison-cedric-dessus" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      <section className="py-20 md:py-28">
        <div className="conteneur grid gap-14 lg:grid-cols-[15rem_1fr]">
          {/* Sommaire des thèmes, fixe sur grand écran */}
          <nav aria-label={c.sommaire} className="lg:sticky lg:top-28 lg:self-start">
            <p className="surtitre mb-5">{c.sommaire}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 lg:flex-col">
              {c.themes.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-sable transition-colors hover:text-or">
                    {t.titre}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-20">
            {c.themes.map((t) => (
              <section key={t.id} id={t.id} className="scroll-mt-28">
                <h2 className="mb-8 font-display text-3xl leading-[1.1] md:text-4xl">{t.titre}</h2>
                <Faq questions={t.questions} />
                {t.lien && (
                  <Bouton href={t.lien.href} variante="lien" className="mt-8">
                    {t.lien.texte} →
                  </Bouton>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>

      <AppelContact titre={c.contact.titre} texte={c.contact.texte} />
    </>
  );
}
