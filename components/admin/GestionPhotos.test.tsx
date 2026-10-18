import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Liaison, Photo } from "@/lib/photos/types";
import type { OutilsEnvoi } from "./AjoutPhotos";
import { GestionPhotos, type ActionsPhotos } from "./GestionPhotos";
import { FournisseurToasts } from "./Toasts";

function photo(id: string, champs: Partial<Photo> = {}): Photo {
  return {
    id,
    origine: "site",
    chemin: `/images/${id}.jpg`,
    largeur: 2400,
    hauteur: 1600,
    alt_fr: `Photo ${id}`,
    alt_en: `Picture ${id}`,
    credit: null,
    ...champs,
  };
}

const PHOTOS = [
  photo("piste"),
  photo("diner"),
  photo("vinyles"),
  photo("envoyee", { origine: "stockage", chemin: "galeries/2026/10/1-abcdef.jpg", alt_en: null }),
];
const LIAISONS: Liaison[] = [
  { galerie: "galerie_mariages", photo_id: "diner", ordre: 20 },
  { galerie: "galerie_mariages", photo_id: "piste", ordre: 10 },
  { galerie: "galerie_mariages", photo_id: "envoyee", ordre: 30 },
  { galerie: "option:bar-a-vinyles", photo_id: "vinyles", ordre: 10 },
  { galerie: "option:bar-a-vinyles", photo_id: "envoyee", ordre: 20 },
];

const NOUVELLE = photo("nouvelle", { origine: "stockage", chemin: "galeries/2026/10/2-fedcba.jpg", alt_fr: "Mariés sur la piste", alt_en: null });

function actionsSimulees(surcharges: Partial<ActionsPhotos> = {}): ActionsPhotos {
  return {
    creerUrlEnvoi: vi.fn(async () => ({ ok: true as const, chemin: NOUVELLE.chemin, jeton: "jeton" })),
    enregistrerPhoto: vi.fn(async (e: { galerie: string }) => ({ ok: true as const, photo: NOUVELLE, liaison: { galerie: e.galerie, photo_id: NOUVELLE.id, ordre: 40 } })),
    modifier: vi.fn(async (id: string) => ({ ok: true as const, photo: PHOTOS.find((p) => p.id === id)! })),
    ajouterAGalerie: vi.fn(async ({ galerie, photoIds }: { galerie: string; photoIds: string[] }) => ({
      ok: true as const,
      liaisons: photoIds.map((photo_id, i) => ({ galerie, photo_id, ordre: 100 + i * 10 })),
    })),
    retirer: vi.fn(async ({ galerie, photoId }: { galerie: string; photoId: string }) => ({ ok: true as const, galerie, photoId, restantes: 1 })),
    echanger: vi.fn(async ({ photoId, avecId }: { photoId: string; avecId: string }) => ({ ok: true as const, rangs: [{ photoId, ordre: 10 }, { photoId: avecId, ordre: 20 }] })),
    supprimer: vi.fn(async (id: string) => ({ ok: true as const, id })),
    ...surcharges,
  };
}

function outilsSimules(): OutilsEnvoi & { preparer: ReturnType<typeof vi.fn>; televerser: ReturnType<typeof vi.fn> } {
  return {
    preparer: vi.fn(async (f: File) => ({ fichier: f, type: "image/jpeg" as const, largeur: 3000, hauteur: 2000, reduite: true })),
    televerser: vi.fn(async () => undefined),
  };
}

function rendre(actions = actionsSimulees(), outils = outilsSimules()) {
  render(
    <FournisseurToasts>
      <GestionPhotos photosInitiales={PHOTOS} liaisonsInitiales={LIAISONS} actions={actions} outils={outils} />
    </FournisseurToasts>,
  );
  return { actions, outils };
}

/** Photos affichées dans la galerie, dans l'ordre (par leur texte alternatif). */
const affichees = () =>
  screen.queryAllByRole("button", { name: /^Modifier la photo \d+ : / }).map((b) => b.getAttribute("aria-label")!.replace(/^Modifier la photo \d+ : /, ""));

