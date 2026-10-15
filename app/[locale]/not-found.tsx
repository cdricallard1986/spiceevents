import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Introuvable() {
  const fr = useLocale() === "fr";
  return (
    <section className="conteneur flex min-h-[60vh] flex-col items-start justify-center gap-6 py-32">
      <p className="surtitre">404</p>
      <h1 className="font-display text-5xl md:text-7xl">
        {fr ? "Cette page a quitté la piste." : "This page has left the dance floor."}
      </h1>
      <p className="max-w-xl text-sable">
        {fr
          ? "L'adresse n'existe pas ou plus. Repartons de l'accueil."
          : "This address doesn't exist anymore. Let's start again from the home page."}
      </p>
      <Link href="/" className="bg-or px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-nuit">
        {fr ? "Retour à l'accueil" : "Back to home"}
      </Link>
    </section>
  );
}
