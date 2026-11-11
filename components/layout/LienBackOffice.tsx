"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Chargée au clic seulement : les visiteurs ne téléchargent pas le code du formulaire.
const FenetreConnexion = dynamic(() => import("./FenetreConnexion"), { ssr: false });

/** Lien du pied de page : ouvre la connexion au back office dans une fenêtre, sans quitter la page. */
export function LienBackOffice() {
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuverte(true)} aria-haspopup="dialog" className="hover:text-ivoire">
        Back office
      </button>
      {ouverte && <FenetreConnexion onFermer={() => setOuverte(false)} />}
    </>
  );
}
