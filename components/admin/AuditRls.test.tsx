import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResultatAudit } from "@/lib/admin/audit-rls";
import { AuditRls } from "./AuditRls";
import { FournisseurToasts } from "./Toasts";

afterEach(cleanup);

const AUDIT: ResultatAudit = {
  date: "2026-10-18T10:00:00.000Z",
  reussis: 1,
  echoues: 1,
  resultats: [
    {
      verification: { libelle: "Lire les administrateurs", role: "visiteur", cible: "administrateurs", operation: "select", attendu: "vide" },
      ok: true,
      faille: false,
      constat: "Bloqué : droits refusés (42501)",
    },
    {
      verification: { libelle: "Appeler est_admin()", role: "admin", cible: "est_admin", operation: "rpc", attendu: "autorisé", valeur: true },
      ok: false,
      faille: false,
      constat: "Valeur inattendue : renvoie false au lieu de true",
    },
  ],
};

function rendre(action: () => Promise<ResultatAudit>) {
  return render(
    <FournisseurToasts>
      <AuditRls action={action} />
    </FournisseurToasts>,
  );
}

describe("AuditRls", () => {
  it("lance l'audit au clic et affiche chaque vérification, conforme ou en échec", async () => {
    const action = vi.fn(async () => AUDIT);
    rendre(action);
    fireEvent.click(screen.getByRole("button", { name: "Lancer l'audit" }));
    await waitFor(() => expect(screen.getByText("Bloqué : droits refusés (42501)")).toBeInTheDocument());
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Valeur inattendue : renvoie false au lieu de true")).toHaveClass("text-erreur");
    expect(screen.getByText("Conforme :")).toBeInTheDocument();
    expect(screen.getByText("En échec :")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Visiteur" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cédric" })).toBeInTheDocument();
    // Les résultats peuvent s'afficher avant la fin de la transition (« Audit en cours… ») : on attend le bouton.
    expect(await screen.findByRole("button", { name: "Relancer l'audit" })).toBeInTheDocument();
  });

  it("dit clairement que l'audit n'a pas pu partir", async () => {
    rendre(async () => Promise.reject(new Error("réseau")));
    fireEvent.click(screen.getByRole("button", { name: "Lancer l'audit" }));
    await waitFor(() => expect(screen.getAllByRole("alert").some((e) => e.textContent?.includes("n'a pas pu être lancé"))).toBe(true));
  });
});
