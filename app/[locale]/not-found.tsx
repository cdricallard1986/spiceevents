import { useLocale } from "next-intl";
import { Accent } from "@/components/common/Accent";
import { Bouton } from "@/components/ui/Bouton";

export default function Introuvable() {
  const fr = useLocale() === "fr";
  return (
    <section className="conteneur flex min-h-[60vh] flex-col items-start justify-center gap-6 py-32">
      {/* React place ce titre dans <head> : l’onglet n’est pas vide. */}
      <title>{fr ? "Page introuvable | Spice Events" : "Page not found | Spice Events"}</title>
      <p className="surtitre">404</p>
      <h1 className="font-display text-5xl md:text-7xl">
        <Accent texte={fr ? "Cette page a quitté *la piste.*" : "This page has left *the dance floor.*"} />
      </h1>
      <p className="max-w-xl text-sable">
        {fr ? "L’adresse n’existe pas ou plus. Repartons de l’accueil." : "This address doesn’t exist anymore. Let’s start again from the home page."}
      </p>
      <Bouton href="/">{fr ? "Retour à l’accueil" : "Back to home"}</Bouton>
    </section>
  );
}
