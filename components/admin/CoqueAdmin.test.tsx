import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/avis" }));
vi.mock("@/app/admin/connexion/actions", () => ({ seConnecter: vi.fn(), seDeconnecter: vi.fn() }));

const { CoqueAdmin, libelleNouvelles } = await import("./CoqueAdmin");

afterEach(cleanup);

/** Le lien « Demandes » du menu latéral d'ordinateur (le tiroir du téléphone est fermé). */
const lienDemandes = () => screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/admin/demandes")!;

describe("CoqueAdmin — pastille des nouvelles demandes", () => {
  it("affiche le nombre à côté de « Demandes », lisible par les lecteurs d'écran", () => {
    render(
      <CoqueAdmin version="1.0.0" email="c@x.fr" nouvellesDemandes={3} relireDemandes={async () => 3}>
        contenu
      </CoqueAdmin>,
    );
    expect(lienDemandes()).toHaveTextContent("Demandes3");
    expect(lienDemandes()).toHaveTextContent("(3 nouvelles demandes)");
  });

  it("se met à jour avec le nombre relu en base", async () => {
    const relire = vi.fn(async () => 5);
    render(
      <CoqueAdmin version="1.0.0" email="c@x.fr" nouvellesDemandes={1} relireDemandes={relire}>
        contenu
      </CoqueAdmin>,
    );
    await waitFor(() => expect(lienDemandes()).toHaveTextContent("(5 nouvelles demandes)"));
    expect(relire).toHaveBeenCalled();
  });

  it("pas de pastille sans nouvelle demande, ni si la base ne répond pas", async () => {
    render(
      <CoqueAdmin version="1.0.0" email="c@x.fr" nouvellesDemandes={null} relireDemandes={async () => null}>
        contenu
      </CoqueAdmin>,
    );
    await waitFor(() => expect(lienDemandes()).toHaveTextContent(/^Demandes$/));
    expect(libelleNouvelles(1)).toBe("1 nouvelle demande");
  });
});
