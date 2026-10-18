import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useModalAutosave, type OptionsAutosave } from "./useModalAutosave";

type Fiche = { nom: string; note: string };
const INITIALE: Fiche = { nom: "Pierre & Nina", note: "" };

/** Promesse résolue (ou rejetée) à la main : simule une requête en vol. */
function differee<T = void>() {
  let resoudre!: (v: T) => void;
  let rejeter!: (e: unknown) => void;
  const promesse = new Promise<T>((ok, ko) => {
    resoudre = ok;
    rejeter = ko;
  });
  return { promesse, resoudre, rejeter };
}

function rendre(options: Partial<OptionsAutosave<Fiche>> & Pick<OptionsAutosave<Fiche>, "mode">, strict = false) {
  return renderHook((o: OptionsAutosave<Fiche>) => useModalAutosave(o), {
    initialProps: { cle: "avis:1", valeurInitiale: INITIALE, ...options } as OptionsAutosave<Fiche>,
    reactStrictMode: strict,
  });
}

const avancer = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const miroir = (cle = "avis:1") => JSON.parse(window.localStorage.getItem(`autosave:${cle}`) ?? "null");

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useModalAutosave — édition", () => {
  it("écrit le miroir localStorage instantanément, avant tout envoi", () => {
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "a" }));
    expect(miroir().valeur).toEqual({ nom: "Pierre & Nina", note: "a" });
    expect(result.current.statut).toBe("modifie");
    expect(enregistrer).not.toHaveBeenCalled();
  });

  it("n'envoie qu'une fois, 800 ms après la dernière frappe (debounce)", async () => {
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "a" }));
    await avancer(300);
    act(() => result.current.modifier({ note: "ab" }));
    await avancer(300);
    act(() => result.current.modifier({ note: "abc" }));
    await avancer(799);
    expect(enregistrer).not.toHaveBeenCalled();
    await avancer(1);
    expect(enregistrer).toHaveBeenCalledOnce();
    expect(enregistrer).toHaveBeenCalledWith({ nom: "Pierre & Nina", note: "abc" });
    expect(result.current.statut).toBe("enregistre");
    expect(miroir()).toBeNull();
  });

  it("passe par « Enregistrement… » sans jamais bloquer la saisie", async () => {
    const requete = differee();
    const enregistrer = vi.fn(() => requete.promesse);
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "a" }));
    await avancer(800);
    expect(result.current.statut).toBe("enregistrement");
    // On peut continuer à taper pendant l'envoi.
    act(() => result.current.modifier({ note: "ab" }));
    expect(result.current.valeur.note).toBe("ab");
    await act(async () => requete.resoudre());
  });

  it("ignore une réponse périmée et envoie ensuite la saisie la plus récente", async () => {
    const premiere = differee();
    const seconde = differee();
    const enregistrer = vi.fn().mockReturnValueOnce(premiere.promesse).mockReturnValueOnce(seconde.promesse);
    const surEnregistre = vi.fn();
    const { result } = rendre({ mode: "edition", enregistrer, surEnregistre });

    act(() => result.current.modifier({ note: "v1" }));
    await avancer(800);
    act(() => result.current.modifier({ note: "v2" }));
    // La réponse à « v1 » arrive après la frappe de « v2 » : elle est périmée.
    await act(async () => premiere.resoudre());
    expect(result.current.statut).toBe("modifie");
    expect(surEnregistre).not.toHaveBeenCalled();
    expect(enregistrer).toHaveBeenCalledTimes(1);

    await avancer(800);
    expect(enregistrer).toHaveBeenLastCalledWith({ nom: "Pierre & Nina", note: "v2" });
    await act(async () => seconde.resoudre());
    expect(result.current.statut).toBe("enregistre");
    expect(surEnregistre).toHaveBeenCalledOnce();
    expect(surEnregistre).toHaveBeenCalledWith(undefined, { nom: "Pierre & Nina", note: "v2" });
  });

  it("n'envoie jamais deux sauvegardes en même temps (ordre garanti côté serveur)", async () => {
    const premiere = differee();
    const enregistrer = vi.fn().mockReturnValueOnce(premiere.promesse).mockResolvedValue(undefined);
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "v1" }));
    await avancer(800);
    act(() => result.current.modifier({ note: "v2" }));
    await avancer(800);
    // « v2 » attend que « v1 » ait répondu.
    expect(enregistrer).toHaveBeenCalledTimes(1);
    await act(async () => premiere.resoudre());
    expect(enregistrer).toHaveBeenCalledTimes(2);
    expect(result.current.statut).toBe("enregistre");
  });

  it("ignore l'échec d'une valeur déjà dépassée", async () => {
    const premiere = differee();
    const enregistrer = vi.fn().mockReturnValueOnce(premiere.promesse).mockResolvedValue(undefined);
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "v1" }));
    await avancer(800);
    act(() => result.current.modifier({ note: "v2" }));
    await act(async () => premiere.rejeter(new Error("réseau")));
    expect(result.current.statut).toBe("modifie");
    await avancer(800);
    expect(result.current.statut).toBe("enregistre");
  });

  it("à la fermeture, envoie aussitôt ce qui attend (flush) et autorise la fermeture", async () => {
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "dernière frappe" }));
    let peutFermer = false;
    await act(async () => {
      peutFermer = await result.current.fermer();
    });
    expect(enregistrer).toHaveBeenCalledWith({ nom: "Pierre & Nina", note: "dernière frappe" });
    expect(peutFermer).toBe(true);
    // Le minuteur annulé ne renvoie rien de plus.
    await avancer(2000);
    expect(enregistrer).toHaveBeenCalledOnce();
  });

  it("ferme sans rien envoyer quand rien n'a changé", async () => {
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ mode: "edition", enregistrer });
    let peutFermer = false;
    await act(async () => {
      peutFermer = await result.current.fermer();
    });
    expect(peutFermer).toBe(true);
    expect(enregistrer).not.toHaveBeenCalled();
  });

  it("après un échec : pill rouge, fermeture à confirmer, puis réessai réussi", async () => {
    const enregistrer = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockRejectedValueOnce(new Error("réseau")).mockResolvedValue(undefined);
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "important" }));
    await avancer(800);
    expect(result.current.statut).toBe("erreur");
    expect(result.current.erreur).toBeInstanceOf(Error);
    // La saisie n'est pas perdue : le miroir local la garde.
    expect(miroir().valeur.note).toBe("important");

    // Fermer retente une fois ; nouvel échec → il faut avertir.
    let peutFermer = true;
    await act(async () => {
      peutFermer = await result.current.fermer();
    });
    expect(peutFermer).toBe(false);

    await act(async () => {
      await result.current.reessayer();
    });
    expect(enregistrer).toHaveBeenCalledTimes(3);
    expect(enregistrer).toHaveBeenLastCalledWith({ nom: "Pierre & Nina", note: "important" });
    expect(result.current.statut).toBe("enregistre");
    expect(result.current.erreur).toBeNull();
    await act(async () => {
      peutFermer = await result.current.fermer();
    });
    expect(peutFermer).toBe(true);
  });

  it("une nouvelle frappe après un échec relance l'enregistrement automatiquement", async () => {
    const enregistrer = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValue(undefined);
    const { result } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "a" }));
    await avancer(800);
    expect(result.current.statut).toBe("erreur");
    act(() => result.current.modifier({ note: "ab" }));
    await avancer(800);
    expect(result.current.statut).toBe("enregistre");
  });

  it("envoie la saisie en attente si la modale est démontée sans fermer()", async () => {
    const enregistrer = vi.fn(async () => {});
    const { result, unmount } = rendre({ mode: "edition", enregistrer });
    act(() => result.current.modifier({ note: "a" }));
    unmount();
    await avancer(0);
    expect(enregistrer).toHaveBeenCalledWith({ nom: "Pierre & Nina", note: "a" });
  });

  it("reprend un miroir laissé par un rechargement, puis l'enregistre", async () => {
    window.localStorage.setItem(
      "autosave:avis:1",
      JSON.stringify({ valeur: { nom: "Pierre & Nina", note: "perdue ?" }, initiale: JSON.stringify(INITIALE), le: Date.now() }),
    );
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ mode: "edition", enregistrer });
    expect(result.current.valeur.note).toBe("perdue ?");
    expect(result.current.brouillonRestaure).toBe(true);
    await avancer(800);
    expect(enregistrer).toHaveBeenCalledWith({ nom: "Pierre & Nina", note: "perdue ?" });
  });

  it("jette un miroir pris sur une autre version de la fiche (il écraserait des données plus récentes)", async () => {
    window.localStorage.setItem(
      "autosave:avis:1",
      JSON.stringify({ valeur: { nom: "Ancien", note: "x" }, initiale: JSON.stringify({ nom: "Ancien", note: "" }), le: Date.now() }),
    );
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ mode: "edition", enregistrer });
    expect(result.current.valeur).toEqual(INITIALE);
    expect(miroir()).toBeNull();
    await avancer(2000);
    expect(enregistrer).not.toHaveBeenCalled();
  });
});

