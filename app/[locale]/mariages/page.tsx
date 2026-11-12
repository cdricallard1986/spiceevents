import type { Metadata } from "next";
import { DerniersArticles } from "@/components/journal/DerniersArticles";
import { CATEGORIES_MARIAGE } from "@/lib/journal/constantes";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { IMAGES_ACCUEIL_MARIAGES, MARIAGES } from "@/contenu/pages/mariages";
import { OPTIONS } from "@/contenu/options";
import { SITE } from "@/contenu/site";
import { avisPublies } from "@/lib/avis/lecture";
import { avisDeLEmplacement, grandAvis, grilleCitations } from "@/lib/avis/selection";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { AvisDefilants } from "@/components/common/AvisDefilants";
import { NoteMariagesNet } from "@/components/common/NoteMariagesNet";
import { BandeauPreuves } from "@/components/common/BandeauPreuves";
import { BandeauPiment } from "@/components/common/BandeauPiment";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Etapes } from "@/components/common/Etapes";
import { Faq } from "@/components/common/Faq";
import { GrillePhotos } from "@/components/common/GrillePhotos";
import { JourneeMariage } from "@/components/common/JourneeMariage";
import { LogoNuvio } from "@/components/common/LogoNuvio";
import { Section } from "@/components/common/Section";
import { Bouton, classesBouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/mariages", seo: MARIAGES[locale].seo, image: "presta-mariage-hero" });
}


const PHOTOS = [
  "presta-maries-enlaces",
  "presta-piste-mains-levees",
  "presta-salle-rouge",
  "presta-invites-chapiteau",
  "presta-piste-laser",
] as const;

