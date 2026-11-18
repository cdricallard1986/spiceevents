import { describe, expect, it } from "vitest";
import { avisRestants, lotsAvis } from "./lots";

const liste = (n: number) => Array.from({ length: n }, (_, i) => i);
const tailles = (n: number) => lotsAvis(liste(n)).map((l) => l.length);

describe("lots de la page Avis", () => {
  it("9 avis d’abord, puis 12 par 12", () => {
    expect(tailles(76)).toEqual([9, 12, 12, 12, 12, 12, 7]);
    expect(tailles(33)).toEqual([9, 12, 12]);
  });

  it("un reste de 1 à 3 avis rejoint le lot précédent : pas de bouton pour si peu", () => {
    expect(tailles(9)).toEqual([9]);
    expect(tailles(11)).toEqual([11]);
    expect(tailles(12)).toEqual([12]);
    expect(tailles(13)).toEqual([9, 4]);
    expect(tailles(23)).toEqual([9, 14]);
  });

  it("garde tous les avis, dans l’ordre, et aucune liste vide", () => {
    expect(lotsAvis(liste(40)).flat()).toEqual(liste(40));
    expect(lotsAvis([])).toEqual([]);
  });

  it("compte les avis encore repliés", () => {
    const lots = lotsAvis(liste(76));
    expect(avisRestants(lots, 1)).toBe(67);
    expect(avisRestants(lots, 6)).toBe(7);
    expect(avisRestants(lots, 7)).toBe(0);
  });
});
