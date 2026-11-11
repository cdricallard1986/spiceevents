import { describe, expect, it } from "vitest";
import { FAQ, type ThemeFaq } from "@/contenu/pages/faq";
import { filtrerThemes, motsRecherche, normaliser } from "./recherche";

const THEMES: ThemeFaq[] = [
  {
    id: "musique",
    titre: "Musique",
    questions: [
      { question: "Peut-on choisir la playlist ?", reponse: "Oui, grâce au questionnaire musical." },
      { question: "Jouez-vous jusqu'à l'aube ?", reponse: "Jusqu'à 4 h, plus avec des heures supplémentaires." },
    ],
  },
  { id: "technique", titre: "Technique", questions: [{ question: "Quel éclairage ?", reponse: "Des lyres et des projecteurs LED." }] },
];

describe("recherche dans la FAQ", () => {
  it("ignore la casse, les accents, les ligatures et les apostrophes", () => {
    expect(normaliser("  Éclairage  Œuvre l’Aube ")).toBe("eclairage oeuvre l aube");
    expect(motsRecherche("L'éclairage, à 4h ?")).toEqual(["eclairage", "4h"]);
  });

  it("recherche vide ou trop courte : tout est affiché", () => {
    expect(filtrerThemes(THEMES, "")).toBe(THEMES);
    expect(filtrerThemes(THEMES, " à ")).toBe(THEMES);
  });

  it("garde les questions qui contiennent tous les mots, dans la question ou la réponse", () => {
    expect(filtrerThemes(THEMES, "eclairage")).toEqual([THEMES[1]]);
    expect(filtrerThemes(THEMES, "questionnaire PLAYLIST")).toEqual([{ ...THEMES[0], questions: [THEMES[0].questions[0]] }]);
    expect(filtrerThemes(THEMES, "playlist lyres")).toEqual([]);
  });

  it("ne modifie pas les thèmes d'origine", () => {
    filtrerThemes(THEMES, "aube");
    expect(THEMES[0].questions).toHaveLength(2);
  });

  it("trouve des questions réelles de la FAQ, dans les deux langues", () => {
    expect(filtrerThemes(FAQ.fr.themes, "acompte").length).toBeGreaterThan(0);
    expect(filtrerThemes(FAQ.en.themes, "deposit").length).toBeGreaterThan(0);
  });
});
