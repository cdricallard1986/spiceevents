import { Fragment } from "react";
import { insecables } from "@/lib/typographie";

/**
 * Met en valeur les passages entre astérisques : « La nuit dont vos invités
 * *parleront encore* » → la fin en orange (charte Nocturne : sans italique).
 * Le reste est du texte brut.
 */
export function Accent({ texte, couleur = "text-or" }: { texte: string; couleur?: string }) {
  const morceaux = insecables(texte).split(/\*([^*]+)\*/g);
  return (
    <>
      {morceaux.map((m, i) =>
        i % 2 === 1 ? (
          <em key={i} className={`not-italic ${couleur}`}>
            {m}
          </em>
        ) : (
          <Fragment key={i}>{m}</Fragment>
        ),
      )}
    </>
  );
}

/** Le même texte sans astérisques (balises title, données structurées). */
export function sansAccent(texte: string) {
  return texte.replace(/\*([^*]+)\*/g, "$1");
}