describe("useModalAutosave — création", () => {
  it("brouillon localStorage seul : rien n'est envoyé avant « Créer »", async () => {
    const { result, unmount } = rendre({ cle: "avis:nouveau", mode: "creation-locale" });
    act(() => result.current.modifier({ nom: "Léa & Hugo" }));
    expect(result.current.statut).toBe("brouillon");
    expect(miroir("avis:nouveau").valeur.nom).toBe("Léa & Hugo");
    let peutFermer = false;
    await act(async () => {
      peutFermer = await result.current.fermer();
    });
    expect(peutFermer).toBe(true);
    unmount();

    // Réouverture : le brouillon revient.
    const reouverte = rendre({ cle: "avis:nouveau", mode: "creation-locale" });
    expect(reouverte.result.current.valeur.nom).toBe("Léa & Hugo");
    expect(reouverte.result.current.statut).toBe("brouillon");
    // Après « Créer » : on l'oublie.
    act(() => reouverte.result.current.oublierBrouillon());
    expect(miroir("avis:nouveau")).toBeNull();
  });

  it("ligne brouillon en base : créée une seule fois à l'ouverture (même en StrictMode), puis auto-enregistrée", async () => {
    const creation = differee<string>();
    const creerBrouillon = vi.fn(() => creation.promesse);
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ cle: "article:nouveau", mode: "brouillon-base", creerBrouillon, enregistrer }, true);
    await avancer(0);
    expect(creerBrouillon).toHaveBeenCalledOnce();

    // Saisie avant la réponse de la création : elle attend l'identifiant.
    act(() => result.current.modifier({ nom: "Titre" }));
    await avancer(800);
    expect(enregistrer).not.toHaveBeenCalled();
    await act(async () => creation.resoudre("uuid-1"));
    expect(result.current.id).toBe("uuid-1");
    expect(enregistrer).toHaveBeenCalledWith({ nom: "Titre", note: "" }, "uuid-1");
    expect(result.current.statut).toBe("enregistre");
    expect(creerBrouillon).toHaveBeenCalledOnce();
  });

  it("ligne brouillon en base : un échec de création se réessaie", async () => {
    const creerBrouillon = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValue("uuid-2");
    const enregistrer = vi.fn(async () => {});
    const { result } = rendre({ cle: "article:nouveau", mode: "brouillon-base", creerBrouillon, enregistrer });
    await avancer(0);
    expect(result.current.statut).toBe("erreur");
    await act(async () => {
      await result.current.reessayer();
    });
    expect(creerBrouillon).toHaveBeenCalledTimes(2);
    expect(result.current.id).toBe("uuid-2");
    expect(result.current.statut).toBe("a_jour");
  });
});
