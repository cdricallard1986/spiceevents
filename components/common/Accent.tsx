import { Fragment } from "react";

/**
 * Met en valeur les passages entre astérisques : « La nuit dont vos invités
 * *parleront encore* » → la fin en italique doré. Le reste est du texte brut.
 */
export function Accent({ texte, couleur = "text-or" }: { texte: string; couleur?: string }) {
  const morceaux = texte.split(/\*([^*]+)\*/g);
  return (
    <>
      {morceaux.map((m, i) =>
        i % 2 === 1 ? (
          <em key={i} className={`italic ${couleur}`}>
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
