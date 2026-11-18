import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvisParLots } from "./AvisParLots";

afterEach(cleanup);

const liste = (n: number) => Array.from({ length: n }, (_, i) => ({ cle: `a${i}`, auteurs: `Couple ${i + 1}`, texte: `Avis numéro ${i + 1}` }));
const visibles = () => screen.getAllByRole("listitem").length;

describe("AvisParLots", () => {
  it("montre 9 avis, garde les autres dans la page (repliés), et en ajoute 12 à chaque clic", () => {
    const { container } = render(<AvisParLots liste={liste(30)} locale="fr" />);
    expect(visibles()).toBe(9);
    // Tous les avis sont dans le HTML : Google et la recherche dans la page les voient.
    expect(container.querySelectorAll("li")).toHaveLength(30);
    expect(screen.getByRole("status")).toHaveTextContent("9 avis affichés sur 30");
    fireEvent.click(screen.getByRole("button", { name: /Voir plus d’avis/ }));
    expect(visibles()).toBe(21);
    // Le clavier reprend au premier avis du nouveau lot.
    expect(document.activeElement).toHaveTextContent("Avis numéro 10");
    fireEvent.click(screen.getByRole("button", { name: /Voir plus d’avis/ }));
    expect(visibles()).toBe(30);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("peu d’avis : tous affichés, sans bouton ; libellés anglais", () => {
    render(<AvisParLots liste={liste(9)} locale="en" />);
    expect(visibles()).toBe(9);
    expect(screen.queryByRole("button")).toBeNull();
    cleanup();
    render(<AvisParLots liste={liste(20)} locale="en" />);
    expect(screen.getByRole("button", { name: /Show more reviews/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("9 of 20 reviews shown");
  });
});
