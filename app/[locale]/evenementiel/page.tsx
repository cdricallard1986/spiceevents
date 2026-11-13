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
import { AvisDefilants } from "@/components/common/AvisDefilants";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Faq } from "@/components/common/Faq";
import { GrillePhotos } from "@/components/common/GrillePhotos";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";
import { photosEnTete } from "@/lib/photos/lecture";
import { VideoYoutube } from "@/components/common/VideoYoutube";
import { VIDEOS } from "@/contenu/videos";
import { ROMAINS } from "@/components/common/Etapes";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/evenementiel", seo: EVENEMENTIEL[locale].seo, image: "presta-gala-salle" });
}

// Six soirées différentes, jamais deux photos d’un même événement côte à côte (règle de Cédric) ;
// aucune n’est déjà ailleurs sur la page (cartes, avis, en-tête).
const PHOTOS = [
  "presta-seminaire",
  "maison-evenement-soiree-lumiere",
  "presta-concert-foule",
  "presta-mange-debout",
  "maison-evenement-faisceaux",
  "maison-evenement-cabine-dj",
] as const;

export default async function PageEvenementiel({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = EVENEMENTIEL[locale];
  // Diaporama d’en-tête choisi dans le back office (fiche de chaque photo).
  const entete = await photosEnTete("evenementiel", locale);
  const avisClients = grilleCitations(avisDeCategorie(await avisPublies(), "evenement"), locale);

  return (
    <>
      <EnTetePage image={entete} surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">{locale === "fr" ? "Parler de mon événement" : "Tell us about your event"}</Bouton>
        <Bouton href="/animations" variante="contour">{locale === "fr" ? "Nos animations" : "Our entertainment"}</Bouton>
      </EnTetePage>

      {/* Promesse */}
      <section className="py-20 md:py-28">
        <div className="conteneur">
          <div className="max-w-4xl">
          <p className="surtitre mb-4">{c.promesse.surtitre}</p>
          <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
            <Accent texte={c.promesse.titre} />
          </h2>
          {c.promesse.paragraphes.map((p) => (
            <p key={p} className="mt-6 text-lg text-sable">{p}</p>
          ))}
          </div>
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

      {/* Ce que nous prenons en charge : fond noir, icônes à l’accent (couleur du piment) */}
      <section className="border-y border-ligne bg-nuit py-20 md:py-28">
        <div className="conteneur">
          <p className="surtitre mb-4">{c.services.surtitre}</p>
          <h2 className="font-display text-4xl leading-[0.95] md:text-[3.5rem]">
            <Accent texte={c.services.titre} />
          </h2>
          <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 md:mt-16">
            {c.services.liste.map((s) => (
              <li key={s.titre}>
                <span aria-hidden="true" className="block text-[1.75rem] leading-none text-or">
                  {s.icone}
                </span>
                <h3 className="mb-3 mt-5 text-xl font-semibold tracking-tight">{s.titre}</h3>
                <p className="text-[0.9375rem] text-sable">{s.texte}</p>
              </li>
            ))}
          </ul>
          <Bouton href="/son-et-lumiere" variante="lien" className="mt-12">
            {locale === "fr" ? "Notre matériel son & lumière" : "Our sound & lighting equipment"} →
          </Bouton>
        </div>
      </section>

      {/* Méthode en trois temps, puis deux photos en grand (maquette Nocturne) */}
      <Section surtitre={c.methode.surtitre} titre={c.methode.titre}>
        {/* Même présentation que les étapes des autres pages (chiffres romains), avec le verbe de l’étape. */}
        <ol className="grid gap-10 md:grid-cols-3">
          {c.methode.etapes.map((e, i) => (
            <li key={e.titre} className="border-t border-ligne pt-6">
              <p className="mb-3 flex items-baseline gap-3">
                <span aria-hidden="true" className="font-display text-2xl text-or">
                  {ROMAINS[i]}.
                </span>
                <span className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-sable">{e.numero}</span>
              </p>
              <h3 className="mb-2 text-lg font-semibold tracking-wide">{e.titre}</h3>
              <p className="text-[0.9375rem] text-sable">{e.texte}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          {c.methode.vedettes.map((v) => (
            <figure key={v.titre} className="group relative isolate flex min-h-[20rem] items-end overflow-hidden md:min-h-[26rem]">
              <Photo cle={v.image} remplir sizes="(min-width: 768px) 55vw, 100vw" className="-z-10 transition-transform duration-700 group-hover:scale-[1.025]" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(transparent_40%,rgba(0,0,0,0.75))]" />
              <figcaption className="texte-sur-photo p-6 md:p-8">
                <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-ivoire">{v.surtitre}</p>
                <p className="font-display text-3xl leading-[0.95] md:text-4xl">{v.titre}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Un set de Cédric (DJ Dioz) en montagne, sur la chaîne YouTube */}
      <Section surtitre={c.video.surtitre} titre={c.video.titre} intro={c.video.intro} alterne>
        <VideoYoutube video={VIDEOS.mixMontagne} locale={locale} />
      </Section>

      <Section surtitre={c.galerie.surtitre} titre={c.galerie.titre}>
        <GrillePhotos cles={PHOTOS} />
        <Bouton href="/galerie" variante="lien" className="mt-10">{c.galerie.lien} →</Bouton>
      </Section>

      {/* Cinq avis clients tirés au hasard à chaque visite, qui se succèdent sur photo de fond */}
      <AvisDefilants
        liste={avisClients}
        tirage={5}
        image="maison-evenement-bal"
        libelles={
          locale === "fr"
            ? { precedent: "Avis précédent", suivant: "Avis suivant", avis: "Avis" }
            : { precedent: "Previous review", suivant: "Next review", avis: "Review" }
        }
      >
        <p className="mt-10 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-sable">{c.avis.surtitre}</p>
        <Bouton href="/avis" variante="lien" className="mt-3 text-[0.75rem]">
          {locale === "fr" ? "Voir tous les avis" : "See all reviews"} →
        </Bouton>
      </AvisDefilants>

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
