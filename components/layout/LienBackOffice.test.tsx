import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LienBackOffice } from "./LienBackOffice";

// La Server Action réelle (Supabase, en-têtes) n'a pas sa place ici : le formulaire est testé à part.
vi.mock("@/app/admin/connexion/actions", () => ({ seConnecter: vi.fn(async () => ({ statut: "initial" })) }));

afterEach(cleanup);

describe("LienBackOffice", () => {
  it("ouvre la connexion dans une fenêtre, sans quitter la page, et la referme", async () => {
    render(<LienBackOffice />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back office" }));
    const fenetre = await screen.findByRole("dialog", { name: "Connexion au back office" });
    expect(fenetre).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    fireEvent.keyDown(fenetre, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
