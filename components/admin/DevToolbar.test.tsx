import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Faux client Supabase : aucun appel réseau pendant les tests.
vi.mock("@/lib/supabase/client", () => ({
  clientNavigateur: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    rpc: async () => ({ data: false }),
  }),
}));

import { DevToolbar } from "./DevToolbar";
import { BarreDev } from "./BarreDev";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  window.localStorage.clear();
});

describe("DevToolbar", () => {
  it("n'est jamais rendue en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<DevToolbar />);
    expect(container).toBeEmptyDOMElement();
    expect(await BarreDev()).toBeNull();
  });

  it("n'est pas rendue hors développement (tests, aperçus)", () => {
    vi.stubEnv("NODE_ENV", "test");
    const { container } = render(<DevToolbar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("en développement, affiche le profil en cours (visiteur, en gris)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<DevToolbar />);
    const bouton = await screen.findByRole("button", { name: /Visiteur/ });
    expect(bouton.className).toContain("bg-nuit-3");
  });

  it("garde la couleur « Cédric connecté » (or) d'un affichage à l'autre", () => {
    vi.stubEnv("NODE_ENV", "development");
    window.localStorage.setItem("dev:profil", "cedric");
    render(<DevToolbar />);
    expect(screen.getByRole("button", { name: /Cédric connecté/ }).className).toContain("bg-or");
  });
});
