import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { RECRUTEMENT } from "@/contenu/pages/recrutement";
import { SITE } from "@/contenu/site";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { Photo } from "@/components/ui/Photo";
import { classesBouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale }> };

// Page en français seulement : seule la version française est générée, l'anglais renvoie une 404.
export function generateStaticParams() {
  return [{ locale: "fr" }];
}

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "fr") return {};
  return metadonnees({ locale, href: "/recrutement", seo: RECRUTEMENT.seo, image: "maison-recrutement-platines" });
}

export default async function PageRecrutement({ params }: Props) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  setRequestLocale(locale);
  const c = RECRUTEMENT;
  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(c.candidature.objet)}`;

  return (
    <>
      <EnTetePage image="maison-recrutement-platines" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="surtitre mb-4">{c.poste.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.poste.titre} />
            </h2>
            {c.poste.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
          </div>
          <div className="relative aspect-[4/5]">
            <Photo cle="maison-evenement-dj-vue-haut" remplir sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      <section className="bg-nuit-2 py-20 md:py-28">
        <div className="conteneur grid gap-14 md:grid-cols-2">
          {[c.profil, c.missions].map((bloc) => (
            <div key={bloc.titre} className="border-t border-ligne pt-6">
              <h2 className="mb-6 font-display text-3xl leading-[1.1] md:text-4xl">{bloc.titre}</h2>
              <ul className="flex flex-col gap-3 text-sable">
                {bloc.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="text-or">—</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Section surtitre={c.pourquoi.surtitre} titre={c.pourquoi.titre} intro={c.pourquoi.texte} />

      <section className="border-t border-ligne">
        <div className="conteneur flex flex-wrap items-end justify-between gap-10 py-24 md:py-32">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl leading-[1.05] md:text-6xl">
              <Accent texte={c.candidature.titre} />
            </h2>
            <p className="mt-6 text-lg text-sable">{c.candidature.texte}</p>
          </div>
          <a href={mailto} className={classesBouton("primaire")}>
            {c.candidature.bouton}
          </a>
        </div>
      </section>
    </>
  );
}
