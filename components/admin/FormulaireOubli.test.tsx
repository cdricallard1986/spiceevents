import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EtatReinitialisation } from "@/lib/admin/reinitialisation";
import { FormulaireOubli } from "./FormulaireOubli";
import { FournisseurToasts } from "./Toasts";

afterEach(cleanup);

type Action = (e: EtatReinitialisation, fd: FormData) => Promise<EtatReinitialisation>;

function rendre(action: Action) {
  return render(
    <FournisseurToasts>
      <FormulaireOubli action={action} />
    </FournisseurToasts>,
  );
}

describe("FormulaireOubli", () => {
  it("envoie l’adresse saisie, puis affiche la réponse unique (le compte existe ou non)", async () => {
    const action = vi.fn<Action>(async () => ({ statut: "envoye", message: "Si cette adresse correspond au compte…" }));
    rendre(action);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "cedric@spiceevents.fr" } });
    fireEvent.click(screen.getByRole("button", { name: "Recevoir le lien" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Si cette adresse correspond au compte…"));
    expect(action.mock.calls[0][1].get("email")).toBe("cedric@spiceevents.fr");
    expect(screen.getByRole("link", { name: "Retour à la connexion" })).toHaveAttribute("href", "/admin/connexion");
  });

  it("adresse invalide : bordure rouge, message sous le champ, saisie gardée", async () => {
    rendre(async () => ({ statut: "erreur", message: "Indiquez une adresse email valide.", email: "cedric@" }));
    fireEvent.click(screen.getByRole("button", { name: "Recevoir le lien" }));
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByLabelText("Email")).toHaveValue("cedric@");
    expect(screen.getByLabelText("Email").className).toContain("border-erreur");
  });
});
