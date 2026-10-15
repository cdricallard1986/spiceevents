import { useLocale } from "next-intl";
import { SITE } from "@/contenu/site";

/** Les preuves de confiance, en une ligne. */
export function BandeauPreuves() {
  const fr = useLocale() === "fr";
  const preuves = [
    { chiffre: `${SITE.weddingAwards.length}×`, texte: fr ? `Wedding Awards Mariages.net (${SITE.weddingAwards.join(", ")})` : `Mariages.net Wedding Awards (${SITE.weddingAwards.join(", ")})` },
    { chiffre: `${SITE.chiffres.anneesExperience} ${fr ? "ans" : "years"}`, texte: fr ? "derrière les platines" : "behind the decks" },
    { chiffre: `${SITE.chiffres.evenements}+`, texte: fr ? "mariages et événements" : "weddings and events" },
    { chiffre: "100 %", texte: fr ? "matériel pro testé avant chaque date" : "pro equipment tested before every date" },
  ];
  return (
    <section className="border-y border-ligne">
      <ul className="conteneur grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-4">
        {preuves.map((p) => (
          <li key={p.texte}>
            <p className="font-display text-4xl text-or md:text-5xl">{p.chiffre}</p>
            <p className="mt-2 text-sm text-sable">{p.texte}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
