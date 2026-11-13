import { SITE } from "@/contenu/site";

/**
 * « Wedding Awards Mariages.net 2022 · 2024 · … » : lien vers la page des avis
 * Spice Events sur Mariages.net (nouvel onglet), là où les récompenses se vérifient.
 */
export function LienWeddingAwards({ libelle, separateur = " ", className = "" }: { libelle: string; separateur?: string; className?: string }) {
  return (
    <a
      href={SITE.avisMariagesNet.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline decoration-current/30 underline-offset-4 transition-colors hover:text-or hover:decoration-or ${className}`}
    >
      {libelle}
      {separateur}
      <span className="text-or">{SITE.weddingAwards.join(" · ")}</span>
    </a>
  );
}
