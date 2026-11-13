import paquet from "@/package.json";
import { compterNouvellesDemandes } from "@/lib/admin/compteurs";
import { exigerAdmin } from "@/lib/admin/garde";
import { nombreNouvellesDemandes } from "./demandes/actions";
import { CoqueAdmin } from "@/components/admin/CoqueAdmin";

/**
 * Pages du back office (tout sauf la connexion) : réservées à l’administrateur.
 * Chaque page appelle aussi `exigerAdmin()` (une mise en page n’est pas
 * réévaluée à chaque navigation) ; la vérification est mise en cache par requête.
 */
export default async function LayoutEspace({ children }: { children: React.ReactNode }) {
  const { supabase, utilisateur } = await exigerAdmin();
  const nouvelles = await compterNouvellesDemandes(supabase);
  return (
    <CoqueAdmin version={paquet.version} email={utilisateur.email ?? ""} nouvellesDemandes={nouvelles} relireDemandes={nombreNouvellesDemandes}>
      {children}
    </CoqueAdmin>
  );
}
