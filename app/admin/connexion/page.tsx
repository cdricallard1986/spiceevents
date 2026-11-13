import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CadreConnexion } from "@/components/admin/CadreConnexion";
import { FormulaireConnexion } from "@/components/admin/FormulaireConnexion";
import { messageRaison } from "@/lib/admin/messages";
import { CHEMIN_ADMIN, cheminDeRetour } from "@/lib/admin/session";
import { clientServeur } from "@/lib/supabase/server";
import { seConnecter } from "./actions";

export const metadata: Metadata = { title: "Connexion" };

type Props = { searchParams: Promise<{ raison?: string | string[]; suite?: string | string[] }> };

export default async function PageConnexion({ searchParams }: Props) {
  const { raison, suite } = await searchParams;
  const retour = cheminDeRetour(Array.isArray(suite) ? suite[0] : suite);

  // Déjà connecté avec le bon compte (favori, onglet resté ouvert) : directement au back office.
  const supabase = await clientServeur();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const { data: admin } = await supabase.rpc("est_admin");
    if (admin === true) redirect(retour);
  }

  return (
    <CadreConnexion titre="Connexion. *Entrez en régie.*" message={messageRaison(raison)}>
      <FormulaireConnexion action={seConnecter} suite={retour === CHEMIN_ADMIN ? undefined : retour} />
    </CadreConnexion>
  );
}
