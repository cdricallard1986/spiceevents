import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { ACCUEIL } from "@/contenu/pages/accueil";
import { ANIMATIONS } from "@/contenu/pages/animations";
import { OPTIONS } from "@/contenu/options";
import { avisPublies } from "@/lib/avis/lecture";
import { avisDeLEmplacement, grandAvis, grilleCitations } from "@/lib/avis/selection";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { AvisDefilants } from "@/components/common/AvisDefilants";
import { NoteMariagesNet } from "@/components/common/NoteMariagesNet";
import { BandeauPiment } from "@/components/common/BandeauPiment";
import { BandeauPreuves } from "@/components/common/BandeauPreuves";
import { CarteOption } from "@/components/common/CarteOption";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { Photo } from "@/components/ui/Photo";
import { DerniersArticles } from "@/components/journal/DerniersArticles";
import { photosEnTete } from "@/lib/photos/lecture";
import { LienWeddingAwards } from "@/components/common/LienWeddingAwards";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/", seo: ACCUEIL[locale].seo });
}

export default async function Accueil({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = ACCUEIL[locale];
  // Diaporama d'en-tête choisi dans le back office (fiche de chaque photo).
  // Sans les photos déjà montrées plus bas (cartes des deux univers, avis).
  const entete = await photosEnTete("accueil", locale, [...c.portes.liste.map((p) => p.image), "chapiteau-diner"]);
  const fr = locale === "fr";
  // Avis choisis dans le back office (emplacements « Accueil — grand avis » et « Accueil — grille ») :
  // le grand d'abord, puis la grille, sans doublon.
  const tous = await avisPublies();
  const grand = grandAvis(tous, "accueil_grand", locale, 300);
  const choisis = grilleCitations(avisDeLEmplacement(tous, "accueil"), locale);
  const avis = [...(grand ? [grand] : []), ...choisis.filter((a) => a.cle !== grand?.cle)];

  return (
    <>
      {/* Une nuit de mariage ou d'événement tirée au hasard à chaque visite */}
      <EnTetePage image={entete} surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} pleinEcran>
        <Bouton href="/contact">{c.hero.ctaPrincipal} →</Bouton>
        <Bouton href="/animations" variante="contour">{c.hero.ctaSecondaire}</Bouton>
        <span className="text-sm text-ivoire/85">
          <LienWeddingAwards libelle="Wedding Awards Mariages.net" separateur=" — " />
        </span>
      </EnTetePage>

      <BandeauPiment />
      <BandeauPreuves />

      {/* Les deux portes d'entrée : mariages et événements */}
      <Section surtitre={c.portes.surtitre} titre={c.portes.titre}>
        <div className="grid gap-4 md:grid-cols-2">
          {c.portes.liste.map((p) => (
            <Link key={p.href} href={p.href} className="group relative isolate flex min-h-[28rem] items-end overflow-hidden md:min-h-[36rem]">
              <Photo cle={p.image} remplir sizes="(min-width: 768px) 50vw, 100vw" className="-z-10 transition-transform duration-700 group-hover:scale-[1.025]" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(transparent_30%,rgba(0,0,0,0.85))]" />
              <div className="texte-sur-photo p-6 md:p-10">
                <p className="surtitre mb-3">{p.surtitre}</p>
                <h3 className="font-display text-4xl leading-[0.95] md:text-5xl">
                  <Accent texte={p.titre} />
                </h3>
                <p className="mt-4 max-w-md text-ivoire/85">{p.texte}</p>
                <span className="mt-6 inline-flex items-center gap-3 bg-or px-6 py-3.5 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-nuit">
                  {p.lien} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Le DJ : collage Cédric et platines (jamais deux photos d'un même événement côte à côte) */}
      <section className="bg-nuit-2 py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl leading-[1.02] md:text-[3.5rem]">
              <Accent texte={c.dj.titre} />
            </h2>
            {c.dj.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">{p}</p>
            ))}
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Bouton href="/a-propos" variante="lien">{c.dj.lien} →</Bouton>
              <Bouton href="/son-et-lumiere" variante="lien">{fr ? "Notre matériel" : "Our equipment"} →</Bouton>
            </div>
          </div>
          {/* Hauteur fixe sur deux rangées : la grande photo et les deux petites finissent à la même ligne. */}
          <div className="grid h-[24rem] grid-cols-2 grid-rows-2 gap-4 md:h-[32rem]">
            <div className="relative row-span-2">
              {/* Photo paysage recadrée en portrait : affichée ~1,5× plus large que sa case. */}
              <Photo cle="cedric-platines" remplir sizes="(min-width: 1024px) 40vw, 75vw" />
            </div>
            <div className="relative">
              <Photo cle="cedric-platines-cravate" remplir sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
            <div className="relative">
              <Photo cle="platines-pioneer" remplir sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <Section surtitre={c.animations.surtitre} titre={c.animations.titre}>
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {OPTIONS.slice(0, 4).map((o) => (
            <li key={o.slug.fr}>
              <CarteOption option={o} locale={locale} texte={ANIMATIONS[locale].accroches[o.slug.fr]} />
            </li>
          ))}
        </ul>
        <Bouton href="/animations" variante="lien" className="mt-12">{c.animations.lien} →</Bouton>
      </Section>

      {/* Avis qui se succèdent sur photo de fond */}
      <AvisDefilants
        liste={avis}
        image="chapiteau-diner"
        libelles={
          fr
            ? { precedent: "Avis précédent", suivant: "Avis suivant", avis: "Avis" }
            : { precedent: "Previous review", suivant: "Next review", avis: "Review" }
        }
      >
        <NoteMariagesNet />
        <p className="mt-8 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-sable">{c.avis.surtitre}</p>
        <Bouton href="/avis" variante="lien" className="mt-3 text-[0.75rem]">{c.avis.lien} →</Bouton>
      </AvisDefilants>

      <DerniersArticles locale={locale} surtitre="Journal" titre="Conseils et *coulisses*" />

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} bouton={c.appel.bouton} />
    </>
  );
}
