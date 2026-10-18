import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Demande } from "@/lib/demandes/types";
import { GestionDemandes, type ActionsDemandes } from "./GestionDemandes";
import { FournisseurToasts } from "./Toasts";

function demande(id: string, champs: Partial<Demande> = {}): Demande {
  return {
    id,
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z",
    langue: "fr",
    prenoms: id,
    nom: "Martin",
    email: `${id.toLowerCase()}@example.com`,
    telephone: "+33612345678",
    type_evenement: "mariage",
    date_evenement: "2027-06-12",
    lieu: "Château de Chantilly",
    invites: 120,
    message: "Bonjour,\nNous nous marions en juin.",
    email_envoye: true,
    accuse_envoye: true,
    statut: "nouvelle",
    note_interne: null,
    ...champs,
  };
}

const LISTE = [
  demande("Juliette", { created_at: "2026-10-10T08:00:00Z" }),
  demande("Hélène", { created_at: "2026-10-15T08:00:00Z", nom: "Durand", lieu: "Paris", email_envoye: false, accuse_envoye: false, type_evenement: "entreprise" }),
  demande("Pierre", { created_at: "2026-10-01T08:00:00Z", statut: "signee", telephone: "+442079460958", langue: "en", date_evenement: null, invites: null, lieu: null }),
];

function actionsSimulees(surcharges: Partial<ActionsDemandes> = {}): ActionsDemandes {
  return {
    enregistrer: vi.fn(async ({ id, statut, note_interne }) => ({
      ok: true as const,
      suivi: { id, statut, note_interne: note_interne.trim() || null, updated_at: "2026-10-18T10:00:00Z" },
    })),
    ...surcharges,
  };
}

function rendre(actions = actionsSimulees(), liste = LISTE) {
  render(
    <FournisseurToasts>
      <GestionDemandes demandesInitiales={liste} actions={actions} />
    </FournisseurToasts>,
  );
  return actions;
}

