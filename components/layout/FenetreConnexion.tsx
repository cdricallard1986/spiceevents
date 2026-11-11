"use client";

import { seConnecter } from "@/app/admin/connexion/actions";
import { FormulaireConnexion } from "@/components/admin/FormulaireConnexion";
import { Modale } from "@/components/admin/Modale";
import { FournisseurToasts } from "@/components/admin/Toasts";

/**
 * Connexion au back office par-dessus la page publique : même formulaire et même
 * Server Action que /admin/connexion (limite des tentatives, durée minimale,
 * vérification d'`est_admin()`). Une connexion réussie mène au back office.
 */
export default function FenetreConnexion({ onFermer }: { onFermer: () => void }) {
  return (
    <FournisseurToasts>
      <Modale ouverte onFermer={onFermer} titre="Connexion au back office" largeur="etroite">
        <FormulaireConnexion action={seConnecter} />
      </Modale>
    </FournisseurToasts>
  );
}
