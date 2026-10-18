import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modale } from "./Modale";

afterEach(cleanup);

function AvecBouton({ onFermer = () => {} }: { onFermer?: () => void }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuverte(true)}>
        Ouvrir
      </button>
      <Modale
        ouverte={ouverte}
        titre="Modifier l'avis"
        onFermer={() => {
          onFermer();
          setOuverte(false);
        }}
      >
        <input aria-label="Auteurs" />
        <input aria-label="Texte" />
      </Modale>
    </>
  );
}

describe("Modale", () => {
  it("est un dialogue nommé par son titre, focalise le premier champ et rend le focus à la fermeture", () => {
    render(<AvecBouton />);
    const ouvrir = screen.getByRole("button", { name: "Ouvrir" });
    ouvrir.focus();
    fireEvent.click(ouvrir);
    const dialogue = screen.getByRole("dialog", { name: "Modifier l'avis" });
    expect(dialogue).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Auteurs")).toHaveFocus();
    fireEvent.keyDown(dialogue, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(ouvrir).toHaveFocus();
  });

  it("garde le focus à l'intérieur (Tab tourne)", () => {
    render(<AvecBouton />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    const dialogue = screen.getByRole("dialog");
    const texte = screen.getByLabelText("Texte");
    texte.focus();
    fireEvent.keyDown(dialogue, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Fermer" })).toHaveFocus();
    fireEvent.keyDown(dialogue, { key: "Tab", shiftKey: true });
    expect(texte).toHaveFocus();
  });

  it("se ferme au clic sur le fond et sur ×", () => {
    const onFermer = vi.fn();
    render(<AvecBouton onFermer={onFermer} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(onFermer).toHaveBeenCalledTimes(2);
  });

  it("fige la page derrière tant qu'elle est ouverte", () => {
    render(<AvecBouton />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });
});

describe("ConfirmDialog", () => {
  const rendre = () => {
    const onConfirmer = vi.fn();
    const onAnnuler = vi.fn();
    render(
      <ConfirmDialog ouverte titre="Supprimer cet avis ?" message="Il disparaîtra du site." libelleConfirmer="Supprimer" danger onConfirmer={onConfirmer} onAnnuler={onAnnuler} />,
    );
    return { onConfirmer, onAnnuler };
  };

  it("est une alerte décrite par son message, focus sur « Annuler »", () => {
    rendre();
    const alerte = screen.getByRole("alertdialog", { name: "Supprimer cet avis ?" });
    expect(alerte).toHaveAccessibleDescription("Il disparaîtra du site.");
    expect(screen.getByRole("button", { name: "Annuler" })).toHaveFocus();
  });

  it("confirme seulement par le bouton, annule par Échap", () => {
    const { onConfirmer, onAnnuler } = rendre();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(onAnnuler).toHaveBeenCalledOnce();
    expect(onConfirmer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onConfirmer).toHaveBeenCalledOnce();
  });

  it("une confirmation par-dessus une modale ne ferme que la confirmation à Échap", () => {
    const fermerModale = vi.fn();
    const annuler = vi.fn();
    render(
      <Modale ouverte titre="Fiche" onFermer={fermerModale}>
        <ConfirmDialog ouverte titre="Vraiment ?" message="…" onConfirmer={() => {}} onAnnuler={annuler} />
      </Modale>,
    );
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(annuler).toHaveBeenCalledOnce();
    expect(fermerModale).not.toHaveBeenCalled();
  });
});
