import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { srcImage } from "@/lib/journal/constantes";
import type { Article } from "@/lib/journal/types";
import { classesBouton } from "@/components/ui/Bouton";

type Props = {
  article: Pick<Article, "slug" | "titre" | "description" | "date" | "categorie" | "couverture" | "couvertureAlt" | "lecture">;
  /** Article mis en avant en tête du journal : grande photo, titre en h2. */
  enAvant?: boolean;
  /** Vignette resserrée (rangée des derniers articles) : sans description. */
  compact?: boolean;
};

/** Vignette d’un article du journal, vers sa page (même présentation que `CarteOption`). */
export function CarteArticle({ article: a, enAvant = false, compact = false }: Props) {
  const href = { pathname: "/journal/[slug]", params: { slug: a.slug } } as const;
  // Pas de date affichée (choix de Cédric, novembre 2026) : les conseils ne vieillissent pas,
  // et « 2021 » sur une carte ferait croire à un site à l’abandon. Google la reçoit toujours
  // (données structurées), et elle trie les articles.
  const meta = (
    <p className="surtitre">
      {a.categorie} · {a.lecture} min
    </p>
  );

  if (enAvant) {
    return (
      <Link href={href} className="group grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={srcImage(a.couverture)}
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
          <span className={`${classesBouton("lien")} mt-8`}>Lire l’article →</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={srcImage(a.couverture)}
          alt={a.couvertureAlt}
          fill
          sizes={compact ? "(min-width: 1024px) 18vw, 70vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
          quality={70}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      {meta}
      <h3 className={`font-display leading-tight group-hover:text-or ${compact ? "text-xl" : "text-2xl"}`}>{a.titre}</h3>
      {!compact && <p className="text-[0.9375rem] text-sable">{a.description}</p>}
    </Link>
  );
}
