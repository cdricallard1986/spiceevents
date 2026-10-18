import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server Actions des avis, avec une garde et un client Supabase simulés :
 * garde d'abord, Zod ensuite, écriture par le client de session, puis
 * revalidation de l'étiquette « avis ».
 */

type Appel = { table: string; operations: [string, unknown[]][] };
type Reponse = { data: unknown; error: { code?: string; message: string } | null };

const etat = vi.hoisted(() => ({
  appels: [] as Appel[],
  repondre: (() => ({ data: null, error: null })) as (appel: Appel) => Reponse,
  admin: true,
}));

/** Client simulé : enregistre chaque chaîne d'appels (`from("avis").update(…).eq(…)…`) et répond via `etat.repondre`. */
function fauxClient() {
  return {
    from(table: string) {
      const appel: Appel = { table, operations: [] };
      etat.appels.push(appel);
      const chaine: Record<string, unknown> = new Proxy(
        {},
        {
          get(_c, nom: string) {
            if (nom === "then") {
              return (ok: (r: Reponse) => unknown, ko: (e: unknown) => unknown) => Promise.resolve(etat.repondre(appel)).then(ok, ko);
            }
            return (...args: unknown[]) => {
              appel.operations.push([nom, args]);
              return chaine;
            };
          },
        },
      );
      return chaine;
    },
  };
}

vi.mock("@/lib/admin/garde", () => ({
  exigerAdmin: vi.fn(async () => {
    if (!etat.admin) throw new Error("NEXT_REDIRECT");
    return { supabase: fauxClient(), utilisateur: { id: "u1" } };
  }),
}));
const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }));

const { changerPublication, creerAvis, echangerOrdre, enregistrerAvis, supprimerAvis } = await import("./actions");
const { exigerAdmin } = await import("@/lib/admin/garde");

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";
const AUTRE = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const FICHE = {
  auteurs: "Pierre & Nina",
  role_fr: "",
  role_en: "",
  categorie: "mariage",
  texte_fr: "Merci !",
  texte_en: "",
  citation_fr: "",
  citation_en: "",
  source: "site",
  date_avis: "",
  lien_source: "",
  emplacements: ["accueil"],
};
const LIGNE = { id: ID, ...FICHE, role_fr: null, role_en: null, texte_en: null, citation_fr: null, citation_en: null, date_avis: null, lien_source: null, publie: false, ordre: 10 };

const operations = (appel: Appel) => appel.operations.map(([nom]) => nom);

beforeEach(() => {
  etat.appels = [];
  etat.admin = true;
  etat.repondre = () => ({ data: LIGNE, error: null });
  revalidateTag.mockClear();
  vi.mocked(exigerAdmin).mockClear();
});

