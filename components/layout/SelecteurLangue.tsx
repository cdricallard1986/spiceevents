"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/**
 * Lien vers la même page dans l'autre langue. L'adresse traduite est lue dans
 * les balises <link rel="alternate" hreflang> que chaque page déclare dans ses
 * métadonnées : une seule source de vérité. Sans équivalent (journal), on
 * renvoie vers l'accueil de l'autre langue.
 *
 * Le middleware renvoie toute adresse sans préfixe (`/`, `/mariages`) vers la
 * langue mémorisée dans le cookie NEXT_LOCALE : on y écrit la langue choisie
 * avant de partir, sinon le retour au français ramènerait sur `/en`.
 */
export function SelecteurLangue({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const chemin = usePathname();
  const cible = locale === "fr" ? "en" : "fr";
  const [href, setHref] = useState(cible === "en" ? "/en" : "/");

  useEffect(() => {
    const lien = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${cible}"]`);
    if (lien?.href) {
      const url = new URL(lien.href);
      setHref(url.pathname + url.hash);
    } else {
      setHref(cible === "en" ? "/en" : "/");
    }
  }, [chemin, cible]);

  function memoriserLangue() {
    document.cookie = `NEXT_LOCALE=${cible}; path=/; SameSite=Lax`;
  }

  return (
    <a href={href} hrefLang={cible} lang={cible} aria-label={t("langue")} className={className} onClick={memoriserLangue}>
      {cible.toUpperCase()}
    </a>
  );
}
