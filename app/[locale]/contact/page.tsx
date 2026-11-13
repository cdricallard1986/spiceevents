import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { CONTACT } from "@/contenu/pages/contact";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { BandeauPiment } from "@/components/common/BandeauPiment";
import { FormulaireContact } from "@/components/contact/FormulaireContact";
import { envoyerDemande } from "./actions";
import { LienWeddingAwards } from "@/components/common/LienWeddingAwards";
import { ROMAINS } from "@/components/common/Etapes";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/contact", seo: CONTACT[locale].seo, image: "contact-maries-lumiere" });
}


export default async function PageContact({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTACT[locale];
  const telephone = locale === "fr" ? SITE.telephoneAffiche : "+33 6 76 40 37 76";

  return (
    <>
      {/* Ouverture sans photo : le titre, et la ligne directe en carte orange avec sa pastille. */}
      <section className="overflow-hidden pb-16 pt-36 md:pb-24 md:pt-44">
        <div className="conteneur grid items-end gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <p className="surtitre mb-5">{c.hero.surtitre}</p>
            <h1 className="font-display text-6xl leading-[0.9] md:text-[6.5rem]">
              <Accent texte={c.hero.titre} />
            </h1>
            <p className="mt-8 max-w-xl text-lg text-sable">{c.hero.intro}</p>
          </div>

          <div className="relative pr-6 pt-10 sm:pr-10" data-sans-apparition>
            <div className="rotate-[-2deg] bg-or p-8 text-nuit md:p-10">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.22em]">{c.joindre.titre}</p>
              <a href={`tel:${SITE.telephone}`} className="mt-4 block font-display text-5xl leading-none hover:underline md:text-6xl">
                {telephone}
              </a>
              <a href={`mailto:${SITE.email}`} className="mt-4 block text-lg font-medium underline-offset-4 hover:underline">
                {SITE.email}
              </a>
              <p className="mt-6 border-t border-nuit/25 pt-4 text-sm">{c.joindre.zoneTexte}</p>
            </div>
            <p className="absolute right-0 top-0 flex size-28 rotate-12 items-center justify-center rounded-full border-4 border-nuit bg-ivoire p-3 text-center text-[0.8125rem] font-bold uppercase leading-snug text-nuit sm:size-32">
              {c.joindre.pastille}
            </p>
          </div>
        </div>
      </section>

      <BandeauPiment />

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
            <div className="border border-ligne bg-nuit-2 p-8">
              <p className="font-display text-xl">{c.awards.titre}</p>
              <p className="mt-2 text-sm text-sable">
                <LienWeddingAwards libelle={c.awards.texte} />
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
