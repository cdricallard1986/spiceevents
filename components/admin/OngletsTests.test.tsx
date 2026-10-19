import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResultatAudit } from "@/lib/admin/audit-rls";
import type { ResultatSuiteSql } from "@/lib/admin/tests-sql";
import type { CleOnglet } from "@/lib/admin/onglets-tests";
import { OngletsTests } from "./OngletsTests";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

const AUDIT: ResultatAudit = {
  date: "2026-10-18T10:00:00.000Z",
  reussis: 1,
  echoues: 0,
  resultats: [
    {
      verification: { libelle: "Lire les administrateurs", role: "visiteur", cible: "administrateurs", operation: "select", attendu: "vide" },
      ok: true,
      faille: false,
      constat: "Bloqué : droits refusés (42501)",
    },
  ],
};

const SQL: ResultatSuiteSql = {
  ok: false,
  checks: [
    { nom: "Avis : un texte vide est refusé", ok: true, detail: "refusé (avis_texte_fr_check) / accepté" },
    { nom: "Journal : une modification met à jour updated_at", ok: false, detail: "updated_at après modification : 2000-01-01" },
    { nom: "Galeries : une photo n'y figure qu'une fois", ok: false, detail: "accepté / accepté" },
  ],
};

function rendre({
  lancerAudit = vi.fn(async () => AUDIT),
  lancerSql = vi.fn(async () => SQL),
  onglet = "sql" as CleOnglet,
  strict = false,
} = {}) {
  const arbre = (
    <OngletsTests
      ongletInitial={onglet}
      lancerAudit={lancerAudit}
      lancerSql={lancerSql}
      unitaires={{ etat: { type: "ok", total: 703 }, contenu: <p>Rapport Vitest</p> }}
      configuration={{ etat: { type: "echec", nombre: 1 }, contenu: <p>Variables</p> }}
    />
  );
  render(strict ? <StrictMode>{arbre}</StrictMode> : arbre);
  return { lancerAudit, lancerSql };
}

const onglet = (nom: RegExp) => screen.getByRole("tab", { name: nom });

describe("OngletsTests", () => {
  it("lance les deux suites live dès l'ouverture, une seule fois (même en mode strict), sans clic", async () => {
    const { lancerAudit, lancerSql } = rendre({ strict: true });
    await waitFor(() => expect(within(onglet(/Audit des droits/)).getByText("✓")).toBeInTheDocument());
    expect(lancerAudit).toHaveBeenCalledTimes(1);
    expect(lancerSql).toHaveBeenCalledTimes(1);
  });

  it("chaque onglet porte sa pastille de verdict, visible sans l'ouvrir", async () => {
    rendre();
    // Pendant l'exécution : « … ».
    expect(within(onglet(/Comportements SQL/)).getByText("…")).toBeInTheDocument();
    await waitFor(() => expect(within(onglet(/Comportements SQL/)).getByText("✗ 2")).toBeInTheDocument());
    expect(onglet(/Comportements SQL/)).toHaveAccessibleName("Comportements SQL (2 échecs)");
    expect(within(onglet(/Audit des droits/)).getByText("✓")).toBeInTheDocument();
    expect(within(onglet(/Tests unitaires/)).getByText("✓ 703")).toBeInTheDocument();
    expect(within(onglet(/Configuration/)).getByText("✗ 1")).toBeInTheDocument();
  });

  it("une suite qui ne tourne pas : pastille « ! » et message d'erreur, jamais un verdict", async () => {
    rendre({ lancerSql: vi.fn(async () => Promise.reject(new Error("La suite « tests_sql » n'a pas pu s'exécuter : fonction absente"))) });
    await waitFor(() => expect(within(onglet(/Comportements SQL/)).getByText("!")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("fonction absente");
    expect(screen.queryByText("Tout est conforme")).not.toBeInTheDocument();
  });

  it("un seul panneau visible ; le choix d'onglet est gardé dans l'adresse", async () => {
    rendre({ onglet: "droits" });
    expect(onglet(/Audit des droits/)).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "panneau-droits");
    fireEvent.click(onglet(/Configuration/));
    expect(onglet(/Configuration/)).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Variables");
    expect(window.location.search).toBe("?onglet=configuration");
    await waitFor(() => expect(within(onglet(/Comportements SQL/)).getByText("✗ 2")).toBeInTheDocument());
  });

  it("se parcourt au clavier (flèches, Début, Fin), un seul onglet dans l'ordre de tabulation", async () => {
    rendre();
    const sql = onglet(/Comportements SQL/);
    expect(sql).toHaveAttribute("tabindex", "0");
    expect(onglet(/Audit des droits/)).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(sql, { key: "ArrowRight" });
    expect(onglet(/Audit des droits/)).toHaveAttribute("aria-selected", "true");
    expect(onglet(/Audit des droits/)).toHaveFocus();
    fireEvent.keyDown(onglet(/Audit des droits/), { key: "End" });
    expect(onglet(/Configuration/)).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(onglet(/Configuration/), { key: "ArrowRight" });
    expect(onglet(/Comportements SQL/)).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(onglet(/Comportements SQL/), { key: "ArrowLeft" });
    expect(onglet(/Configuration/)).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(within(onglet(/Comportements SQL/)).getByText("✗ 2")).toBeInTheDocument());
  });

  it("« Relancer » rejoue la suite affichée et met la pastille à jour", async () => {
    const lancerSql = vi.fn().mockResolvedValueOnce(SQL).mockResolvedValueOnce({ ok: true, checks: [SQL.checks[0]] });
    rendre({ lancerSql });
    await waitFor(() => expect(within(onglet(/Comportements SQL/)).getByText("✗ 2")).toBeInTheDocument());
    expect(screen.getByText("updated_at après modification : 2000-01-01")).toHaveClass("text-erreur");
    const panneau = screen.getByRole("tabpanel");
    fireEvent.click(within(panneau).getByRole("button", { name: "Relancer" }));
    await waitFor(() => expect(within(onglet(/Comportements SQL/)).getByText("✓")).toBeInTheDocument());
    expect(lancerSql).toHaveBeenCalledTimes(2);
    expect(within(panneau).getByRole("status")).toHaveTextContent("Tout est conforme · 1/1 cas");
  });
});
