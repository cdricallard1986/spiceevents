import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { LIBELLES_MODELE, MODELES, emailDeTest } from "@/lib/admin/emails-test";
import { configEmail } from "@/lib/contact/config-email";
import { LANGUES } from "@/lib/contact/constantes";
import { Icone } from "@/components/admin/Icones";
import { EnvoiEmailsTest, type Apercu } from "@/components/admin/EnvoiEmailsTest";
import { envoyerEmailTest } from "./actions";

export const metadata: Metadata = { title: "Emails" };

/**
 * Test des emails du formulaire de contact : aperçu du rendu, puis envoi réel
 * par Resend (demande fictive, objet « [TEST] ») à l'adresse du compte connecté.
 */
export default async function PageEmails() {
  const { utilisateur } = await exigerAdmin();
  const section = sectionDe("/admin/emails");
  const destinataire = utilisateur.email ?? "";
  const config = configEmail(process.env);
  const maintenant = new Date();

  // Les quatre aperçus (deux modèles × deux langues), calculés ici avec les vrais modèles.
  const apercus: Record<string, Apercu> = {};
  for (const modele of MODELES) {
    for (const langue of LANGUES) {
      const { subject, from, to, replyTo, html } = emailDeTest({ modele, langue }, destinataire, config, maintenant);
      apercus[`${modele}-${langue}`] = { subject, from, to, replyTo, html };
    }
  }

  return (
    <>
      <p className="surtitre mb-3">Back office</p>
      <h1 className="flex items-center gap-4 font-display text-4xl leading-tight md:text-5xl">
        <Icone nom={section.icone} className="size-8 text-or" />
        {section.libelle}
      </h1>
      <p className="mt-4 mb-10 max-w-2xl text-sable">
        Les vrais emails du formulaire de contact, remplis avec une demande fictive et envoyés par Resend à votre adresse, objet préfixé
        « [TEST] ». Utile pour vérifier le rendu et diagnostiquer la configuration de Resend.
      </p>
      <EnvoiEmailsTest
        action={envoyerEmailTest}
        destinataire={destinataire}
        resendConfigure={Boolean(process.env.resend_api_key)}
        modeles={MODELES.map((valeur) => ({ valeur, libelle: LIBELLES_MODELE[valeur] }))}
        apercus={apercus}
      />
    </>
  );
}
