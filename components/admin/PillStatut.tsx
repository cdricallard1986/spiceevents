"use client";

import { useEffect, useState } from "react";
import type { StatutSauvegarde } from "@/hooks/useModalAutosave";

/** Délai avant que « ✓ Enregistré » ne s'estompe en « ✓ À jour ». */
const DUREE_ENREGISTRE_MS = 2000;

const BASE = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.04em] transition-colors duration-500";

const STYLES: Record<StatutSauvegarde, { texte: string; classes: string }> = {
  a_jour: { texte: "✓ À jour", classes: "border-ligne text-sable" },
  modifie: { texte: "• Modifié", classes: "border-ligne text-ivoire" },
  enregistrement: { texte: "⟳ Enregistrement…", classes: "border-ligne text-sable" },
  enregistre: { texte: "✓ Enregistré", classes: "border-or/60 text-or" },
  erreur: { texte: "⚠ Non enregistré — réessayer", classes: "border-erreur text-erreur hover:bg-erreur/10" },
  brouillon: { texte: "• Brouillon gardé sur cet appareil", classes: "border-ligne text-sable" },
};

/**
 * Pill de statut des modales auto-enregistrées, à côté du titre. En erreur,
 * elle devient un bouton qui relance l'enregistrement.
 */
export function PillStatut({ statut, onReessayer }: { statut: StatutSauvegarde; onReessayer?: () => void }) {
  // « Enregistré » s'estompe après deux secondes (le statut reste le même côté hook).
  const [estompe, setEstompe] = useState(false);
  useEffect(() => {
    setEstompe(false);
    if (statut !== "enregistre") return;
    const minuteur = window.setTimeout(() => setEstompe(true), DUREE_ENREGISTRE_MS);
    return () => window.clearTimeout(minuteur);
  }, [statut]);

  const affiche = statut === "enregistre" && estompe ? STYLES.a_jour : STYLES[statut];

  if (statut === "erreur") {
    return (
      <button type="button" onClick={onReessayer} className={`${BASE} ${affiche.classes}`}>
        {affiche.texte}
      </button>
    );
  }
  return (
    <span role="status" aria-live="polite" className={`${BASE} ${affiche.classes}`}>
      {affiche.texte}
    </span>
  );
}
