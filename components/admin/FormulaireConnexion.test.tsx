import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EtatConnexion } from "@/lib/admin/connexion";
import { FormulaireConnexion } from "./FormulaireConnexion";
import { FournisseurToasts } from "./Toasts";

afterEach(cleanup);

function rendre(action: (etat: EtatConnexion, fd: FormData) => Promise<EtatConnexion>, suite?: string) {
  return render(
    <FournisseurToasts>
      <FormulaireConnexion action={action} suite={suite} />
    </FournisseurToasts>,
  );
}

describe("FormulaireConnexion", () => {
  it("propose l'autoremplissage du gestionnaire de mots de passe", () => {
    rendre(vi.fn());
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
  });

  it("envoie l'email, le mot de passe et la page de retour", async () => {
    const action = vi.fn<(e: EtatConnexion, fd: FormData) => Promise<EtatConnexion>>(async () => ({ statut: "connecte" }));
    rendre(action, "/admin/avis");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "cedric@spiceevents.fr" } });
    fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await waitFor(() => expect(action).toHaveBeenCalled());
    const fd = action.mock.calls[0][1];
    expect(fd.get("email")).toBe("cedric@spiceevents.fr");
    expect(fd.get("motDePasse")).toBe("secret");
    expect(fd.get("suite")).toBe("/admin/avis");
  });

  it("affiche l'erreur : bordure rouge, message sous le champ, toast en haut", async () => {
    const action = vi.fn(async (): Promise<EtatConnexion> => ({
      statut: "erreur",
      message: "Vérifiez les champs signalés.",
      erreurs: { email: "Indiquez une adresse email valide." },
      email: "pas-un-email",
    }));
    rendre(action);
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    const champ = await screen.findByLabelText("Email");
    await waitFor(() => expect(champ).toHaveAttribute("aria-invalid", "true"));
    expect(champ.className).toContain("border-erreur");
    expect(champ).toHaveAccessibleDescription("Indiquez une adresse email valide.");
    await waitFor(() => expect(screen.getAllByRole("alert").some((a) => a.closest(".fixed"))).toBe(true));
    expect(champ).toHaveValue("pas-un-email");
  });

  it("ne désactive jamais les champs pendant l'envoi", async () => {
    let terminer!: (e: EtatConnexion) => void;
    const action = vi.fn(() => new Promise<EtatConnexion>((r) => (terminer = r)));
    rendre(action);
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await screen.findByRole("button", { name: "Connexion…" });
    expect(screen.getByLabelText("Email")).toBeEnabled();
    expect(screen.getByLabelText("Mot de passe")).toBeEnabled();
    terminer({ statut: "connecte" });
  });
});
