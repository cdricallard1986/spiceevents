import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { FormulaireMotDePasse } from "@/components/admin/FormulaireMotDePasse";
import { changerMotDePasse } from "./actions";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";

export const metadata: Metadata = { title: "Mon compte" };

/** Le compte de Cédric : son adresse et le changement de mot de passe. */
export default async function PageCompte() {
  const { utilisateur } = await exigerAdmin();
  const section = sectionDe("/admin/compte");

  return (
    <>
      <EnTeteAdmin
        section={section}
        intro={
          <>
            Connecté avec <span className="text-ivoire">{utilisateur.email}</span>. Le nouveau mot de passe vaut pour toutes vos
            prochaines connexions ; vos autres appareils restent connectés.
          </>
        }
      />
      <FormulaireMotDePasse action={changerMotDePasse} />
    </>
  );
}
