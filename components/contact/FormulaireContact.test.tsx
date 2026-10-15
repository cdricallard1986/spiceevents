import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTACT } from "@/contenu/pages/contact";
import type { EtatFormulaire } from "@/lib/contact/traitement";
import { FormulaireContact } from "./FormulaireContact";

const TEXTES = CONTACT.fr.formulaire.textes;

function rendre(action: (etat: EtatFormulaire, fd: FormData) => Promise<EtatFormulaire>) {
  return render(<FormulaireContact action={action} locale="fr" textes={TEXTES} />);
}

function envoyer() {
  fireEvent.click(screen.getByRole("button", { name: TEXTES.envoyer }));
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("FormulaireContact", () => {
  it("associe chaque champ à son libellé", () => {
    rendre(vi.fn());
    for (const libelle of [/Vos prénoms/, /^Nom$/, /^Email/, /Téléphone/, /Type d'événement/, /Date de l'événement/, /Lieu/, /Nombre d'invités/, /Votre projet/]) {
      expect(screen.getByLabelText(libelle)).toBeInTheDocument();
    }
  });

  it("propose les bons claviers et l'autoremplissage", () => {
    rendre(vi.fn());
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute("inputmode", "email");
    expect(screen.getByLabelText(/Téléphone/)).toHaveAttribute("autocomplete", "tel");
    expect(screen.getByLabelText(/Téléphone/)).toHaveAttribute("inputmode", "tel");
    expect(screen.getByLabelText(/Vos prénoms/)).toHaveAttribute("autocomplete", "given-name");
    expect(screen.getByLabelText(/Nombre d'invités/)).toHaveAttribute("inputmode", "numeric");
  });

  it("envoie la langue, le champ piège vide et les horodatages", async () => {
    const action = vi.fn<(etat: EtatFormulaire, fd: FormData) => Promise<EtatFormulaire>>(async () => ({ statut: "succes" }));
    rendre(action);
    envoyer();
    await waitFor(() => expect(action).toHaveBeenCalled());
    const fd = action.mock.calls[0][1];
    expect(fd.get("langue")).toBe("fr");
    expect(fd.get("site_web")).toBe("");
    expect(Number(fd.get("ouvert_le"))).toBeGreaterThan(0);
    expect(Number(fd.get("envoye_le"))).toBeGreaterThanOrEqual(Number(fd.get("ouvert_le")));
  });

  it("cache le champ piège aux humains et aux lecteurs d'écran", () => {
    const { container } = rendre(vi.fn());
    const piege = container.querySelector('input[name="site_web"]');
    expect(piege).toHaveAttribute("tabindex", "-1");
    expect(piege?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("affiche les erreurs : bordure rouge, message sous le champ, toast", async () => {
    const action = vi.fn(
      async (): Promise<EtatFormulaire> => ({
        statut: "erreur",
        message: "Certains champs sont à vérifier.",
        erreurs: { email: "Indiquez une adresse email valide." },
        valeurs: { prenoms: "Julie & Thomas", email: "julie@" },
      }),
    );
    rendre(action);
    envoyer();
    const champ = await screen.findByLabelText(/^Email/);
    await waitFor(() => expect(champ).toHaveAttribute("aria-invalid", "true"));
    expect(champ.className).toContain("border-erreur");
    const message = screen.getByText("Indiquez une adresse email valide.");
    expect(champ.getAttribute("aria-describedby")).toContain(message.id);
    const toast = screen.getByRole("alert");
    expect(toast).toHaveTextContent("Certains champs sont à vérifier.");
    expect(toast.className).toContain("fixed");
    // Les autres champs ne sont pas marqués en erreur, et gardent leur saisie.
    expect(screen.getByLabelText(/Vos prénoms/)).toHaveAttribute("aria-invalid", "false");
    await waitFor(() => expect(screen.getByLabelText(/Vos prénoms/)).toHaveValue("Julie & Thomas"));
  });

  it("ne désactive jamais les champs pendant l'envoi ; seul le bouton l'indique", async () => {
    let terminer: (e: EtatFormulaire) => void = () => {};
    const action = vi.fn(() => new Promise<EtatFormulaire>((r) => (terminer = r)));
    rendre(action);
    envoyer();
    const bouton = await screen.findByRole("button", { name: TEXTES.envoiEnCours });
    expect(bouton).toBeDisabled();
    expect(screen.getByLabelText(/Votre projet/)).toBeEnabled();
    expect(screen.getByLabelText(/^Email/)).toBeEnabled();
    await act(async () => terminer({ statut: "succes" }));
  });

  it("remplace le formulaire par la confirmation après succès", async () => {
    rendre(vi.fn(async () => ({ statut: "succes" }) as EtatFormulaire));
    envoyer();
    expect(await screen.findByText(/Cédric vous répond personnellement/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: TEXTES.envoyer })).toBeNull();
  });

  it("pré-sélectionne le type d'événement depuis ?type=", async () => {
    window.history.replaceState(null, "", "/contact?type=entreprise");
    rendre(vi.fn());
    await waitFor(() => expect(screen.getByLabelText(/Type d'événement/)).toHaveValue("entreprise"));
  });

  it("ignore un ?type= inconnu", async () => {
    window.history.replaceState(null, "", "/contact?type=<script>");
    rendre(vi.fn());
    await waitFor(() => expect(screen.getByLabelText(/Type d'événement/)).toHaveValue(""));
  });
});
