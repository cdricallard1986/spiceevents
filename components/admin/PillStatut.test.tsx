import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PillStatut } from "./PillStatut";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PillStatut", () => {
  it.each([
    ["a_jour", "✓ À jour"],
    ["modifie", "• Modifié"],
    ["enregistrement", "⟳ Enregistrement…"],
    ["enregistre", "✓ Enregistré"],
  ] as const)("affiche « %s »", (statut, texte) => {
    render(<PillStatut statut={statut} />);
    expect(screen.getByRole("status")).toHaveTextContent(texte);
  });

  it("« Enregistré » s'estompe en « À jour »", () => {
    vi.useFakeTimers();
    render(<PillStatut statut="enregistre" />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("status")).toHaveTextContent("✓ À jour");
  });

  it("en erreur, devient un bouton qui relance l'enregistrement", () => {
    const onReessayer = vi.fn();
    render(<PillStatut statut="erreur" onReessayer={onReessayer} />);
    fireEvent.click(screen.getByRole("button", { name: "⚠ Non enregistré — réessayer" }));
    expect(onReessayer).toHaveBeenCalledOnce();
  });
});
