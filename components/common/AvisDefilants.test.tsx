import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvisDefilants } from "./AvisDefilants";

vi.mock("next-intl", () => ({ useLocale: () => "fr" }));

const liste = [
  { cle: "a", auteurs: "Harold & David", texte: "Parfait." },
  { cle: "b", auteurs: "Léa & Floris", texte: "Génial." },
  { cle: "c", auteurs: "Pierre & Nina", texte: "Incroyable." },
];
const libelles = { precedent: "Avis précédent", suivant: "Avis suivant", avis: "Avis" };

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const visible = () => document.querySelector('figure[aria-hidden="false"] figcaption')?.textContent;

describe("AvisDefilants", () => {
  it("passe tout seul à l'avis suivant, puis revient au premier", () => {
    render(<AvisDefilants liste={liste} image="couple-faisceaux" libelles={libelles} />);
    expect(visible()).toBe("Harold & David");
    act(() => vi.advanceTimersByTime(7000));
    expect(visible()).toBe("Léa & Floris");
    act(() => vi.advanceTimersByTime(7000));
    expect(visible()).toBe("Pierre & Nina");
    act(() => vi.advanceTimersByTime(7000));
    expect(visible()).toBe("Harold & David");
  });

  it("se pilote aux flèches et aux points, et s'arrête au survol", () => {
    render(<AvisDefilants liste={liste} image="couple-faisceaux" libelles={libelles} />);
    fireEvent.click(screen.getByRole("button", { name: "Avis précédent" }));
    expect(visible()).toBe("Pierre & Nina");
    fireEvent.click(screen.getByRole("button", { name: "Avis 2 : Léa & Floris" }));
    expect(visible()).toBe("Léa & Floris");
    fireEvent.mouseEnter(document.querySelector("section")!);
    act(() => vi.advanceTimersByTime(20000));
    expect(visible()).toBe("Léa & Floris");
  });

  it("ne défile pas quand l'appareil demande moins d'animations", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    render(<AvisDefilants liste={liste} image="couple-faisceaux" libelles={libelles} />);
    act(() => vi.advanceTimersByTime(20000));
    expect(visible()).toBe("Harold & David");
  });
});

describe("tirerAuHasard", () => {
  it("rend n éléments distincts de la liste, sans la modifier", async () => {
    const { tirerAuHasard } = await import("./AvisDefilants");
    const liste = [1, 2, 3, 4, 5, 6, 7, 8];
    const tirage = tirerAuHasard(liste, 5);
    expect(tirage).toHaveLength(5);
    expect(new Set(tirage).size).toBe(5);
    for (const x of tirage) expect(liste).toContain(x);
    expect(liste).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
