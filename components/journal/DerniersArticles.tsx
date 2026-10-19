import type { Locale } from "@/i18n/routing";
import type { Categorie } from "@/lib/journal/constantes";
import { articlesPublies } from "@/lib/journal/lecture";
import { derniersArticles } from "@/lib/journal/articles";
import { Section } from "@/components/common/Section";
import { Bouton } from "@/components/ui/Bouton";
import { CarteArticle } from "./CarteArticle";

type Props = {
  locale: Locale;
  surtitre: string;
  titre: string;
  /** Filtre invisible : seulement ces catégories (toutes si absent). */
  categories?: readonly Categorie[];
  alterne?: boolean;
};

/**
 * Les 5 derniers articles du journal sur une seule rangée (défilement horizontal
 * sur téléphone), avec le lien vers le journal. Le journal n'existe qu'en
 * français : rien n'est affiché sur les pages anglaises.
 */
export async function DerniersArticles({ locale, surtitre, titre, categories, alterne }: Props) {
  if (locale !== "fr") return null;
  const liste = derniersArticles(await articlesPublies(), categories);
  if (liste.length === 0) return null;

  return (
    <Section surtitre={surtitre} titre={titre} alterne={alterne}>
      {/* Sur téléphone et tablette, la rangée déborde jusqu'aux bords de l'écran pour défiler,
          tout en commençant alignée sur le texte (mêmes marges que `.conteneur`). */}
      <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto px-5 pb-4 md:-mx-10 md:scroll-px-10 md:px-10 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
        {liste.map((a) => (
          <li key={a.slug} className="w-[70vw] max-w-72 shrink-0 snap-start lg:w-auto lg:max-w-none">
            <CarteArticle article={a} compact />
          </li>
        ))}
      </ul>
      <Bouton href="/journal" variante="lien" className="mt-10">Tout le journal →</Bouton>
    </Section>
  );
}
