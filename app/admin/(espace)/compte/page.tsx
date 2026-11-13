import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { FormulaireMotDePasse } from "@/components/admin/FormulaireMotDePasse";
import { CLASSES_BANDEAU } from "@/components/admin/champs";
import { changerMotDePasse } from "./actions";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";

export const metadata: Metadata = { title: "Mon compte" };

type Props = { searchParams: Promise<{ raison?: string | string[] }> };

/** Le compte de Cédric : son adresse et le changement de mot de passe (aussi l’arrivée du lien « Mot de passe oublié »). */
export default async function PageCompte({ searchParams }: Props) {
  const { utilisateur } = await exigerAdmin();
  const section = sectionDe("/admin/compte");
  const { raison } = await searchParams;
  const reinitialisation = (Array.isArray(raison) ? raison[0] : raison) === "reinitialisation";

  return (
    <>
      <EnTeteAdmin
        section={section}
        intro={
          <>
            Connecté avec <span className="text-ivoire">{utilisateur.email}</span>. Le nouveau mot de passe vaut pour toutes vos
            prochaines connexions. Par sécurité, vos autres appareils sont déconnectés ; celui-ci reste connecté.
          </>
        }
      />
      {reinitialisation && (
        <p role="status" className={`mb-8 max-w-2xl ${CLASSES_BANDEAU}`}>
          Lien vérifié : choisissez maintenant votre nouveau mot de passe ci-dessous.
        </p>
      )}
      <FormulaireMotDePasse action={changerMotDePasse} />
    </>
  );
}
