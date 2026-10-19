import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleListe, LigneArticleAdmin } from "@/lib/journal/admin";
import type { OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { EditeurArticle, type ActionsArticle } from "./EditeurArticle";
import { GestionJournal } from "./GestionJournal";
import { FournisseurToasts } from "./Toasts";

const routeur = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", async (original) => ({ ...(await original<typeof import("next/navigation")>()), useRouter: () => routeur, usePathname: () => "/admin/journal" }));
// L'éditeur visuel (Tiptap) a ses propres tests (lib/journal/editeur.test.ts) : ici, une zone de texte qui envoie un document.
vi.mock("next/dynamic", () => ({
  default: () =>
    function EditeurSimule({ onChange }: { onChange: (doc: unknown) => void }) {
      return (
        <textarea
          aria-label="Corps de l'article"
          onChange={(e) => onChange({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: e.target.value }] }] })}
        />
      );
    },
}));

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";

function ligne(champs: Partial<LigneArticleAdmin> = {}): LigneArticleAdmin {
  return {
    id: ID,
    statut: "brouillon",
    publie_le: null,
    slug: "brouillon-a1b2c3d4e5",
    titre: "",
    sous_titre: null,
    description: null,
    categorie: null,
    date_publication: "2026-10-19",
    couverture: null,
    couverture_alt: null,
    contenu: { type: "doc", content: [] },
    updated_at: "2026-10-19T08:00:00Z",
    ...champs,
  };
}

const COMPLET: Partial<LigneArticleAdmin> = {
  slug: "se-marier-en-hiver",
  titre: "Se marier en hiver",
  description: "Nos conseils.",
  categorie: "Conseils mariage",
  couverture: "/journal/a/couverture.jpg",
  couverture_alt: "Mariés sous la neige",
};

function actionsSimulees(surcharges: Partial<ActionsArticle> = {}): ActionsArticle {
  return {
    enregistrer: vi.fn(async (_id, champs) => ({ ok: true as const, article: ligne({ slug: champs.slug, titre: champs.titre }) })),
    publier: vi.fn(async () => ({ ok: true as const, article: ligne({ ...COMPLET, statut: "publie", publie_le: "2026-10-19T09:00:00Z" }) })),
    retirer: vi.fn(async () => ({ ok: true as const, article: ligne({ ...COMPLET, statut: "brouillon", publie_le: "2026-10-19T09:00:00Z" }) })),
    supprimer: vi.fn(async (id: string) => ({ ok: true as const, id })),
    creerUrlEnvoi: vi.fn(async () => ({ ok: true as const, chemin: "journal/2026/10/1-abcdef.jpg", jeton: "j" })),
    copierPhoto: vi.fn(async () => ({ ok: true as const, chemin: "journal/2026/10/2-abcdef.jpg", alt: "Piste" })),
    ...surcharges,
  };
}

const OUTILS: OutilsEnvoiArticle = {
  preparer: vi.fn(async (f: File) => ({ fichier: f, type: "image/jpeg" as const, largeur: 1600, hauteur: 1000, reduite: false })),
  televerser: vi.fn(async () => undefined),
  lireFichierDuSite: vi.fn(async () => new File(["x"], "a.jpg", { type: "image/jpeg" })),
};

function rendreEditeur(l = ligne(), actions = actionsSimulees()) {
  render(
    <FournisseurToasts>
      <EditeurArticle ligne={l} photos={[]} actions={actions} outils={OUTILS} />
    </FournisseurToasts>,
  );
  return actions;
}

