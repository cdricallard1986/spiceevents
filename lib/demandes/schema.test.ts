import { describe, expect, it } from "vitest";
import { validerSuivi } from "./schema";

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";

describe("validerSuivi", () => {
  it("accepte un statut, une note, ou les deux — et n'écrit que ce qui est fourni", () => {
    expect(validerSuivi({ id: ID, statut: "rappelee" })).toEqual({ ok: true, id: ID, champs: { statut: "rappelee" } });
    expect(validerSuivi({ id: ID, note_interne: "Rappeler lundi" })).toEqual({ ok: true, id: ID, champs: { note_interne: "Rappeler lundi" } });
    expect(validerSuivi({ id: ID, statut: "signee", note_interne: "Signé !" })).toEqual({ ok: true, id: ID, champs: { statut: "signee", note_interne: "Signé !" } });
  });

  it("retire les espaces aux extrémités ; une note vide (ou null) est effacée", () => {
    expect(validerSuivi({ id: ID, note_interne: "  Devis envoyé le 20  \n" })).toMatchObject({ champs: { note_interne: "Devis envoyé le 20" } });
    expect(validerSuivi({ id: ID, note_interne: "   " })).toMatchObject({ ok: true, champs: { note_interne: null } });
    expect(validerSuivi({ id: ID, note_interne: null })).toMatchObject({ ok: true, champs: { note_interne: null } });
    // Les retours à la ligne au milieu restent.
    expect(validerSuivi({ id: ID, note_interne: "a\n\nb" })).toMatchObject({ champs: { note_interne: "a\n\nb" } });
  });

  it("note : 5 000 caractères au plus (comptés comme Postgres)", () => {
    expect(validerSuivi({ id: ID, note_interne: "🎉".repeat(5000) }).ok).toBe(true);
    expect(validerSuivi({ id: ID, note_interne: "a".repeat(5001) })).toEqual({ ok: false, message: "Note interne : 5 000 caractères au maximum." });
  });

  it("refuse un identifiant invalide, un statut inconnu, ou rien à enregistrer", () => {
    expect(validerSuivi({ id: "pas-un-uuid", statut: "signee" })).toEqual({ ok: false, message: "Demande introuvable." });
    expect(validerSuivi({ statut: "signee" }).ok).toBe(false);
    expect(validerSuivi({ id: ID, statut: "archivee" })).toEqual({ ok: false, message: "Statut inconnu." });
    expect(validerSuivi({ id: ID, note_interne: 42 })).toEqual({ ok: false, message: "Note invalide." });
    expect(validerSuivi({ id: ID })).toEqual({ ok: false, message: "Rien à enregistrer : indiquez un statut ou une note." });
    expect(validerSuivi(null).ok).toBe(false);
    expect(validerSuivi("x").ok).toBe(false);
  });

  it("refuse toute autre colonne (email, message…) : seuls le statut et la note se modifient", () => {
    const r = validerSuivi({ id: ID, statut: "signee", email: "pirate@example.com" });
    expect(r.ok).toBe(false);
    expect(validerSuivi({ id: ID, note_interne: "x", email_envoye: true }).ok).toBe(false);
  });
});
