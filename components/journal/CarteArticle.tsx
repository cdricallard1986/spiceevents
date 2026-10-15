import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formaterDate, type Article } from "@/lib/journal/articles";
import { classesBouton } from "@/components/ui/Bouton";

type Props = {
  article: Pick<Article, "slug" | "titre" | "description" | "date" | "categorie" | "couverture" | "couvertureAlt" | "lecture">;
  /** Article mis en avant en tête du journal : grande photo, titre en h2. */
  enAvant?: boolean;
};

/** Vignette d'un article du journal, vers sa page (même présentation que `CarteOption`). */
export function CarteArticle({ article: a, enAvant = false }: Props) {
  const href = { pathname: "/journal/[slug]", params: { slug: a.slug } } as const;
  const meta = (
    <p className="surtitre">
      {a.categorie} · {formaterDate(a.date)}
    </p>
  );

  if (enAvant) {
    return (
      <Link href={href} className="group grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={a.couverture}
            alt={a.couvertureAlt}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            quality={70}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div>
          {meta}
          <h2 className="mt-4 font-display text-4xl leading-[1.08] group-hover:text-or md:text-5xl">{a.titre}</h2>
          <p className="mt-6 text-lg text-sable">{a.description}</p>
          <span className={`${classesBouton("lien")} mt-8`}>Lire l&apos;article · {a.lecture} min →</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={a.couverture}
          alt={a.couvertureAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          quality={70}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      {meta}
      <h3 className="font-display text-2xl leading-tight group-hover:text-or">{a.titre}</h3>
      <p className="text-[0.9375rem] text-sable">{a.description}</p>
    </Link>
  );
}
