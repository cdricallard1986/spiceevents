import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResultatAudit } from "@/lib/admin/audit-rls";
import type { Suite } from "@/hooks/useSuite";
import { AuditRls } from "./AuditRls";

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

function suite(etat: Partial<Suite<ResultatAudit>>): Suite<ResultatAudit> {
  return { enCours: false, erreur: null, resultat: null, termineeA: null, relancer: vi.fn(async () => {}), ...etat };
}

describe("AuditRls", () => {
  it("affiche chaque vérification par rôle, conforme ou en échec, et le bilan", () => {
    render(<AuditRls suite={suite({ resultat: AUDIT, termineeA: new Date("2026-10-18T10:00:05Z") })} />);
    expect(screen.getByText("Bloqué : droits refusés (42501)")).toBeInTheDocument();
    expect(screen.getByText("Valeur inattendue : renvoie false au lieu de true")).toHaveClass("text-erreur");
    expect(screen.getByText("Conforme :")).toBeInTheDocument();
    expect(screen.getByText("En échec :")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Visiteur" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cédric" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 en échec · 1/2 vérifications · 12:00:05");
  });

  it("« Relancer » rejoue l'audit ; le bouton est inactif pendant l'exécution", () => {
    const s = suite({ resultat: AUDIT });
    render(<AuditRls suite={s} />);
    fireEvent.click(screen.getByRole("button", { name: "Relancer" }));
    expect(s.relancer).toHaveBeenCalledTimes(1);
    cleanup();
    render(<AuditRls suite={suite({ enCours: true })} />);
    expect(screen.getByRole("button", { name: "Exécution en cours…" })).toBeDisabled();
  });

  it("dit clairement que l'audit n'a pas pu partir", () => {
    render(<AuditRls suite={suite({ erreur: "L'audit n'a pas pu être lancé." })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("n'a pas pu être lancé");
  });
});
