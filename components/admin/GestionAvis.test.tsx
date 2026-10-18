import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Avis } from "@/lib/avis/types";
import { GestionAvis, type ActionsAvis } from "./GestionAvis";
import { FournisseurToasts } from "./Toasts";

function avis(id: string, champs: Partial<Avis> = {}): Avis {
  return {
    id,
    auteurs: id,
    role_fr: null,
    role_en: null,
    categorie: "mariage",
    texte_fr: `Texte de ${id}.`,
    texte_en: `Text by ${id}.`,
    citation_fr: null,
    citation_en: null,
    source: "site",
    date_avis: null,
    lien_source: null,
    publie: true,
    ordre: 10,
    emplacements: [],
    ...champs,
  };
}

const LISTE = [
  avis("Pierre & Nina", { ordre: 10, emplacements: ["accueil_grand"] }),
  avis("Juliette", { ordre: 20, categorie: "evenement", role_fr: "Responsable communication", source: "google" }),
  avis("Clémentine & Kévin", { ordre: 30, publie: false, emplacements: ["accueil", "option:ouverture-de-bal"] }),
];

function actionsSimulees(surcharges: Partial<ActionsAvis> = {}): ActionsAvis {
  return {
    enregistrer: vi.fn(async (id: string) => ({ ok: true as const, avis: LISTE.find((a) => a.id === id)!, retraits: [] })),
    creer: vi.fn(async () => ({ ok: true as const, avis: avis("Nouveaux mariés", { ordre: 40, publie: false }), retraits: [] })),
    changerPublication: vi.fn(async ({ id, publie }: { id: string; publie: boolean }) => ({ ok: true as const, avis: { ...LISTE.find((a) => a.id === id)!, publie } })),
    supprimer: vi.fn(async (id: string) => ({ ok: true as const, id })),
    echanger: vi.fn(async ({ id, avecId }: { id: string; avecId: string }) => ({ ok: true as const, rangs: [{ id, ordre: 10 }, { id: avecId, ordre: 20 }] })),
    ...surcharges,
  };
}

function rendre(actions = actionsSimulees(), liste = LISTE) {
  render(
    <FournisseurToasts>
      <GestionAvis avisInitiaux={liste} actions={actions} />
    </FournisseurToasts>,
  );
  return actions;
}

