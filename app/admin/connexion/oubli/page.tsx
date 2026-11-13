import type { Metadata } from "next";
import { CadreConnexion } from "@/components/admin/CadreConnexion";
import { FormulaireOubli } from "@/components/admin/FormulaireOubli";
import { demanderReinitialisation } from "../actions";

export const metadata: Metadata = { title: "Mot de passe oublié" };

/** « Mot de passe oublié ? » : un lien pour choisir un nouveau mot de passe, envoyé par email. */
export default function PageOubli() {
  return (
    <CadreConnexion titre="Mot de passe oublié ? *Pas de panique.*">
      <FormulaireOubli action={demanderReinitialisation} />
    </CadreConnexion>
  );
}