beforeEach(() => {
  window.localStorage.clear();
  routeur.push.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("EditeurArticle — enregistrement automatique", () => {
  it("le titre propose l'adresse et tout part au serveur après la frappe, sans bouton « Enregistrer »", async () => {
    vi.useFakeTimers();
    const actions = rendreEditeur();
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Se marier en hiver !" } });
    expect(screen.getByText("/journal/se-marier-en-hiver")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Corps de l'article"), { target: { value: "Bonjour" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(actions.enregistrer).toHaveBeenCalledTimes(1);
    expect(vi.mocked(actions.enregistrer).mock.calls[0][1]).toMatchObject({
      titre: "Se marier en hiver !",
      slug: "se-marier-en-hiver",
      slugAuto: true,
      contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour" }] }] },
    });
    expect(screen.queryByRole("button", { name: /^Enregistrer$/ })).toBeNull();
    expect(screen.getByText("✓ Enregistré")).toBeInTheDocument();
  });

  it("une erreur du serveur s'affiche sous le champ et la pill devient « réessayer »", async () => {
    vi.useFakeTimers();
    rendreEditeur(
      ligne(),
      actionsSimulees({ enregistrer: vi.fn(async () => ({ ok: false as const, message: "Description trop longue.", erreurs: { description: "Description trop longue." } })) }),
    );
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "x" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(screen.getByRole("button", { name: /Non enregistré/ })).toBeInTheDocument();
    expect(screen.getAllByText("Description trop longue.").length).toBeGreaterThan(0);
  });

  it("« Tous les articles » enregistre ce qui attend avant de partir ; avertit seulement si l'enregistrement échoue", async () => {
    const actions = rendreEditeur(ligne(), actionsSimulees({ enregistrer: vi.fn(async () => ({ ok: false as const, message: "Refusé." })) }));
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("link", { name: /Tous les articles/ }));
    await waitFor(() => expect(actions.enregistrer).toHaveBeenCalled());
    expect(await screen.findByRole("alertdialog", { name: "Modification non enregistrée" })).toBeInTheDocument();
    expect(routeur.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Quitter quand même" }));
    expect(routeur.push).toHaveBeenCalledWith("/admin/journal");
  });
});

describe("EditeurArticle — adresse", () => {
  it("modifiée à la main, elle ne suit plus le titre ; on peut reprendre l'adresse proposée", async () => {
    rendreEditeur(ligne({ titre: "Se marier en hiver", slug: "se-marier-en-hiver" }));
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'adresse" }));
    const champ = screen.getByLabelText("Adresse");
    fireEvent.change(champ, { target: { value: "Mon Adresse" } });
    expect(champ).toHaveValue("mon-adresse");
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Autre titre" } });
    expect(screen.getByLabelText("Adresse")).toHaveValue("mon-adresse");
    fireEvent.click(screen.getByRole("button", { name: /Reprendre l'adresse proposée/ }));
    expect(screen.getByText("/journal/autre-titre")).toBeInTheDocument();
  });

  it("verrouillée après une première publication, avec l'explication", () => {
    rendreEditeur(ligne({ ...COMPLET, statut: "brouillon", publie_le: "2026-01-01T00:00:00Z" }));
    expect(screen.queryByLabelText("Adresse")).toBeNull();
    expect(screen.getByText(/l'adresse d'un article publié ne change plus/)).toBeInTheDocument();
    expect(screen.getByText("Retiré du site")).toBeInTheDocument();
  });
});

describe("EditeurArticle — publication, retrait, suppression", () => {
  it("Publier : la fenêtre liste ce qui manque, sans rien envoyer", () => {
    const actions = rendreEditeur();
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    const fenetre = screen.getByRole("alertdialog", { name: "Pas encore prêt à publier" });
    expect(within(fenetre).getByText("le titre")).toBeInTheDocument();
    expect(within(fenetre).getByText("la photo de couverture")).toBeInTheDocument();
    fireEvent.click(within(fenetre).getByRole("button", { name: "Compris" }));
    expect(actions.publier).not.toHaveBeenCalled();
  });

  it("Publier un article complet : confirmation (adresse figée), enregistrement d'abord, puis publication", async () => {
    const actions = rendreEditeur(ligne(COMPLET));
    fireEvent.change(screen.getByLabelText("Sous-titre"), { target: { value: "Pour un jour d'hiver" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    const fenetre = screen.getByRole("alertdialog", { name: "Publier l'article ?" });
    expect(fenetre).toHaveTextContent("/journal/se-marier-en-hiver");
    expect(fenetre).toHaveTextContent("Cette adresse ne pourra plus changer ensuite.");
    fireEvent.click(within(fenetre).getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(actions.publier).toHaveBeenCalledWith(ID));
    expect(vi.mocked(actions.enregistrer).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(actions.publier).mock.invocationCallOrder[0]);
    expect(await screen.findByText("Publié")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retirer du site" })).toBeInTheDocument();
    // Déjà publié : plus de suppression, seulement l'explication.
    expect(screen.queryByRole("button", { name: "Supprimer le brouillon" })).toBeNull();
    expect(screen.getByText(/ne peut plus être supprimé/)).toBeInTheDocument();
  });

  it("Publier refusé par le serveur : le message et les champs en erreur", async () => {
    rendreEditeur(
      ligne(COMPLET),
      actionsSimulees({ publier: vi.fn(async () => ({ ok: false as const, message: "Pour publier, il manque : la catégorie.", erreurs: { categorie: "Choisissez la catégorie avant de publier." } })) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publier" }));
    expect(await screen.findByText("Choisissez la catégorie avant de publier.")).toBeInTheDocument();
    expect(screen.getByText("Pour publier, il manque : la catégorie.")).toBeInTheDocument();
  });

  it("Retirer du site : la confirmation prévient que l'adresse renverra une page introuvable", async () => {
    const actions = rendreEditeur(ligne({ ...COMPLET, statut: "publie", publie_le: "2026-01-01T00:00:00Z" }));
    expect(screen.getByRole("link", { name: /Voir sur le site/ })).toHaveAttribute("href", "/journal/se-marier-en-hiver");
    fireEvent.click(screen.getByRole("button", { name: "Retirer du site" }));
    const fenetre = screen.getByRole("alertdialog", { name: "Retirer l'article du site ?" });
    expect(fenetre).toHaveTextContent("page introuvable");
    fireEvent.click(within(fenetre).getByRole("button", { name: "Retirer du site" }));
    await waitFor(() => expect(actions.retirer).toHaveBeenCalledWith(ID));
    expect(await screen.findByRole("button", { name: "Republier" })).toBeInTheDocument();
  });

  it("Supprimer un brouillon jamais publié : confirmation, puis retour à la liste", async () => {
    const actions = rendreEditeur();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer le brouillon" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Supprimer définitivement" }));
    await waitFor(() => expect(actions.supprimer).toHaveBeenCalledWith(ID));
    expect(routeur.push).toHaveBeenCalledWith("/admin/journal");
  });
});

describe("EditeurArticle — couverture", () => {
  it("envoi direct au stockage puis enregistrement du chemin", async () => {
    vi.useFakeTimers();
    const actions = rendreEditeur();
    const fichier = new File(["x"], "couverture.jpg", { type: "image/jpeg" });
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Choisir la photo de couverture"), { target: { files: [fichier] } });
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(actions.creerUrlEnvoi).toHaveBeenCalledWith({ nomFichier: "couverture.jpg", type: "image/jpeg", taille: 1 });
    expect(OUTILS.televerser).toHaveBeenCalledWith("journal/2026/10/1-abcdef.jpg", "j", fichier, "image/jpeg");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(vi.mocked(actions.enregistrer).mock.calls.at(-1)![1]).toMatchObject({ couverture: "journal/2026/10/1-abcdef.jpg" });
  });
});

describe("GestionJournal — liste", () => {
  const liste: ArticleListe[] = [
    { id: "p1", statut: "publie", publie_le: "2026-01-01T00:00:00Z", slug: "ancien", titre: "Ancien article", categorie: "Technique", date_publication: "2025-01-01", updated_at: "2026-01-01T00:00:00Z" },
    { id: "b1", statut: "brouillon", publie_le: null, slug: "brouillon-abcdef", titre: "", categorie: null, date_publication: "2026-10-19", updated_at: "2026-10-19T00:00:00Z" },
    { id: "p2", statut: "publie", publie_le: "2026-01-01T00:00:00Z", slug: "recent", titre: "Article récent", categorie: "Conseils mariage", date_publication: "2026-09-01", updated_at: "2026-09-01T00:00:00Z" },
  ];

  function rendreListe(creer = vi.fn(async () => ({ ok: true as const, id: ID }))) {
    render(
      <FournisseurToasts>
        <GestionJournal articles={liste} creer={creer} />
      </FournisseurToasts>,
    );
    return creer;
  }
  const titres = () => screen.getAllByRole("link", { name: /^Modifier l'article/ }).map((l) => l.getAttribute("aria-label"));

  it("brouillons en tête, puis publiés du plus récent au plus ancien ; « Voir sur le site » pour un publié", () => {
    rendreListe();
    expect(titres()).toEqual(["Modifier l'article « Article sans titre »", "Modifier l'article « Article récent »", "Modifier l'article « Ancien article »"]);
    expect(screen.getAllByRole("link", { name: /Voir sur le site/ }).map((l) => l.getAttribute("href"))).toEqual(["/journal/recent", "/journal/ancien"]);
  });

  it("filtres Brouillons / Publiés / Tous et recherche", () => {
    rendreListe();
    fireEvent.click(screen.getByRole("button", { name: /^Brouillons/ }));
    expect(titres()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /^Publiés/ }));
    expect(titres()).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Rechercher (titre)"), { target: { value: "recent" } });
    expect(titres()).toEqual(["Modifier l'article « Article récent »"]);
    fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));
    expect(titres()).toHaveLength(3);
  });

  it("« Nouvel article » crée le brouillon puis ouvre l'éditeur", async () => {
    const creer = rendreListe();
    fireEvent.click(screen.getByRole("button", { name: "Nouvel article" }));
    await waitFor(() => expect(routeur.push).toHaveBeenCalledWith(`/admin/journal/${ID}`));
    expect(creer).toHaveBeenCalledTimes(1);
  });
});
