import { useLocale } from "next-intl";
import { Bouton } from "@/components/ui/Bouton";
import { Accent } from "./Accent";

type Props = { titre?: string; texte?: string; bouton?: string };

/**
 * Bande orange de fin de page (charte Nocturne) : une question, une phrase, un
 * bouton sombre vers le formulaire de contact.
 */
export function AppelContact({ titre, texte, bouton }: Props) {
  const fr = useLocale() === "fr";
  return (
    <section className="bg-or text-nuit">
      <div className="conteneur flex flex-wrap items-center justify-between gap-x-10 gap-y-8 py-14 md:py-16">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl leading-[1] md:text-5xl">
            <Accent couleur="text-nuit" texte={titre ?? (fr ? "Votre date est *peut-être* encore libre." : "Your date might *still* be free.")} />
          </h2>
          <p className="mt-4 text-lg text-nuit/85">
            {texte ??
              (fr
                ? "Dites-nous l'essentiel en deux minutes : Cédric vous répond personnellement, dans les meilleurs délais."
                : "Tell us the essentials in two minutes: Cédric will get back to you personally, as soon as possible.")}
          </p>
        </div>
        <Bouton href="/contact" variante="sombre" className="gap-6">
          {bouton ?? (fr ? "Vérifier ma date" : "Check my date")} <span aria-hidden="true">→</span>
        </Bouton>
      </div>
    </section>
  );
}
