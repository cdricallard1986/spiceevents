import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { Accent } from "@/components/common/Accent";
import { FondAleatoire } from "@/components/common/FondAleatoire";
import { IMAGES_ACCUEIL_MARIAGES } from "@/contenu/pages/mariages";
import { CLASSES_BANDEAU } from "./champs";

/**
 * Mise en page des pages ouvertes sans session (connexion, mot de passe
 * oublié) : une nuit de fête tirée au hasard à gauche (ordinateur), le
 * formulaire à droite.
 */
export function CadreConnexion({ titre, message, children }: { titre: string; message?: string | null; children: ReactNode }) {
  return (
    <main id="contenu" className="grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(28rem,1fr)]">
      {/* Ordinateur : une nuit de fête tirée au hasard, comme l’en-tête de la page Mariages. */}
      <div aria-hidden="true" className="relative hidden overflow-hidden lg:block">
        <FondAleatoire images={IMAGES_ACCUEIL_MARIAGES} sizes="60vw" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,20,20,0.35)_0%,rgba(20,20,20,0.1)_40%,rgba(20,20,20,0.92)_100%)]" />
        <div className="texte-sur-photo absolute inset-x-0 bottom-0 p-12 xl:p-16">
          <p className="surtitre mb-4">Spice Events</p>
          <p className="max-w-[11em] font-display text-6xl leading-[0.95] xl:text-7xl">
            <Accent texte="Les coulisses *du piment.*" />
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center border-ligne px-4 py-12 sm:px-8 lg:border-l lg:bg-nuit-0">
        <div className="w-full max-w-md">
          <Link href="/" aria-label="Spice Events — retour au site" className="block w-fit">
            <Logo className="h-16" />
          </Link>
          <p className="surtitre mb-4 mt-12">Back office</p>
          <h1 className="font-display text-5xl leading-[0.95]">
            <Accent texte={titre} />
          </h1>
          {message && (
            <p role="status" className={`mt-6 ${CLASSES_BANDEAU}`}>
              {message}
            </p>
          )}
          <div className="mt-10">{children}</div>
          <p className="mt-10 border-t border-ligne pt-6">
            <Link href="/" className="-my-2.5 inline-flex py-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair">
              ← Retour au site
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