beforeAll(() => {
  Object.assign(URL, { createObjectURL: vi.fn(() => "blob:apercu"), revokeObjectURL: vi.fn() });
});
beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("GestionPhotos — galeries", () => {
  it("montre la galerie Mariages dans l'ordre, et change de galerie", () => {
    rendre();
    expect(affichees()).toEqual(["Photo piste", "Photo diner", "Photo envoyee"]);
    const choix = screen.getByLabelText("Galerie");
    expect(within(choix).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Galerie — Mariages",
      "Galerie — Événements",
      "Ouverture de bal spectaculaire",
      "Bar à vinyles",
      "Livre d'or audio",
      "Photobooth",
      "Guirlandes lumineuses",
      "Murs d'eau & végétaux",
      "Sonorisation de cérémonie laïque",
      "Sonorisation déportée",
    ]);
    fireEvent.change(choix, { target: { value: "option:bar-a-vinyles" } });
    expect(affichees()).toEqual(["Photo vinyles", "Photo envoyee"]);
    fireEvent.change(choix, { target: { value: "option:photobooth" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Page Photobooth : aucune photo. Il en faut au moins 2");
    expect(screen.getByText(/Aucune photo dans cette galerie/)).toBeInTheDocument();
  });

  it("monte une photo : échange de rang avec sa voisine", async () => {
    const { actions } = rendre();
    expect(screen.getByRole("button", { name: "Monter la photo 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Monter la photo 2" }));
    await waitFor(() => expect(affichees()).toEqual(["Photo diner", "Photo piste", "Photo envoyee"]));
    expect(actions.echanger).toHaveBeenCalledWith({ galerie: "galerie_mariages", photoId: "diner", avecId: "piste", sens: "monter" });
  });

  it("retire une photo après confirmation, et prévient si une page d'animation passe sous 2 photos", async () => {
    const { actions } = rendre();
    fireEvent.change(screen.getByLabelText("Galerie"), { target: { value: "option:bar-a-vinyles" } });
    fireEvent.click(screen.getByRole("button", { name: "Retirer de la galerie la photo 1 : Photo vinyles" }));
    const dialogue = screen.getByRole("alertdialog", { name: "Retirer de la galerie ?" });
    expect(dialogue).toHaveTextContent("Elle reste dans la photothèque");
    expect(dialogue).toHaveTextContent("Il ne restera que 1 photo : la galerie ne s'affichera plus");
    expect(actions.retirer).not.toHaveBeenCalled();
    fireEvent.click(within(dialogue).getByRole("button", { name: "Retirer" }));
    await waitFor(() => expect(affichees()).toEqual(["Photo envoyee"]));
    expect(actions.retirer).toHaveBeenCalledWith({ galerie: "option:bar-a-vinyles", photoId: "vinyles" });
    expect(screen.getAllByRole("alert").some((a) => /Il en faut au moins 2/.test(a.textContent ?? ""))).toBe(true);
  });

  it("enregistre automatiquement le texte alternatif modifié dans la fiche", async () => {
    const { actions } = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Modifier la photo 1 : Photo piste" }));
    const fiche = screen.getByRole("dialog");
    fireEvent.change(within(fiche).getByLabelText("Texte alternatif — français (obligatoire)"), { target: { value: "Mariés sur la piste" } });
    await waitFor(() => expect(actions.modifier).toHaveBeenCalledWith("piste", { alt_fr: "Mariés sur la piste", alt_en: "Picture piste", credit: "" }), { timeout: 2000 });
    // Fichier du site : pas de suppression, une explication.
    expect(within(fiche).queryByRole("button", { name: "Supprimer définitivement" })).toBeNull();
    expect(fiche).toHaveTextContent("elle ne peut pas être supprimée ici");
    expect(within(fiche).getByRole("button", { name: "Retirer de la galerie" })).toBeInTheDocument();
  });
});

describe("GestionPhotos — photothèque", () => {
  it("liste toutes les photos avec le nombre de galeries de chacune", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: /^Photothèque/ }));
    const carte = (nom: string) => screen.getByRole("button", { name: `Ouvrir la fiche : ${nom}` }).closest("li")!;
    expect(carte("Photo envoyee")).toHaveTextContent("Dans 2 galeries");
    expect(carte("Photo envoyee")).toHaveTextContent("Envoyée");
    expect(carte("Photo piste")).toHaveTextContent("Dans 1 galerie");
    expect(carte("Photo piste")).toHaveTextContent("Fichier du site");
  });

  it("supprime définitivement une photo envoyée, après une confirmation qui dit où elle sera retirée", async () => {
    const { actions } = rendre();
    fireEvent.click(screen.getByRole("button", { name: /^Photothèque/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la fiche : Photo envoyee" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Supprimer définitivement" }));
    const dialogue = screen.getByRole("alertdialog", { name: "Supprimer définitivement ?" });
    expect(dialogue).toHaveTextContent("Elle sera retirée de : Galerie — Mariages, Page Bar à vinyles.");
    fireEvent.click(within(dialogue).getByRole("button", { name: "Supprimer définitivement" }));
    await waitFor(() => expect(actions.supprimer).toHaveBeenCalledWith("envoyee"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Ouvrir la fiche : Photo envoyee" })).toBeNull());
    // La page Bar à vinyles passe à une photo : avertissement.
    expect(screen.getAllByRole("alert").some((a) => /Page Bar à vinyles : 1 photo/.test(a.textContent ?? ""))).toBe(true);
  });
});

