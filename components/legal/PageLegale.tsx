import { Fragment, type ReactNode } from "react";
import type { PageLegale as Contenu } from "@/contenu/pages/legal";
import type { CleImage } from "@/lib/images";
import { EnTetePage } from "@/components/common/EnTetePage";

/** Transforme `[texte](adresse)` en lien et `**texte**` en gras ; le reste est du texte brut. */
function enLigne(texte: string): ReactNode {
  const morceaux = texte.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return morceaux.map((m, i) => {
    const lien = m.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lien) {
      const externe = lien[2].startsWith("http");
      return (
        <a key={i} href={lien[2]} {...(externe ? { target: "_blank", rel: "noopener" } : {})}>
          {lien[1]}
        </a>
      );
    }
    const gras = m.match(/^\*\*([^*]+)\*\*$/);
    if (gras) return <strong key={i}>{gras[1]}</strong>;
    return <Fragment key={i}>{m}</Fragment>;
  });
}

/** Gabarit des pages légales (mentions, confidentialité) : en-tête puis texte mis en forme par `prose-nuit`. */
export function PageLegale({ contenu, image }: { contenu: Contenu; image: CleImage }) {
  return (
    <>
      <EnTetePage image={image} surtitre={contenu.hero.surtitre} titre={contenu.hero.titre} />
      <section className="py-20 md:py-28">
        <article className="conteneur prose-nuit max-w-3xl">
          <p className="text-sm text-sable">{contenu.miseAJour}</p>
          {contenu.blocs.map((b) => (
            <Fragment key={b.titre}>
              <h2>{b.titre}</h2>
              {b.paragraphes?.map((p) => <p key={p}>{enLigne(p)}</p>)}
              {b.liste && (
                <ul>
                  {b.liste.map((l) => (
                    <li key={l}>{enLigne(l)}</li>
                  ))}
                </ul>
              )}
            </Fragment>
          ))}
        </article>
      </section>
    </>
  );
}
