import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { CONTACT } from "@/contenu/pages/contact";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { EnTetePage } from "@/components/common/EnTetePage";
import { FormulaireContact } from "@/components/contact/FormulaireContact";
import { envoyerDemande } from "./actions";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /favicon.ico »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/contact", seo: CONTACT[locale].seo, image: "contact-maries-lumiere" });
}

const ROMAINS = ["I", "II", "III"];

export default async function PageContact({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTACT[locale];
  const telephone = locale === "fr" ? SITE.telephoneAffiche : "+33 6 76 40 37 76";

  return (
    <>
      <EnTetePage image="contact-maries-lumiere" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      <section className="py-20 md:py-28">
        <div className="conteneur grid gap-16 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
          <div>
            <header className="mb-12 max-w-2xl">
              <p className="surtitre mb-4">{c.formulaire.surtitre}</p>
              <h2 className="font-display text-4xl leading-[1.08] md:text-5xl">
                <Accent texte={c.formulaire.titre} />
              </h2>
              <p className="mt-6 text-lg text-sable">{c.formulaire.intro}</p>
            </header>
            <FormulaireContact action={envoyerDemande} locale={locale} textes={c.formulaire.textes} />
          </div>

          <aside className="flex flex-col gap-12">
            <div>
              <h2 className="surtitre mb-6">{c.joindre.titre}</h2>
              <dl className="flex flex-col gap-5">
                <div>
                  <dt className="text-sm text-sable">{c.joindre.telephone}</dt>
                  <dd>
                    <a href={`tel:${SITE.telephone}`} className="font-display text-2xl transition-colors hover:text-or">
                      {telephone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-sable">{c.joindre.email}</dt>
                  <dd>
                    <a href={`mailto:${SITE.email}`} className="text-lg transition-colors hover:text-or">
                      {SITE.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-sable">{c.joindre.zone}</dt>
                  <dd className="text-lg">{c.joindre.zoneTexte}</dd>
                </div>
              </dl>
            </div>

            <div className="border border-ligne bg-nuit-2 p-8">
              <p className="font-display text-xl">{c.awards.titre}</p>
              <p className="mt-2 text-sm text-sable">
                {c.awards.texte} <span className="text-or">{SITE.weddingAwards.join(" · ")}</span>
              </p>
            </div>

            <div>
              <h2 className="font-display text-3xl leading-[1.1]">
                <Accent texte={c.ensuite.titre} />
              </h2>
              {/* Même présentation que le composant Etapes, en colonne pour tenir à côté du formulaire. */}
              <ol className="mt-8 flex flex-col gap-8">
                {c.ensuite.etapes.map((e, i) => (
                  <li key={e.titre} className="border-t border-ligne pt-6">
                    <p aria-hidden="true" className="mb-3 font-display text-2xl text-or">{ROMAINS[i]}.</p>
                    <h3 className="mb-2 text-lg font-semibold tracking-wide">{e.titre}</h3>
                    <p className="text-[0.9375rem] text-sable">{e.texte}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="border-t border-ligne pt-6 text-sm text-sable">
              {c.rgpd.texte}{" "}
              <Link href="/confidentialite" className="text-or underline-offset-4 hover:underline">
                {c.rgpd.lien}
              </Link>
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
