import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ancreCategorie, formaterDate, type Article } from "@/lib/journal/articles";

/**
 * Ouverture d'un article : même gabarit que `EnTetePage` (photo, voile, titre h1 en
 * bas), avec la couverture de l'article, qui n'est pas dans le registre d'images.
 */
export function EnTeteArticle({ article: a }: { article: Article }) {
  return (
    <section className="relative flex min-h-[78svh] items-end overflow-hidden">
      <Image src={a.couverture} alt={a.couvertureAlt} fill priority sizes="100vw" quality={70} className="object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,18,0.7)_0%,rgba(14,13,18,0.2)_35%,rgba(14,13,18,0.94)_100%)]"
      />
      <div className="conteneur relative pb-16 pt-36 md:pb-24">
        <p className="surtitre mb-5">
          <Link href="/journal" className="hover:text-or-clair">
            Journal
          </Link>
          {" · "}
          <a href={`/journal#${ancreCategorie(a.categorie)}`} className="hover:text-or-clair">
            {a.categorie}
          </a>
        </p>
        <h1 className="max-w-[18em] font-display text-4xl leading-[1.02] md:text-6xl">{a.titre}</h1>
        {a.sousTitre && <p className="mt-6 max-w-2xl text-lg text-ivoire/90 md:text-xl">{a.sousTitre}</p>}
        <p className="mt-8 text-sm text-ivoire/85">
          <time dateTime={a.date}>{formaterDate(a.date)}</time> · {a.lecture} min de lecture
        </p>
      </div>
    </section>
  );
}