export default async function PageMariages({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = MARIAGES[locale];
  // Avis choisis dans le back office (emplacements « Page Mariages — grand avis » et « — grille »).
  const tous = await avisPublies();
  const grand = grandAvis(tous, "mariages_grand", locale, 320);
  const choisis = grilleCitations(avisDeLEmplacement(tous, "mariages"), locale);
  // Le grand avis d'abord, puis ceux de la grille, sans doublon.
  const avisDefilants = [...(grand ? [grand] : []), ...choisis.filter((a) => a.cle !== grand?.cle)];

  return (
    <>
      {/* Pleine largeur : une photo de soirée tirée au hasard parmi 20 à chaque visite. */}
      <EnTetePage image={IMAGES_ACCUEIL_MARIAGES} surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro}>
        <Bouton href="/contact">{c.hero.ctaPrincipal} →</Bouton>
        <Bouton href={{ pathname: "/mariages", hash: "methode" }} variante="contour">{c.hero.ctaSecondaire}</Bouton>
        <span className="text-sm text-ivoire/85">
          Wedding Awards Mariages.net — <span className="text-or">{SITE.weddingAwards.join(" · ")}</span>
        </span>
      </EnTetePage>

      <BandeauPiment />
      <BandeauPreuves />

      {/* Promesse et garanties */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid gap-14 lg:grid-cols-2">
          <div>
            <p className="surtitre mb-4">{c.promesse.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.promesse.titre} />
            </h2>
            {c.promesse.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
          </div>
          <ul className="grid gap-10 self-end sm:grid-cols-2">
            {c.promesse.garanties.map((g) => (
              <li key={g.titre} className="border-t border-ligne pt-6">
                <h3 className="mb-2 text-lg font-semibold tracking-wide">{g.titre}</h3>
                <p className="text-[0.9375rem] text-sable">{g.texte}</p>
                {g.lien && (
                  <Bouton href={g.lien.href} variante="lien" className="mt-4">
                    {g.lien.texte} →
                  </Bouton>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* « Chaque instant » (maquette Nocturne) : un moment par carte, détail en fenêtre. */}
      <section className="py-20 md:py-28">
        <div className="conteneur">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-8 md:mb-16">
            <div>
              <p className="surtitre mb-4">{c.journee.surtitre}</p>
              <h2 className="max-w-[14em] font-display text-4xl leading-[1] md:text-[3.5rem]">
                <Accent texte={c.journee.titre} />
              </h2>
            </div>
            <p className="max-w-sm text-sable">{c.journee.intro}</p>
          </div>
          <JourneeMariage
            locale={locale}
            etiquette={locale === "fr" ? "Votre journée" : "Your day"}
            moments={c.journee.moments.map((m) => ({
              titre: m.titre,
              texte: m.texte,
              accroche: m.accroche,
              image: m.image,
              options: m.options.flatMap((slug) =>
                OPTIONS.filter((o) => o.slug.fr === slug).map((o) => ({ slug: o.slug[locale], titre: o.titre[locale] })),
              ),
            }))}
          />
        </div>
      </section>

      {/* Méthode : cible de l'ancienne page /accompagnement */}
      <Section id="methode" surtitre={c.methode.surtitre} titre={c.methode.titre} intro={c.methode.intro}>
        <Etapes etapes={c.methode.etapes} />
      </Section>

      {/* Le DJ */}
      <section className="border-y border-ligne bg-nuit-2 py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative aspect-[3/4] max-h-[44rem]">
            <Photo cle="presta-cedric-portrait" remplir sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div>
            <p className="surtitre mb-4">{c.dj.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={c.dj.titre} />
            </h2>
            <figure className="mt-8 border-l-2 border-or pl-6">
              <blockquote className="font-display text-2xl font-semibold leading-snug">« {c.dj.citation} »</blockquote>
              <figcaption className="mt-4 text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-or">
                {SITE.fondateur}
              </figcaption>
            </figure>
            {c.dj.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {c.dj.differences.map((d) => (
                <li key={d.titre} className="border-t border-ligne pt-5">
                  <h3 className="mb-2 font-semibold tracking-wide">{d.titre}</h3>
                  <p className="text-[0.9375rem] text-sable">{d.texte}</p>
                </li>
              ))}
            </ul>
            <Bouton href="/a-propos" variante="lien" className="mt-10">{c.dj.lien} →</Bouton>
          </div>
        </div>
      </section>

      {/* Nuvio (maquette Nocturne) : le texte à gauche, un aperçu de l'espace de préparation à droite */}
      <section className="bg-nuit-2 py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <LogoNuvio className="mb-8 text-2xl" />
            <p className="surtitre mb-4">{c.nuvio.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1] md:text-[3.25rem]">
              <Accent texte={c.nuvio.titre} />
            </h2>
            <p className="mt-6 max-w-lg text-lg text-sable">{c.nuvio.texte}</p>
            <a href={SITE.nuvio} target="_blank" rel="noopener" className={`${classesBouton("lien")} mt-8`}>
              {c.nuvio.lien} ↗
            </a>
          </div>

          {/* Aperçu illustratif : ce que les mariés retrouvent dans Nuvio */}
          <div aria-hidden="true" className="border border-ligne bg-nuit-3 p-7 shadow-2xl md:p-9 lg:rotate-[1.5deg]">
            <div className="flex items-center justify-between">
              <LogoNuvio className="text-lg" />
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[#c5b9e4]">{c.nuvio.apercu.surtitre}</span>
            </div>
            <p className="mt-8 text-2xl font-semibold tracking-tight">{c.nuvio.apercu.titre}</p>
            <p className="mt-1 text-sm text-sable">{c.nuvio.apercu.texte}</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ligne">
                <div className="h-full w-[74%] rounded-full bg-[linear-gradient(90deg,#a85cf2,#6247ee)]" />
              </div>
              <span className="text-xs text-sable">{c.nuvio.apercu.avancement} 74 %</span>
            </div>
            <ul className="mt-6">
              {c.nuvio.points.map((point, i) => (
                <li key={point} className="flex items-center justify-between border-t border-ligne py-3.5 text-[0.9375rem]">
                  {point}
                  <span className="text-[#c5b9e4]">{["✓", "♪", "✍", "→"][i % 4]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.6875rem] text-sable/70">{c.nuvio.apercu.note}</p>
          </div>
        </div>
      </section>

      <Section surtitre={c.photos.surtitre} titre={c.photos.titre}>
        <GrillePhotos cles={PHOTOS} />
        <Bouton href="/galerie" variante="lien" className="mt-10">{c.photos.lien} →</Bouton>
      </Section>

      {/* Grands avis qui se succèdent (le « grand avis » d'abord, puis ceux de la grille), photo de fond. */}
      <AvisDefilants
        liste={avisDefilants}
        image="couple-faisceaux"
        libelles={
          locale === "fr"
            ? { precedent: "Avis précédent", suivant: "Avis suivant", avis: "Avis" }
            : { precedent: "Previous review", suivant: "Next review", avis: "Review" }
        }
      >
        <NoteMariagesNet />
        <Bouton href="/avis" variante="lien" className="mt-5 text-[0.75rem] opacity-90">{c.avis.lien} →</Bouton>
      </AvisDefilants>

      <Section surtitre={c.faq.surtitre} titre={c.faq.titre} alterne>
        <Faq questions={c.faq.questions} />
        <Bouton href="/faq" variante="lien" className="mt-10">{c.faq.lien} →</Bouton>
      </Section>

      <DerniersArticles locale={locale} surtitre="Journal" titre="Conseils pour *votre mariage*" categories={CATEGORIES_MARIAGE} />

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} bouton={c.appel.bouton} />
    </>
  );
}
