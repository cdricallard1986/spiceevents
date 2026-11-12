import { useLocale } from "next-intl";

/** Bandeau orange de la charte Nocturne, sous l'en-tête des pages Accueil et Mariages. */
export function BandeauPiment() {
  const fr = useLocale() === "fr";
  return (
    <div className="bg-or text-nuit">
      <p className="conteneur flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-5 font-display text-xl md:py-6 md:text-[1.75rem]">
        <span>{fr ? "Vos nuits ont du goût" : "Your nights have flavour"}</span>
        <span aria-hidden="true" className="hidden sm:inline">
          ✦
        </span>
        <span>{fr ? "Ajoutons-y du piment" : "Let's add some spice"}</span>
      </p>
    </div>
  );
}
