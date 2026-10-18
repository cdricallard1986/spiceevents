"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clientNavigateur } from "@/lib/supabase/client";

/**
 * Barre de développement (OBLIGATOIRE sur les plateformes de Cédric), active
 * seulement avec `NODE_ENV=development` : jamais rendue en production. Un seul
 * profil réel ici, elle indique d'un coup d'œil sous quelle identité on teste :
 * « Cédric connecté » (or) ou « visiteur » (gris). La couleur est gardée dans
 * le navigateur : elle reste juste dès l'affichage, même après rechargement.
 */
export function DevToolbar() {
  if (process.env.NODE_ENV !== "development") return null;
  return <BarreOutilsDev />;
}

type Profil = "cedric" | "visiteur";

const CLE_PROFIL = "dev:profil";

const PROFILS: Record<Profil, { libelle: string; classes: string }> = {
  cedric: { libelle: "Cédric connecté", classes: "border-or bg-or text-nuit" },
  visiteur: { libelle: "Visiteur", classes: "border-ligne bg-nuit-3 text-sable" },
};

function lireProfil(): Profil {
  try {
    return window.localStorage.getItem(CLE_PROFIL) === "cedric" ? "cedric" : "visiteur";
  } catch {
    return "visiteur";
  }
}

function ecrireProfil(profil: Profil) {
  try {
    window.localStorage.setItem(CLE_PROFIL, profil);
  } catch {
    // Stockage indisponible : la couleur sera recalculée au prochain affichage.
  }
}

function BarreOutilsDev() {
  const [profil, setProfil] = useState<Profil>("visiteur");
  const [email, setEmail] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    setProfil(lireProfil());
    const supabase = clientNavigateur();
    let annule = false;

    async function verifier() {
      try {
        const { data } = await supabase.auth.getUser();
        let suivant: Profil = "visiteur";
        if (data.user) {
          const { data: admin } = await supabase.rpc("est_admin");
          if (admin === true) suivant = "cedric";
        }
        if (annule) return;
        setProfil(suivant);
        setEmail(data.user?.email ?? null);
        ecrireProfil(suivant);
      } catch {
        // Supabase injoignable : on garde la dernière couleur connue.
      }
    }

    void verifier();
    // Pas d'appel Supabase directement dans le rappel (risque de blocage) : on le diffère.
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void verifier(), 0);
    });
    return () => {
      annule = true;
      data.subscription.unsubscribe();
    };
  }, []);

  async function seDeconnecter() {
    // Cet appareil seulement : jamais le défaut « global » de signOut().
    await clientNavigateur().auth.signOut({ scope: "local" });
    ecrireProfil("visiteur");
    window.location.assign("/admin/connexion?raison=deconnecte");
  }

  const style = PROFILS[profil];
  const action = "block w-full px-4 py-2.5 text-left text-sm text-ivoire hover:bg-nuit-3 hover:text-or";

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2 text-sm">
      {ouvert && (
        <div className="w-64 border border-ligne bg-nuit-2 py-2 shadow-2xl">
          <p className="px-4 pb-2 text-xs text-sable">{email ? `Session : ${email}` : "Aucune session"}</p>
          {profil === "cedric" ? (
            <button type="button" onClick={() => void seDeconnecter()} className={action}>
              Se déconnecter (cet appareil)
            </button>
          ) : (
            <Link href="/admin/connexion" className={action}>
              Se connecter
            </Link>
          )}
          <Link href="/admin" className={action}>
            Back office
          </Link>
          <Link href="/" className={action}>
            Site public
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] shadow-lg ${style.classes}`}
      >
        Dev · {style.libelle}
      </button>
    </div>
  );
}
