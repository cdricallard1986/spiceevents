import paquet from "@/package.json";
import { exigerAdmin } from "@/lib/admin/garde";
import { CoqueAdmin } from "@/components/admin/CoqueAdmin";

/**
 * Pages du back office (tout sauf la connexion) : réservées à l'administrateur.
 * Chaque page appelle aussi `exigerAdmin()` (une mise en page n'est pas
 * réévaluée à chaque navigation) ; la vérification est mise en cache par requête.
 */
export default async function LayoutEspace({ children }: { children: React.ReactNode }) {
  const { utilisateur } = await exigerAdmin();
  return (
    <CoqueAdmin version={paquet.version} email={utilisateur.email ?? ""}>
      {children}
    </CoqueAdmin>
  );
}