describe("garde et validation", () => {
  it("chaque action refuse un appel sans session admin, avant toute requête", async () => {
    etat.admin = false;
    const appels = [
      () => enregistrerAvis(ID, FICHE),
      () => creerAvis(FICHE),
      () => changerPublication({ id: ID, publie: true }),
      () => supprimerAvis(ID),
      () => echangerOrdre({ id: ID, avecId: AUTRE, sens: "monter" }),
    ];
    for (const appel of appels) await expect(appel()).rejects.toThrow("NEXT_REDIRECT");
    expect(exigerAdmin).toHaveBeenCalledTimes(appels.length);
    expect(etat.appels).toEqual([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("une entrée invalide n'écrit rien et renvoie les erreurs par champ", async () => {
    const r = await enregistrerAvis(ID, { ...FICHE, auteurs: "", lien_source: "javascript:alert(1)" });
    expect(r).toMatchObject({ ok: false, message: "Indiquez les auteurs de l'avis.", erreurs: { auteurs: expect.any(String), lien_source: expect.any(String) } });
    expect(await enregistrerAvis("pas-un-uuid", FICHE)).toMatchObject({ ok: false });
    expect(await changerPublication({ id: ID, publie: "oui" })).toMatchObject({ ok: false });
    expect(await supprimerAvis({ id: ID })).toMatchObject({ ok: false });
    expect(await echangerOrdre({ id: ID, avecId: ID, sens: "monter" })).toMatchObject({ ok: false });
    expect(etat.appels).toEqual([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("enregistrerAvis", () => {
  it("met à jour l'avis avec les valeurs validées, puis régénère les pages", async () => {
    const r = await enregistrerAvis(ID, { ...FICHE, auteurs: "  Pierre & Nina  " });
    expect(r).toEqual({ ok: true, avis: LIGNE, retraits: [] });
    const [maj] = etat.appels;
    expect(operations(maj)).toEqual(["update", "eq", "select", "maybeSingle"]);
    expect(maj.operations[0][1][0]).toMatchObject({ auteurs: "Pierre & Nina", role_fr: null, emplacements: ["accueil"] });
    expect(maj.operations[0][1][0]).not.toHaveProperty("publie");
    expect(maj.operations[1][1]).toEqual(["id", ID]);
    expect(revalidateTag).toHaveBeenCalledWith("avis");
  });

  it("un grand avis coché est retiré, dans la même action, à l'avis qui l'avait", async () => {
    etat.repondre = (appel) => {
      if (operations(appel).includes("overlaps")) return { data: [{ id: AUTRE, auteurs: "Harold & David", emplacements: ["accueil_grand", "mariages"] }], error: null };
      return { data: LIGNE, error: null };
    };
    const r = await enregistrerAvis(ID, { ...FICHE, emplacements: ["accueil_grand"] });
    expect(r).toMatchObject({ ok: true, retraits: [{ id: AUTRE, auteurs: "Harold & David", emplacement: "accueil_grand", emplacements: ["mariages"] }] });
    const [maj, recherche, retrait] = etat.appels;
    expect(operations(maj)[0]).toBe("update");
    expect(recherche.operations).toEqual([
      ["select", ["id, auteurs, emplacements"]],
      ["overlaps", ["emplacements", ["accueil_grand"]]],
      ["neq", ["id", ID]],
    ]);
    expect(retrait.operations).toEqual([
      ["update", [{ emplacements: ["mariages"] }]],
      ["eq", ["id", AUTRE]],
    ]);
  });

  it("avis introuvable (supprimé entre-temps) ou refus de la base : message clair, pas de revalidation", async () => {
    etat.repondre = () => ({ data: null, error: null });
    expect(await enregistrerAvis(ID, FICHE)).toMatchObject({ ok: false, message: expect.stringContaining("introuvable") });
    etat.repondre = () => ({ data: null, error: { code: "42501", message: "permission denied" } });
    expect(await enregistrerAvis(ID, FICHE)).toMatchObject({ ok: false, message: expect.stringContaining("Droits refusés") });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("si le retrait à l'autre avis échoue, l'avis reste enregistré et un avertissement le dit", async () => {
    etat.repondre = (appel) => (operations(appel).includes("overlaps") ? { data: null, error: { message: "réseau" } } : { data: LIGNE, error: null });
    const r = await enregistrerAvis(ID, { ...FICHE, emplacements: ["option:photobooth"] });
    expect(r).toMatchObject({ ok: true, retraits: [], avertissement: expect.stringContaining("décochez-le à la main") });
  });
});

describe("creerAvis", () => {
  it("crée l'avis NON publié, à la fin de la liste", async () => {
    etat.repondre = (appel) => (operations(appel).includes("limit") ? { data: [{ ordre: 430 }], error: null } : { data: LIGNE, error: null });
    const r = await creerAvis({ ...FICHE, publie: true, ordre: 1 });
    expect(r).toMatchObject({ ok: true, avis: LIGNE });
    const insertion = etat.appels[1];
    expect(operations(insertion)).toEqual(["insert", "select", "single"]);
    expect(insertion.operations[0][1][0]).toMatchObject({ auteurs: "Pierre & Nina", publie: false, ordre: 440 });
    expect(revalidateTag).toHaveBeenCalledWith("avis");
  });
});

describe("publication, suppression, ordre", () => {
  it("publie ou retire du site", async () => {
    expect(await changerPublication({ id: ID, publie: true })).toMatchObject({ ok: true });
    expect(etat.appels[0].operations[0]).toEqual(["update", [{ publie: true }]]);
    expect(revalidateTag).toHaveBeenCalledWith("avis");
  });

  it("supprime définitivement ; rien de supprimé = introuvable", async () => {
    etat.repondre = () => ({ data: [{ id: ID }], error: null });
    expect(await supprimerAvis(ID)).toEqual({ ok: true, id: ID });
    expect(operations(etat.appels[0])).toEqual(["delete", "eq", "select"]);
    etat.repondre = () => ({ data: [], error: null });
    expect(await supprimerAvis(ID)).toMatchObject({ ok: false });
  });

  it("échange le rang de deux avis", async () => {
    etat.repondre = (appel) =>
      operations(appel)[0] === "select"
        ? { data: [{ id: ID, ordre: 30 }, { id: AUTRE, ordre: 20 }], error: null }
        : { data: null, error: null };
    const r = await echangerOrdre({ id: ID, avecId: AUTRE, sens: "monter" });
    expect(r).toEqual({ ok: true, rangs: [{ id: ID, ordre: 20 }, { id: AUTRE, ordre: 30 }] });
    expect(etat.appels.slice(1).map((a) => a.operations)).toEqual([
      [["update", [{ ordre: 20 }]], ["eq", ["id", ID]]],
      [["update", [{ ordre: 30 }]], ["eq", ["id", AUTRE]]],
    ]);
    expect(revalidateTag).toHaveBeenCalledWith("avis");
  });
});
