import { beforeEach, describe, expect, it, vi } from "vitest";

/** Changement de mot de passe : garde, mise à jour par la session, puis déconnexion des AUTRES appareils seulement. */

const etat = vi.hoisted(() => ({
  updateUser: vi.fn(),
  signOut: vi.fn(),
  admin: true,
}));

vi.mock("@/lib/admin/garde", () => ({
  exigerAdmin: vi.fn(async () => {
    if (!etat.admin) throw new Error("NEXT_REDIRECT");
    return { supabase: { auth: { updateUser: etat.updateUser, signOut: etat.signOut } }, utilisateur: { id: "u1" } };
  }),
}));

const { changerMotDePasse } = await import("./actions");
const VALIDE = "Piment!Rouge2026";

beforeEach(() => {
  etat.admin = true;
  etat.updateUser.mockReset().mockResolvedValue({ error: null });
  etat.signOut.mockReset().mockResolvedValue({ error: null });
});

describe("changerMotDePasse", () => {
  it("refuse sans session admin, avant toute écriture", async () => {
    etat.admin = false;
    await expect(changerMotDePasse({ nouveau: VALIDE, confirmation: VALIDE })).rejects.toThrow("NEXT_REDIRECT");
    expect(etat.updateUser).not.toHaveBeenCalled();
  });

  it("change le mot de passe puis déconnecte les autres appareils (jamais celui-ci, jamais tous)", async () => {
    expect(await changerMotDePasse({ nouveau: VALIDE, confirmation: VALIDE })).toEqual({ statut: "ok" });
    expect(etat.updateUser).toHaveBeenCalledWith({ password: VALIDE });
    expect(etat.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "others" });
  });

  it("traduit les refus de Supabase, sans déconnecter personne", async () => {
    for (const [code, attendu] of [
      ["weak_password", "fuites"],
      ["reauthentication_needed", "reconnectez-vous"],
      ["same_password", "déjà votre mot de passe"],
    ] as const) {
      etat.updateUser.mockResolvedValueOnce({ error: { code, message: code } });
      const r = await changerMotDePasse({ nouveau: VALIDE, confirmation: VALIDE });
      expect(r, code).toMatchObject({ statut: "erreur", message: expect.stringContaining(attendu) });
    }
    expect(etat.signOut).not.toHaveBeenCalled();
  });
});
