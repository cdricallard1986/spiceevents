import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { NOS_DJ } from "@/contenu/pages/nos-dj";
import { initiales, type CarteEquipe } from "@/lib/equipe/affichage";
import { equipePubliee } from "@/lib/equipe/lecture";
import { metadonnees } from "@/lib/seo/metadonnees";
import { Accent } from "@/components/common/Accent";
import { AppelContact } from "@/components/common/AppelContact";
import { EnTetePage } from "@/components/common/EnTetePage";
import { Section } from "@/components/common/Section";
import { Photo } from "@/components/ui/Photo";
import { Bouton, classesBouton } from "@/components/ui/Bouton";

type Props = { params: Promise<{ locale: Locale }> };

// Langue ou adresse non générée (« /x.png », « /wp-login.php »…) → 404 sans rendu (voir app/[locale]/layout.tsx).
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return metadonnees({ locale, href: "/nos-dj", seo: NOS_DJ[locale].seo, image: "mariage-soiree-regie" });
}

/** Étiquettes de style d'un membre (capitales fines, charte Nocturne). */
function Styles({ styles }: { styles: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {styles.map((s) => (
        <li key={s} className="border border-ligne px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sable">
          {s}
        </li>
      ))}
    </ul>
  );
}

/** Carte d'un DJ ou d'un musicien : son portrait, ou son monogramme en attendant. */
function CarteMembre({ m }: { m: CarteEquipe }) {
  return (
    <article id={m.id} className="flex h-full scroll-mt-28 flex-col border border-ligne bg-nuit-2">
      <div className="relative aspect-[3/2] overflow-hidden border-b border-ligne bg-nuit-3">
        {m.photo ? (
          <Photo photo={m.photo} remplir cadrage={m.cadrage} sizes="(min-width: 1024px) 40rem, 100vw" />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[7rem] leading-none text-or/25 md:text-[9rem]">
            {initiales(m.nom)}
          </span>
        )}
      </div>
      <div className="border-b border-ligne p-6 md:p-8">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-or">{m.role}</p>
        <h3 className="mt-2 font-display text-3xl leading-none md:text-4xl">{m.nom}</h3>
        {m.alias && <p className="mt-2 text-sm text-sable">{m.alias}</p>}
      </div>
      <div className="flex flex-1 flex-col gap-5 p-6 md:p-8">
        <p className="text-lg font-semibold text-ivoire">{m.accroche}</p>
        {m.paragraphes.map((p) => (
          <p key={p} className="text-[0.9375rem] leading-relaxed text-sable">
            {p}
          </p>
        ))}
        {m.avis && (
          <figure className="border-l-2 border-or pl-4">
            <blockquote className="text-[0.9375rem] italic text-ivoire/90">« {m.avis.texte} »</blockquote>
            <figcaption className="mt-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-sable">{m.avis.auteur}</figcaption>
          </figure>
        )}
        {m.lieux && <p className="text-sm text-sable/90">{m.lieux}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-2">
          <Styles styles={m.styles} />
          {m.lien && (
            <a href={m.lien.href} target="_blank" rel="noopener noreferrer" className={classesBouton("lien")}>
              {m.lien.libelle} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function PageNosDj({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = NOS_DJ[locale];
  const f = c.fondateur;
  const equipe = await equipePubliee(locale);
  const djs = equipe.filter((m) => m.groupe === "dj");
  const musiciens = equipe.filter((m) => m.groupe === "musicien");

  return (
    <>
      <EnTetePage image="mariage-soiree-regie" surtitre={c.hero.surtitre} titre={c.hero.titre} intro={c.hero.intro} />

      {/* Le fondateur : portrait et présentation */}
      <section className="py-20 md:py-28">
        <div className="conteneur grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          {f.image && (
            <div className="relative aspect-[3/4] max-h-[44rem]">
              <Photo cle={f.image} remplir sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          )}
          <div>
            <p className="surtitre mb-4">{f.surtitre}</p>
            <h2 className="font-display text-4xl leading-[1.08] md:text-[3.5rem]">
              <Accent texte={f.titre} />
            </h2>
            <p className="mt-6 text-xl font-semibold text-ivoire">{f.accroche}</p>
            {f.paragraphes.map((p) => (
              <p key={p} className="mt-6 text-lg text-sable">
                {p}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Styles styles={f.styles} />
              {f.lien && (
                <a href={f.lien.href} target="_blank" rel="noopener noreferrer" className={classesBouton("lien")}>
                  {f.lien.libelle} ↗
                </a>
              )}
            </div>
            <Bouton href="/a-propos" variante="lien" className="mt-6">
              {locale === "fr" ? "Son parcours" : "His story"} →
            </Bouton>
          </div>
        </div>
      </section>

      {/* Les DJ de l'équipe (back office : /admin/dj) */}
      {djs.length > 0 && (
        <Section surtitre={c.equipe.surtitre} titre={c.equipe.titre} intro={c.equipe.intro} alterne>
          <ul className="grid gap-6 lg:grid-cols-2">
            {djs.map((m) => (
              <li key={m.id}>
                <CarteMembre m={m} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Musiciens en live */}
      {musiciens.length > 0 && (
        <Section surtitre={c.musiciens.surtitre} titre={c.musiciens.titre} intro={c.musiciens.intro}>
          <ul className="grid gap-6 lg:grid-cols-2">
            {musiciens.map((m) => (
              <li key={m.id}>
                <CarteMembre m={m} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* La méthode commune */}
      <Section surtitre={c.methode.surtitre} titre={c.methode.titre} alterne>
        <ul className="grid gap-10 md:grid-cols-3">
          {c.methode.points.map((p) => (
            <li key={p.titre} className="border-t border-ligne pt-6">
              <h3 className="mb-2 text-lg font-semibold tracking-wide">{p.titre}</h3>
              <p className="text-[0.9375rem] text-sable">{p.texte}</p>
            </li>
          ))}
        </ul>
      </Section>

      <AppelContact titre={c.appel.titre} texte={c.appel.texte} bouton={c.appel.bouton} />
    </>
  );
}
