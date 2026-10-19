import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { JOURNAL } from "@/contenu/pages/journal";
import { ancreCategorie } from "@/lib/journal/articles";
import { CATEGORIES } from "@/lib/journal/constantes";
import { articlesPublies } from "@/lib/journal/lecture";
import { metadonnees } from "@/lib/seo/metadonnees";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { CarteArticle } from "@/components/journal/CarteArticle";
import { classesBouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale }> };

// Journal en français seulement : seule la version française est générée, l'anglais renvoie une 404.
export function generateStaticParams() {
  return [{ locale: "fr" }];
}

// Langue ou adresse non générée (« /favicon.ico »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "fr") return {};
  return metadonnees({ locale, href: "/journal", seo: JOURNAL.seo, image: "journal-guinguette" });
}

export default async function PageJournal({ params }: Props) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  setRequestLocale(locale);
  const c = JOURNAL;
  const tous = await articlesPublies();
  const [aLaUne] = tous;
  const rubriques = CATEGORIES.map((categorie) => ({
    categorie,
    ancre: ancreCategorie(categorie),
    liste: tous.filter((a) => a.categorie === categorie),
  })).filter((r) => r.liste.length > 0);

  return (
    <>
      <EnTetePage image="journal-guinguette" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      {aLaUne && (
        <section className="py-20 md:py-28">
          <div className="conteneur">
            <p className="surtitre mb-8">{c.aLaUne}</p>
            <CarteArticle article={aLaUne} enAvant />
          </div>
        </section>
      )}

      <nav aria-label={c.filtres} className="border-y border-ligne">
        <ul className="conteneur flex flex-wrap gap-x-8 gap-y-4 py-6">
          {rubriques.map((r) => (
            <li key={r.ancre}>
              <a href={`#${r.ancre}`} className={classesBouton("lien")}>
                {r.categorie} <span className="text-sable">({r.liste.length})</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {rubriques.map((r, i) => (
        <Section key={r.ancre} id={r.ancre} surtitre={`${r.liste.length} article${r.liste.length > 1 ? "s" : ""}`} titre={r.categorie} intro={c.rubriques[r.categorie]} alterne={i % 2 === 0}>
          <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {r.liste.map((a) => (
              <li key={a.slug}>
                <CarteArticle article={a} />
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <AppelContact />
    </>
  );
}
