import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { Icone } from "@/components/admin/Icones";
import { FormulaireMotDePasse } from "@/components/admin/FormulaireMotDePasse";
import { changerMotDePasse } from "./actions";

export const metadata: Metadata = { title: "Mon compte" };

/** Le compte de Cédric : son adresse et le changement de mot de passe. */
export default async function PageCompte() {
  const { utilisateur } = await exigerAdmin();
  const section = sectionDe("/admin/compte");

  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <p className="mt-4 mb-10 max-w-2xl text-sable">
        Connecté avec <span className="text-ivoire">{utilisateur.email}</span>. Le nouveau mot de passe vaut pour toutes vos
        prochaines connexions ; vos autres appareils restent connectés.
      </p>
      <FormulaireMotDePasse action={changerMotDePasse} />
    </>
  );
}
