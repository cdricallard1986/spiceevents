import type { Metadata } from "next";
import { DerniersArticles } from "@/components/journal/DerniersArticles";
import { CATEGORIES_EVENEMENT } from "@/lib/journal/constantes";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { EVENEMENTIEL } from "@/contenu/pages/evenementiel";
import { avisPublies } from "@/lib/avis/lecture";
import { avisDeCategorie, grilleCitations } from "@/lib/avis/selection";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { GrilleAvis } from "@/components/common/Avis";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Etapes } from "@/components/common/Etapes";
import { Faq } from "@/components/common/Faq";
import { GrillePhotos } from "@/components/common/GrillePhotos";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/evenementiel", seo: EVENEMENTIEL[locale].seo, image: "presta-gala-salle" });
}

const PHOTOS = [
  "presta-seminaire",
  "presta-lancement",
  "presta-concert-foule",
  "presta-mange-debout",
  "presta-dj-scene",
  "presta-soiree-privee",
] as const;

export default async function PageEvenementiel({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = EVENEMENTIEL[locale];
  const avisClients = grilleCitations(avisDeCategorie(await avisPublies(), "evenement"), locale);

  return (
    <>
      <EnTetePage image="presta-gala-salle" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">{locale === "fr" ? "Parler de mon événement" : "Tell us about your event"}</Bouton>
        <Bouton href="/animations" variante="contour">{locale === "fr" ? "Nos animations" : "Our entertainment"}</Bouton>
      </EnTetePage>

      {/* Promesse */}
      <section className="py-20 md:py-28">
        <div className="conteneur max-w-4xl">
          <p className="surtitre mb-4">{c.promesse.surtitre}</p>
          <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
            <Accent texte={c.promesse.titre} />
          </h2>
          {c.promesse.paragraphes.map((p) => (
            <p key={p} className="mt-6 text-lg text-sable">{p}</p>
          ))}
        </div>
      </section>

      {/* Soirées privées et entreprises */}
      <Section surtitre={c.formats.surtitre} titre={c.formats.titre} alterne>
        <ul className="grid gap-14 lg:grid-cols-2">
          {c.formats.liste.map((f) => (
            <li key={f.titre} className="flex flex-col gap-6">
              <div className="relative aspect-[3/2]">
                <Photo cle={f.image} remplir sizes="(min-width: 1024px) 45vw, 100vw" />
              </div>
              <h3 className="font-display text-3xl leading-[1.1] md:text-4xl">{f.titre}</h3>
              <p className="text-lg text-sable">{f.texte}</p>
              <ul className="flex flex-col gap-3 text-sable">
                {f.exemples.map((e) => (
                  <li key={e} className="flex gap-3">
                    <span aria-hidden="true" className="text-or">—</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section surtitre={c.services.surtitre} titre={c.services.titre} intro={c.services.intro}>
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {c.services.liste.map((s) => (
            <li key={s.titre} className="border-t border-ligne pt-6">
              <h3 className="mb-2 text-lg font-semibold tracking-wide">{s.titre}</h3>
              <p className="text-[0.9375rem] text-sable">{s.texte}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section surtitre={c.methode.surtitre} titre={c.methode.titre} alterne>
        <Etapes etapes={c.methode.etapes} />
      </Section>

      <Section surtitre={c.galerie.surtitre} titre={c.galerie.titre}>
        <GrillePhotos cles={PHOTOS} />
        <Bouton href="/galerie" variante="lien" className="mt-10">{c.galerie.lien} →</Bouton>
      </Section>

      <Section surtitre={c.avis.surtitre} titre={c.avis.titre} alterne>
        <GrilleAvis liste={avisClients} />
        <Bouton href="/avis" variante="lien" className="mt-6">
          {locale === "fr" ? "Lire tous les avis" : "Read all reviews"} →
        </Bouton>
      </Section>

      <Section surtitre={c.faq.surtitre} titre={c.faq.titre}>
        <Faq questions={c.faq.questions} />
        <Bouton href="/faq" variante="lien" className="mt-10">
          {locale === "fr" ? "Toutes les questions" : "All questions"} →
        </Bouton>
      </Section>

      <DerniersArticles locale={locale} surtitre="Journal" titre="Son, lumière *et ambiance*" categories={CATEGORIES_EVENEMENT} alterne />

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} />
    </>
  );
}