/** Noms des demandes affichées, dans l'ordre. */
const affichees = () => screen.queryAllByRole("button", { name: /^Ouvrir la demande de / }).map((b) => b.getAttribute("aria-label")!.replace("Ouvrir la demande de ", ""));
const filtre = (nom: RegExp) => screen.getByRole("button", { name: nom });

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("GestionDemandes — liste", () => {
  it("les plus récentes en tête, avec date, type, événement, lieu, invités et statut", () => {
    rendre();
    expect(affichees()).toEqual(["Hélène Durand", "Juliette Martin", "Pierre Martin"]);
    expect(screen.getByText("15 oct. 2026")).toBeInTheDocument();
    expect(screen.getByText("Événement d'entreprise")).toBeInTheDocument();
    expect(screen.getAllByText("12 juin 2027")).toHaveLength(2);
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getAllByText("120 invités")).toHaveLength(2);
    expect(screen.getAllByText("Signée").length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent("3 demandes · 1 sans email reçu");
  });

  it("signale la demande dont l'email n'est pas parti", () => {
    rendre();
    const avertissements = screen.getAllByText("Email non reçu — à traiter à la main");
    expect(avertissements).toHaveLength(1);
    expect(avertissements[0].closest("li")).toHaveTextContent("Hélène Durand");
  });

  it("filtre par statut (avec compteurs) et par recherche", () => {
    rendre();
    expect(filtre(/^Toutes 3$/)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(filtre(/^Nouvelles 2$/));
    expect(affichees()).toEqual(["Hélène Durand", "Juliette Martin"]);
    fireEvent.click(filtre(/^Signées 1$/));
    expect(affichees()).toEqual(["Pierre Martin"]);
    fireEvent.click(filtre(/^Perdues 0$/));
    expect(screen.getByText("Aucune demande ne correspond à ces filtres.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));
    fireEvent.change(screen.getByLabelText("Rechercher (nom, prénoms, email, lieu)"), { target: { value: "helene" } });
    expect(affichees()).toEqual(["Hélène Durand"]);
    // Les compteurs suivent la recherche.
    expect(filtre(/^Nouvelles 1$/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Rechercher (nom, prénoms, email, lieu)"), { target: { value: "chantilly" } });
    expect(affichees()).toEqual(["Juliette Martin"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 demande affichée sur 3");
  });

  it("pagine au-delà de 50 demandes", () => {
    const beaucoup = Array.from({ length: 120 }, (_, i) =>
      demande(`P${String(i).padStart(3, "0")}`, { created_at: new Date(Date.UTC(2026, 0, 1) + i * 3600_000).toISOString() }),
    );
    rendre(actionsSimulees(), beaucoup);
    expect(affichees()).toHaveLength(50);
    expect(affichees()[0]).toBe("P119 Martin");
    expect(screen.getByText("Page 1 sur 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Plus récentes" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Plus anciennes →" }));
    fireEvent.click(screen.getByRole("button", { name: "Plus anciennes →" }));
    expect(screen.getByText("Page 3 sur 3")).toBeInTheDocument();
    expect(affichees()).toHaveLength(20);
    // Un nouveau filtre ramène à la première page.
    fireEvent.change(screen.getByLabelText("Rechercher (nom, prénoms, email, lieu)"), { target: { value: "p0" } });
    expect(screen.getByText("Page 1 sur 2")).toBeInTheDocument();
  });

  it("aucune pagination sous 50 demandes, et un message sans demande", () => {
    rendre(actionsSimulees(), []);
    expect(screen.getByText("Aucune demande reçue pour l'instant.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("GestionDemandes — fiche", () => {
  it("montre tout, avec les liens appeler / écrire / WhatsApp, et le message en texte brut", () => {
    const html = "<img src=x onerror=alert(1)><b>gras</b>";
    rendre(actionsSimulees(), [demande("Juliette", { message: html })]);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la demande de Juliette Martin" }));
    const fiche = screen.getByRole("dialog", { name: "Juliette Martin" });
    expect(within(fiche).getByRole("link", { name: "Appeler" })).toHaveAttribute("href", "tel:+33612345678");
    expect(within(fiche).getByRole("link", { name: "Écrire" })).toHaveAttribute(
      "href",
      `mailto:juliette@example.com?subject=${encodeURIComponent("Votre demande — Spice Events")}`,
    );
    const whatsapp = within(fiche).getByRole("link", { name: "WhatsApp" });
    expect(whatsapp).toHaveAttribute("href", "https://wa.me/33612345678");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    expect(fiche).toHaveTextContent("06 12 34 56 78");
    expect(fiche).toHaveTextContent("1 octobre 2026 à 12:00");
    expect(fiche).toHaveTextContent("samedi 12 juin 2027");
    expect(fiche).toHaveTextContent("Français");
    // Le message est affiché tel quel : aucune balise interprétée.
    expect(within(fiche).getByText(html)).toBeInTheDocument();
    expect(fiche.querySelector("img")).toBeNull();
    expect(fiche.querySelector("b")).toBeNull();
  });

  it("numéro étranger : pas de WhatsApp ; langue anglaise : objet du mail en anglais", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la demande de Pierre Martin" }));
    const fiche = screen.getByRole("dialog", { name: "Pierre Martin" });
    expect(within(fiche).queryByRole("link", { name: "WhatsApp" })).not.toBeInTheDocument();
    expect(within(fiche).getByRole("link", { name: "Appeler" })).toHaveAttribute("href", "tel:+442079460958");
    expect(within(fiche).getByRole("link", { name: "Écrire" }).getAttribute("href")).toContain(encodeURIComponent("Your enquiry — Spice Events"));
    expect(fiche).toHaveTextContent("Anglais");
    expect(fiche).toHaveTextContent("Non précisée");
  });

  it("avertit dans la fiche quand l'email n'est pas parti", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la demande de Hélène Durand" }));
    const fiche = screen.getByRole("dialog", { name: "Hélène Durand" });
    expect(within(fiche).getByRole("alert")).toHaveTextContent("Email non reçu — à traiter à la main.");
    expect(within(fiche).getByRole("alert")).toHaveTextContent("pas non plus reçu d'accusé de réception");
  });

  it("statut et note s'enregistrent seuls (sans confirmation), sans griser les champs ; la liste suit", async () => {
    const actions = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la demande de Juliette Martin" }));
    const fiche = screen.getByRole("dialog", { name: "Juliette Martin" });
    fireEvent.change(within(fiche).getByLabelText("Statut"), { target: { value: "devis_envoye" } });
    const note = within(fiche).getByLabelText("Note interne");
    fireEvent.change(note, { target: { value: "Devis envoyé le 18" } });
    expect(within(fiche).getByText("• Modifié")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(actions.enregistrer).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(actions.enregistrer).toHaveBeenCalledWith({ id: "Juliette", statut: "devis_envoye", note_interne: "Devis envoyé le 18" });
    expect(note).not.toBeDisabled();
    await waitFor(() => expect(within(fiche).getByText("✓ Enregistré")).toBeInTheDocument());
    // Le miroir local est effacé une fois en base.
    expect(window.localStorage.getItem("autosave:demande:Juliette")).toBeNull();
    // La pastille de la liste et les compteurs suivent.
    expect(filtre(/^Devis envoyé 1$/)).toBeInTheDocument();
    expect(filtre(/^Nouvelles 1$/)).toBeInTheDocument();
  });

  it("compteur de la note : 5 000 caractères au plus", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la demande de Juliette Martin" }));
    const fiche = screen.getByRole("dialog", { name: "Juliette Martin" });
    fireEvent.change(within(fiche).getByLabelText("Note interne"), { target: { value: "a".repeat(5001) } });
    expect(within(fiche).getByLabelText("Note interne")).toHaveClass("border-erreur");
    expect(within(fiche).getByText(/^5\s001 \/ 5\s000/)).toHaveClass("text-erreur");
  });

  it("échec d'enregistrement : toast, pastille « non enregistré », et avertissement avant de fermer", async () => {
    const enregistrer = vi.fn(async () => ({ ok: false as const, message: "Droits refusés par la base : reconnectez-vous puis réessayez." }));
    rendre(actionsSimulees({ enregistrer }));
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la demande de Juliette Martin" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText("Statut"), { target: { value: "perdue" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "⚠ Non enregistré — réessayer" })).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.getByText("Droits refusés par la base : reconnectez-vous puis réessayez.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    await waitFor(() => expect(screen.getByRole("alertdialog", { name: "Modification non enregistrée" })).toBeInTheDocument());
    // La liste n'a pas changé.
    expect(filtre(/^Perdues 0$/)).toBeInTheDocument();
  });
});
