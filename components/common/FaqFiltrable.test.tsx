// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAQ } from "@/contenu/pages/faq";
import { FaqFiltrable } from "./FaqFiltrable";

// `Link` de next-intl : une simple balise <a> (sans contexte de langue en test).
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const c = FAQ.fr;
const toutes = c.themes.flatMap((t) => t.questions);

function chercher(texte: string) {
  fireEvent.change(screen.getByLabelText(c.recherche.label), { target: { value: texte } });
}

const questionsAffichees = () => [...document.querySelectorAll("details")];

describe("FaqFiltrable", () => {
  it("sans recherche : tous les thèmes et toutes les questions, repliées", () => {
    render(<FaqFiltrable themes={c.themes} textes={c.recherche} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(c.themes.length);
    expect(questionsAffichees()).toHaveLength(toutes.length);
    expect(questionsAffichees().every((d) => !d.open)).toBe(true);
  });

  it("filtre les questions, les déplie et annonce leur nombre", () => {
    render(<FaqFiltrable themes={c.themes} textes={c.recherche} />);
    chercher("Acompte");
    const attendues = toutes.filter((q) => /acompte/i.test(`${q.question} ${q.reponse}`));
    expect(attendues.length).toBeGreaterThan(0);
    expect(questionsAffichees()).toHaveLength(attendues.length);
    expect(questionsAffichees().every((d) => d.open)).toBe(true);
    const annonce = attendues.length === 1 ? c.recherche.une : c.recherche.plusieurs.replace("{n}", String(attendues.length));
    expect(screen.getByText(annonce)).toBeInTheDocument();
  });

  it("aucun résultat : message et lien vers le contact ; le bouton efface la recherche", () => {
    render(<FaqFiltrable themes={c.themes} textes={c.recherche} />);
    chercher("xylophone");
    expect(questionsAffichees()).toHaveLength(0);
    expect(screen.getByText(c.recherche.aucune)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `${c.recherche.contact} →` })).toHaveAttribute("href", "/contact");
    fireEvent.click(screen.getByRole("button", { name: c.recherche.effacer }));
    expect(screen.getByLabelText(c.recherche.label)).toHaveValue("");
    expect(questionsAffichees()).toHaveLength(toutes.length);
  });
});
