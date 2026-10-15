"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const INTERVALLE_MS = 5 * 60 * 1000;

/**
 * Affiche « Nouvelle version disponible — Recharger » quand le site a été
 * redéployé pendant que l'onglet était ouvert. Ne recharge jamais tout seul.
 */
export function PillNouvelleVersion() {
  const t = useTranslations("version");
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    const actuelle = process.env.NEXT_PUBLIC_EMPREINTE_BUILD;
    let annule = false;

    async function verifier() {
      try {
        const reponse = await fetch("/api/version", { cache: "no-store" });
        if (!reponse.ok) return;
        const { empreinte } = (await reponse.json()) as { empreinte?: string };
        if (!annule && empreinte && actuelle && empreinte !== actuelle) setDisponible(true);
      } catch {
        // Hors ligne ou réponse invalide : ce n'est pas une nouvelle version.
      }
    }

    const surRetour = () => document.visibilityState === "visible" && verifier();
    document.addEventListener("visibilitychange", surRetour);
    const minuteur = window.setInterval(verifier, INTERVALLE_MS);
    return () => {
      annule = true;
      document.removeEventListener("visibilitychange", surRetour);
      window.clearInterval(minuteur);
    };
  }, []);

  if (!disponible) return null;
  return (
    <div role="status" className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full border border-or bg-nuit-2 px-5 py-2.5 text-sm text-ivoire shadow-lg"
      >
        {t("disponible")} — <span className="font-semibold text-or">{t("recharger")}</span>
      </button>
    </div>
  );
}
