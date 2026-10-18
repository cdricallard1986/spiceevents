import { describe, expect, it } from "vitest";
import { OPTIONS } from "@/contenu/options";
import {
  FILTRES_PAR_DEFAUT,
  emplacementsUniques,
  filtrerAvis,
  filtresActifs,
  normaliserRecherche,
  ordreSuivant,
  rangsEchanges,
  retraitsNecessaires,
  titulaire,
} from "./admin";
import { EMPLACEMENTS, estEmplacementConnu, estEmplacementUnique, libelleEmplacement, longueur } from "./constantes";
import type { Avis } from "./types";

function avis(id: string, champs: Partial<Avis> = {}): Avis {
  return {
    id,
    auteurs: id,
    role_fr: null,
    role_en: null,
    categorie: "mariage",
    texte_fr: "Texte.",
    texte_en: null,
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

describe("emplacements", () => {
  it("libellés clairs : accueil, page Mariages, puis une page par option", () => {
    expect(EMPLACEMENTS.slice(0, 4).map((e) => e.libelle)).toEqual([
      "Accueil — grand avis",
      "Accueil — grille",
      "Page Mariages — grand avis",
      "Page Mariages — grille",
    ]);
    expect(EMPLACEMENTS.slice(4).map((e) => e.valeur)).toEqual(OPTIONS.map((o) => `option:${o.slug.fr}`));
    expect(libelleEmplacement("option:photobooth")).toBe("Page Photobooth");
    expect(libelleEmplacement("option:disparue")).toBe("option:disparue (emplacement inconnu)");
  });

  it("grands avis et pages d'option : un seul avis à la fois ; grilles : autant qu'on veut", () => {
    expect(estEmplacementUnique("accueil_grand")).toBe(true);
    expect(estEmplacementUnique("mariages_grand")).toBe(true);
    expect(estEmplacementUnique("option:bar-a-vinyles")).toBe(true);
    expect(estEmplacementUnique("accueil")).toBe(false);
    expect(estEmplacementUnique("mariages")).toBe(false);
    expect(emplacementsUniques(["accueil", "accueil_grand", "option:photobooth"])).toEqual(["accueil_grand", "option:photobooth"]);
  });

  it("chaque emplacement proposé respecte le format de la base", () => {
    for (const e of EMPLACEMENTS) expect(e.valeur).toMatch(/^(accueil_grand|accueil|mariages_grand|mariages|option:[a-z0-9-]+)$/);
    expect(estEmplacementConnu("option:inconnue")).toBe(false);
  });

  it("compte les caractères comme Postgres", () => {
    expect(longueur("Clémentine 🎉")).toBe(12);
  });
});

describe("filtres de la liste", () => {
  const liste = [
    avis("Clémentine & Kévin", { ordre: 30 }),
    avis("Juliette", { ordre: 10, categorie: "evenement", source: "google" }),
    avis("Pierre & Nina", { ordre: 20, publie: false, source: "mariages_net" }),
  ];

  it("par défaut : tout, dans l'ordre du site", () => {
    expect(filtrerAvis(liste, FILTRES_PAR_DEFAUT).map((a) => a.auteurs)).toEqual(["Juliette", "Pierre & Nina", "Clémentine & Kévin"]);
    expect(filtresActifs(FILTRES_PAR_DEFAUT)).toBe(false);
  });

  it("catégorie, statut, source", () => {
    expect(filtrerAvis(liste, { ...FILTRES_PAR_DEFAUT, categorie: "evenement" }).map((a) => a.auteurs)).toEqual(["Juliette"]);
    expect(filtrerAvis(liste, { ...FILTRES_PAR_DEFAUT, statut: "non_publies" }).map((a) => a.auteurs)).toEqual(["Pierre & Nina"]);
    expect(filtrerAvis(liste, { ...FILTRES_PAR_DEFAUT, statut: "publies" })).toHaveLength(2);
    expect(filtrerAvis(liste, { ...FILTRES_PAR_DEFAUT, source: "mariages_net" }).map((a) => a.auteurs)).toEqual(["Pierre & Nina"]);
  });

  it("recherche par auteurs, sans tenir compte des accents ni des majuscules", () => {
    const f = { ...FILTRES_PAR_DEFAUT, recherche: "  KEVIN " };
    expect(filtrerAvis(liste, f).map((a) => a.auteurs)).toEqual(["Clémentine & Kévin"]);
    expect(filtresActifs(f)).toBe(true);
    expect(normaliserRecherche("Éloïse")).toBe("eloise");
  });
});

describe("ordre", () => {
  it("un nouvel avis va à la fin", () => {
    expect(ordreSuivant([])).toBe(10);
    expect(ordreSuivant([10, 430, 20])).toBe(440);
  });

  it("échange les rangs de deux avis ; à rang égal, celui qui monte passe devant", () => {
    expect(rangsEchanges({ ordre: 20 }, { ordre: 10 }, true)).toEqual({ a: 10, b: 20 });
    expect(rangsEchanges({ ordre: 10 }, { ordre: 20 }, false)).toEqual({ a: 20, b: 10 });
    expect(rangsEchanges({ ordre: 0 }, { ordre: 0 }, true)).toEqual({ a: -1, b: 0 });
    expect(rangsEchanges({ ordre: 0 }, { ordre: 0 }, false)).toEqual({ a: 1, b: 0 });
  });
});

describe("emplacements uniques", () => {
  const autres = [
    avis("Pierre & Nina", { emplacements: ["accueil_grand", "accueil"] }),
    avis("Harold & David", { emplacements: ["mariages_grand"] }),
    avis("Beth & Liam", { emplacements: ["option:photobooth", "accueil"] }),
  ];

  it("cocher un grand avis le retire à l'avis qui l'avait, sans toucher à ses autres emplacements", () => {
    expect(retraitsNecessaires("nouveau", ["accueil_grand", "accueil"], autres)).toEqual([
      { id: "Pierre & Nina", auteurs: "Pierre & Nina", emplacement: "accueil_grand", emplacements: ["accueil"] },
    ]);
  });

  it("plusieurs emplacements uniques d'un coup ; une grille n'est jamais retirée", () => {
    const r = retraitsNecessaires("nouveau", ["mariages_grand", "option:photobooth", "accueil"], autres);
    expect(r.map((x) => `${x.auteurs}:${x.emplacement}`)).toEqual(["Harold & David:mariages_grand", "Beth & Liam:option:photobooth"]);
    expect(r[1].emplacements).toEqual(["accueil"]);
  });

  it("rien à retirer à l'avis lui-même ni sans emplacement unique", () => {
    expect(retraitsNecessaires("Pierre & Nina", ["accueil_grand"], autres)).toEqual([]);
    expect(retraitsNecessaires("nouveau", ["accueil", "mariages"], autres)).toEqual([]);
  });

  it("indique l'avis qui occupe un emplacement (hors l'avis ouvert)", () => {
    expect(titulaire(autres, "accueil_grand")?.auteurs).toBe("Pierre & Nina");
    expect(titulaire(autres, "accueil_grand", "Pierre & Nina")).toBeUndefined();
  });
});
