import { useLocale } from "next-intl";
import { SITE } from "@/contenu/site";
import { Bouton } from "@/components/ui/Bouton";
import { Accent } from "./Accent";

/** Appel à l'action de fin de page, vers le formulaire de contact. */
export function AppelContact({ titre, texte }: { titre?: string; texte?: string }) {
  const fr = useLocale() === "fr";
  return (
    <section className="border-t border-ligne">
      <div className="conteneur flex flex-wrap items-end justify-between gap-10 py-24 md:py-32">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl leading-[1.05] md:text-6xl">
            <Accent texte={titre ?? (fr ? "Votre date est *peut-être* encore libre." : "Your date might *still* be free.")} />
          </h2>
          <p className="mt-6 text-lg text-sable">
            {texte ??
              (fr
                ? "Dites-nous l'essentiel en deux minutes : Cédric vous répond personnellement, dans les meilleurs délais."
                : "Tell us the essentials in two minutes: Cédric will get back to you personally, as soon as possible.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Bouton href="/contact">{fr ? "Vérifier ma date" : "Check my date"}</Bouton>
          <a href={`tel:${SITE.telephone}`} className="text-sable underline-offset-4 hover:text-or hover:underline">
            {SITE.telephoneAffiche}
          </a>
        </div>
      </div>
    </section>
  );
}