/** Noms des avis affichés, dans l'ordre. */
const affiches = () => screen.queryAllByRole("button", { name: /^Modifier l'avis de / }).map((b) => b.getAttribute("aria-label")!.replace("Modifier l'avis de ", ""));

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("GestionAvis — liste", () => {
  it("affiche tous les avis dans l'ordre du site, avec statut, catégorie, source et emplacements lisibles", () => {
    rendre();
    expect(affiches()).toEqual(["Pierre & Nina", "Juliette", "Clémentine & Kévin"]);
    expect(screen.getByRole("status")).toHaveTextContent("3 avis · 2 publiés");
    expect(screen.getByText("Accueil — grand avis")).toBeInTheDocument();
    expect(screen.getByText("Page Ouverture de bal spectaculaire")).toBeInTheDocument();
    expect(screen.getByText("Non publié")).toBeInTheDocument();
    expect(screen.getByText(/Événementiel · Google/)).toBeInTheDocument();
  });

  it("filtre par catégorie, statut, source et auteurs (sans accents), et efface les filtres", () => {
    rendre();
    fireEvent.change(screen.getByLabelText("Catégorie"), { target: { value: "evenement" } });
    expect(affiches()).toEqual(["Juliette"]);
    fireEvent.change(screen.getByLabelText("Catégorie"), { target: { value: "toutes" } });
    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "non_publies" } });
    expect(affiches()).toEqual(["Clémentine & Kévin"]);
    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "tous" } });
    fireEvent.change(screen.getByLabelText("Source"), { target: { value: "google" } });
    expect(affiches()).toEqual(["Juliette"]);
    fireEvent.change(screen.getByLabelText("Source"), { target: { value: "toutes" } });
    fireEvent.change(screen.getByLabelText("Rechercher (auteurs)"), { target: { value: "clementine" } });
    expect(affiches()).toEqual(["Clémentine & Kévin"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 avis affiché sur 3");
    fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));
    expect(affiches()).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Rechercher (auteurs)"), { target: { value: "zzz" } });
    expect(screen.getByText("Aucun avis ne correspond à ces filtres.")).toBeInTheDocument();
  });

  it("monte un avis : échange avec son voisin, puis la liste suit les nouveaux rangs", async () => {
    const actions = rendre();
    expect(screen.getByRole("button", { name: "Monter l'avis de Pierre & Nina" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descendre l'avis de Clémentine & Kévin" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Monter l'avis de Juliette" }));
    await waitFor(() => expect(affiches()).toEqual(["Juliette", "Pierre & Nina", "Clémentine & Kévin"]));
    expect(actions.echanger).toHaveBeenCalledWith({ id: "Juliette", avecId: "Pierre & Nina", sens: "monter" });
  });

  it("un échange refusé laisse l'ordre et affiche l'erreur", async () => {
    rendre(actionsSimulees({ echanger: vi.fn(async () => ({ ok: false as const, message: "Droits refusés par la base." })) }));
    fireEvent.click(screen.getByRole("button", { name: "Descendre l'avis de Pierre & Nina" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Droits refusés par la base."));
    expect(affiches()).toEqual(["Pierre & Nina", "Juliette", "Clémentine & Kévin"]);
  });
});

describe("GestionAvis — modale d'édition", () => {
  it("s'enregistre seule après la frappe, sans griser les champs", async () => {
    const actions = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avis de Juliette" }));
    const dialogue = screen.getByRole("dialog", { name: "Juliette" });
    expect(within(dialogue).getByText(/le site public se met à jour à la visite suivante/)).toBeInTheDocument();
    const role = within(dialogue).getByLabelText("Rôle — anglais");
    fireEvent.change(role, { target: { value: "Head of communications" } });
    expect(within(dialogue).getByText("• Modifié")).toBeInTheDocument();
    await waitFor(() => expect(actions.enregistrer).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(actions.enregistrer).toHaveBeenCalledWith("Juliette", expect.objectContaining({ role_en: "Head of communications", role_fr: "Responsable communication" }));
    expect(role).not.toBeDisabled();
    await waitFor(() => expect(within(dialogue).getByText("✓ Enregistré")).toBeInTheDocument());
  });

  it("compte les caractères selon les limites de la base", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avis de Juliette" }));
    const dialogue = screen.getByRole("dialog", { name: "Juliette" });
    expect(within(dialogue).getByText("8 / 120")).toBeInTheDocument();
    fireEvent.change(within(dialogue).getByLabelText("Citation — français"), { target: { value: "a".repeat(601) } });
    expect(within(dialogue).getByText("601 / 600")).toHaveClass("text-erreur");
    expect(within(dialogue).getByLabelText("Citation — français")).toHaveClass("border-erreur");
  });

  it("erreur de validation : bordure rouge sur le champ, message, toast et pastille « non enregistré »", async () => {
    const enregistrer = vi.fn(async () => ({ ok: false as const, message: "Indiquez les auteurs de l'avis.", erreurs: { auteurs: "Indiquez les auteurs de l'avis." } }));
    rendre(actionsSimulees({ enregistrer }));
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avis de Juliette" }));
    const auteurs = screen.getByLabelText("Auteurs");
    fireEvent.change(auteurs, { target: { value: "" } });
    await waitFor(() => expect(auteurs).toHaveClass("border-erreur"), { timeout: 2000 });
    expect(auteurs).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Indiquez les auteurs de l'avis.");
    expect(screen.getByRole("button", { name: "⚠ Non enregistré — réessayer" })).toBeInTheDocument();
  });

  it("cocher un grand avis : la case dit qui l'occupe, et le toast dit à qui il a été retiré", async () => {
    const actions = actionsSimulees({
      enregistrer: vi.fn(async () => ({
        ok: true as const,
        avis: { ...LISTE[1], emplacements: ["accueil_grand"] },
        retraits: [{ id: "Pierre & Nina", auteurs: "Pierre & Nina", emplacement: "accueil_grand", emplacements: [] }],
      })),
    });
    rendre(actions);
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avis de Juliette" }));
    const dialogue = screen.getByRole("dialog", { name: "Juliette" });
    expect(within(dialogue).getByText("Un seul avis — actuellement : Pierre & Nina")).toBeInTheDocument();
    fireEvent.click(within(dialogue).getByLabelText(/Accueil — grand avis/));
    await waitFor(() => expect(screen.getByText(/« Accueil — grand avis » a été retiré de l'avis de Pierre & Nina/)).toBeInTheDocument(), { timeout: 2000 });
    expect(actions.enregistrer).toHaveBeenCalledWith("Juliette", expect.objectContaining({ emplacements: ["accueil_grand"] }));
  });

  it("publier passe par une confirmation", async () => {
    const actions = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avis de Clémentine & Kévin" }));
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    const confirmation = screen.getByRole("alertdialog", { name: "Publier l'avis ?" });
    expect(actions.changerPublication).not.toHaveBeenCalled();
    fireEvent.click(within(confirmation).getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(actions.changerPublication).toHaveBeenCalledWith({ id: "Clémentine & Kévin", publie: true }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Retirer du site" })).toBeInTheDocument());
  });

  it("supprimer : confirmation qui dit que c'est définitif, puis l'avis disparaît", async () => {
    const actions = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avis de Juliette" }));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    const confirmation = screen.getByRole("alertdialog", { name: "Supprimer définitivement ?" });
    expect(confirmation).toHaveTextContent("C'est définitif");
    // Annuler ne supprime rien.
    fireEvent.click(within(confirmation).getByRole("button", { name: "Annuler" }));
    expect(actions.supprimer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Supprimer définitivement" }));
    await waitFor(() => expect(affiches()).toEqual(["Pierre & Nina", "Clémentine & Kévin"]));
    expect(actions.supprimer).toHaveBeenCalledWith("Juliette");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("GestionAvis — création", () => {
  it("brouillon local, puis « Créer » : l'avis arrive non publié et sa fiche s'ouvre", async () => {
    const actions = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Nouvel avis" }));
    const dialogue = screen.getByRole("dialog", { name: "Nouvel avis" });
    expect(dialogue).toHaveTextContent("non publié");
    fireEvent.change(within(dialogue).getByLabelText("Auteurs"), { target: { value: "Nouveaux mariés" } });
    fireEvent.change(within(dialogue).getByLabelText("Texte — français"), { target: { value: "Merci !" } });
    expect(within(dialogue).getByText("• Brouillon gardé sur cet appareil")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("autosave:avis:nouveau")!).valeur).toMatchObject({ auteurs: "Nouveaux mariés", texte_fr: "Merci !" });
    // Rien n'est envoyé au serveur avant « Créer ».
    await act(() => new Promise((r) => setTimeout(r, 900)));
    expect(actions.creer).not.toHaveBeenCalled();

    fireEvent.click(within(dialogue).getByRole("button", { name: "Créer l'avis" }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Nouveaux mariés" })).toBeInTheDocument());
    expect(actions.creer).toHaveBeenCalledWith(expect.objectContaining({ auteurs: "Nouveaux mariés", texte_fr: "Merci !" }));
    expect(window.localStorage.getItem("autosave:avis:nouveau")).toBeNull();
    expect(affiches()).toContain("Nouveaux mariés");
    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
  });

  it("création refusée : erreurs sur les champs, le brouillon reste", async () => {
    const creer = vi.fn(async () => ({ ok: false as const, message: "Le texte français de l'avis est obligatoire.", erreurs: { texte_fr: "Le texte français de l'avis est obligatoire." } }));
    rendre(actionsSimulees({ creer }));
    fireEvent.click(screen.getByRole("button", { name: "Nouvel avis" }));
    fireEvent.change(screen.getByLabelText("Auteurs"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer l'avis" }));
    await waitFor(() => expect(screen.getByLabelText("Texte — français")).toHaveClass("border-erreur"));
    expect(screen.getByRole("alert")).toHaveTextContent("Le texte français de l'avis est obligatoire.");
    expect(window.localStorage.getItem("autosave:avis:nouveau")).not.toBeNull();
  });
});
