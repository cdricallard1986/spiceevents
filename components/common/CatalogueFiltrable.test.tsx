import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogueFiltrable } from "./CatalogueFiltrable";

afterEach(cleanup);

const cartes = [
  { cle: "a", categorie: "musique", contenu: <p>Bar à vinyles</p> },
  { cle: "b", categorie: "souvenirs", contenu: <p>Photobooth</p> },
  { cle: "c", categorie: "musique", contenu: <p>Sonorisation</p> },
];
const categories = { musique: "Musique", souvenirs: "Souvenirs" };

const visibles = () => [...document.querySelectorAll("li")].filter((li) => !li.hidden).map((li) => li.textContent);

describe("CatalogueFiltrable", () => {
  it("affiche tout, puis filtre par catégorie et revient à tout", () => {
    render(<CatalogueFiltrable cartes={cartes} categories={categories} libelleTout="Tout découvrir" libelleFiltres="Filtrer" />);
    expect(visibles()).toEqual(["Bar à vinyles", "Photobooth", "Sonorisation"]);
    expect(screen.getByRole("button", { name: "Tout découvrir" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Musique" }));
    expect(visibles()).toEqual(["Bar à vinyles", "Sonorisation"]);
    expect(screen.getByRole("button", { name: "Musique" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tout découvrir" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Tout découvrir" }));
    expect(visibles()).toHaveLength(3);
  });
});