describe("GestionPhotos — ajout", () => {
  function choisirFichier(nom: string, type = "image/jpeg") {
    const champ = screen.getByLabelText("Choisir des photos à envoyer");
    fireEvent.change(champ, { target: { files: [new File(["x"], nom, { type })] } });
  }

  it("envoie une photo directement au stockage, puis l'enregistre dans la galerie avec ses dimensions", async () => {
    const { actions, outils } = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos" }));
    choisirFichier("maries-sur-la-piste.jpg");
    const dialogue = screen.getByRole("dialog", { name: "Ajouter à Galerie — Mariages" });
    expect(dialogue).toHaveTextContent("Google et les personnes malvoyantes");
    const alt = within(dialogue).getByLabelText("Texte alternatif — français (obligatoire)");
    expect(alt).toHaveValue("Maries sur la piste");
    fireEvent.change(alt, { target: { value: "Mariés sur la piste" } });
    fireEvent.click(within(dialogue).getByRole("button", { name: "Envoyer 1 photo" }));

    await waitFor(() => expect(actions.enregistrerPhoto).toHaveBeenCalled());
    expect(actions.creerUrlEnvoi).toHaveBeenCalledWith({ nomFichier: "maries-sur-la-piste.jpg", type: "image/jpeg", taille: 1 });
    expect(outils.televerser).toHaveBeenCalledWith(NOUVELLE.chemin, "jeton", expect.any(File), "image/jpeg");
    expect(actions.enregistrerPhoto).toHaveBeenCalledWith({
      chemin: NOUVELLE.chemin,
      largeur: 3000,
      hauteur: 2000,
      galerie: "galerie_mariages",
      alt_fr: "Mariés sur la piste",
      alt_en: "",
      credit: "",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(affichees()).toEqual(["Photo piste", "Photo diner", "Photo envoyee", "Mariés sur la piste"]);
  });

  it("exige un texte alternatif avant tout envoi", async () => {
    const { actions } = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos" }));
    choisirFichier("IMG_1234.jpg");
    const dialogue = screen.getByRole("dialog");
    expect(within(dialogue).getByLabelText("Texte alternatif — français (obligatoire)")).toHaveValue("");
    fireEvent.click(within(dialogue).getByRole("button", { name: "Envoyer 1 photo" }));
    await waitFor(() => expect(dialogue).toHaveTextContent("Décrivez la photo (texte alternatif français) avant de l'envoyer."));
    expect(actions.creerUrlEnvoi).not.toHaveBeenCalled();
  });

  it("ignore un format non accepté", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos" }));
    choisirFichier("logo.svg", "image/svg+xml");
    expect(screen.getByRole("alert")).toHaveTextContent("logo.svg (format non accepté)");
    expect(screen.queryByLabelText("Texte alternatif — français (obligatoire)")).toBeNull();
  });

  it("après un échec d'enregistrement, un nouvel essai ne renvoie pas le fichier déjà arrivé", async () => {
    const enregistrerPhoto = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, message: "la base ne répond pas" })
      .mockResolvedValueOnce({ ok: true, photo: NOUVELLE, liaison: { galerie: "galerie_mariages", photo_id: NOUVELLE.id, ordre: 40 } });
    const { actions, outils } = rendre(actionsSimulees({ enregistrerPhoto }));
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos" }));
    choisirFichier("piste.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Envoyer 1 photo" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("la base ne répond pas"));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer 1 photo" }));
    await waitFor(() => expect(enregistrerPhoto).toHaveBeenCalledTimes(2));
    expect(actions.creerUrlEnvoi).toHaveBeenCalledTimes(1);
    expect(outils.televerser).toHaveBeenCalledTimes(1);
  });

  it("ajoute des photos de la photothèque absentes de la galerie", async () => {
    const { actions } = rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos" }));
    fireEvent.click(screen.getByRole("button", { name: /^Choisir dans la photothèque/ }));
    const dialogue = screen.getByRole("dialog");
    // Seule « vinyles » n'est pas dans la galerie Mariages.
    expect(within(dialogue).getAllByRole("checkbox")).toHaveLength(1);
    fireEvent.click(within(dialogue).getByRole("checkbox"));
    fireEvent.click(within(dialogue).getByRole("button", { name: "Ajouter 1 photo" }));
    await waitFor(() => expect(actions.ajouterAGalerie).toHaveBeenCalledWith({ galerie: "galerie_mariages", photoIds: ["vinyles"] }));
    await waitFor(() => expect(affichees()).toEqual(["Photo piste", "Photo diner", "Photo envoyee", "Photo vinyles"]));
  });

  it("demande avant d'abandonner des photos choisies mais pas envoyées", () => {
    rendre();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos" }));
    choisirFichier("piste.jpg");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fermer" }));
    expect(screen.getByRole("alertdialog", { name: "Fermer sans envoyer ?" })).toBeInTheDocument();
  });
});
