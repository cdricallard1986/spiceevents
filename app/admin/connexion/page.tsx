import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
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

  const message = messageRaison(raison);

  return (
    <main id="contenu" className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="text-center text-2xl text-ivoire">
          <Logo />
        </p>
        <div className="mt-10 border border-ligne bg-nuit-2 p-6 sm:p-10">
          <p className="surtitre mb-3">Back office</p>
          <h1 className="font-display text-4xl leading-tight">Connexion</h1>
          {message && (
            <p role="status" className="mt-6 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
              {message}
            </p>
          )}
          <div className="mt-8">
            <FormulaireConnexion action={seConnecter} suite={retour === CHEMIN_ADMIN ? undefined : retour} />
          </div>
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair">
            ← Retour au site
          </Link>
        </p>
      </div>
    </main>
  );
}
