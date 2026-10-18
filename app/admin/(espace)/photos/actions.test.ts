import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server Actions des photos, avec une garde et un client Supabase simulés :
 * garde d'abord, Zod ensuite, écriture par le client de session (tables et
 * Storage), puis revalidation de l'étiquette « galeries ». Aucun fichier ne
 * transite par ces actions.
 */

type Appel = { cible: string; operations: [string, unknown[]][] };
type Reponse = { data: unknown; error: { code?: string; message: string; status?: number; statusCode?: string } | null; count?: number };

const etat = vi.hoisted(() => ({
  appels: [] as Appel[],
  repondre: (() => ({ data: null, error: null })) as (appel: Appel) => Reponse,
  admin: true,
}));

/** Chaîne simulée : enregistre chaque appel (`from("photos").insert(…)…`, `storage.from("medias").remove(…)`) et répond via `etat.repondre`. */
function chaine(cible: string) {
  const appel: Appel = { cible, operations: [] };
  etat.appels.push(appel);
  const proxy: Record<string, unknown> = new Proxy(
    {},
    {
      get(_c, nom: string) {
        if (nom === "then") return (ok: (r: Reponse) => unknown, ko: (e: unknown) => unknown) => Promise.resolve(etat.repondre(appel)).then(ok, ko);
        return (...args: unknown[]) => {
          appel.operations.push([nom, args]);
          return proxy;
        };
      },
    },
  );
  return proxy;
}

function fauxClient() {
  return { from: (table: string) => chaine(table), storage: { from: (bucket: string) => chaine(`storage:${bucket}`) } };
}

vi.mock("@/lib/admin/garde", () => ({
  exigerAdmin: vi.fn(async () => {
    if (!etat.admin) throw new Error("NEXT_REDIRECT");
    return { supabase: fauxClient(), utilisateur: { id: "u1" } };
  }),
}));
const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }));

const actions = await import("./actions");
const { ajouterAGalerie, creerUrlEnvoi, echangerOrdrePhotos, enregistrerPhoto, modifierPhoto, retirerDeGalerie, supprimerPhoto } = actions;
const { exigerAdmin } = await import("@/lib/admin/garde");

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";
const AUTRE = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const CHEMIN = "galeries/2026/10/1760000000000-a1b2c3d4e5f6.jpg";
const PHOTO = { id: ID, origine: "stockage", chemin: CHEMIN, largeur: 2400, hauteur: 1600, alt_fr: "Mariés sur la piste", alt_en: null, credit: null };
const ENVOI = { chemin: CHEMIN, largeur: 2400, hauteur: 1600, alt_fr: "  Mariés sur la piste ", alt_en: "", credit: "" };

const operations = (appel: Appel) => appel.operations.map(([nom]) => nom);
const appelsVers = (cible: string) => etat.appels.filter((a) => a.cible === cible);

beforeEach(() => {
  etat.appels = [];
  etat.admin = true;
  etat.repondre = () => ({ data: PHOTO, error: null });
  revalidateTag.mockClear();
  vi.mocked(exigerAdmin).mockClear();
});

describe("garde et validation", () => {
  it("chaque action refuse un appel sans session admin, avant toute requête", async () => {
    etat.admin = false;
    const appels = [
      () => creerUrlEnvoi({ nomFichier: "a.jpg", type: "image/jpeg", taille: 10 }),
      () => enregistrerPhoto(ENVOI),
      () => modifierPhoto(ID, { alt_fr: "x" }),
      () => ajouterAGalerie({ galerie: "galerie_mariages", photoIds: [ID] }),
      () => retirerDeGalerie({ galerie: "galerie_mariages", photoId: ID }),
      () => echangerOrdrePhotos({ galerie: "galerie_mariages", photoId: ID, avecId: AUTRE, sens: "monter" }),
      () => supprimerPhoto(ID),
    ];
    for (const appel of appels) await expect(appel()).rejects.toThrow("NEXT_REDIRECT");
    expect(exigerAdmin).toHaveBeenCalledTimes(appels.length);
    expect(Object.keys(actions).sort()).toEqual(
      ["ajouterAGalerie", "creerUrlEnvoi", "echangerOrdrePhotos", "enregistrerPhoto", "modifierPhoto", "retirerDeGalerie", "supprimerPhoto"].sort(),
    );
    expect(etat.appels).toEqual([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("une entrée invalide n'écrit rien", async () => {
    expect(await creerUrlEnvoi({ nomFichier: "a.svg", type: "image/svg+xml", taille: 10 })).toMatchObject({ ok: false, message: expect.stringContaining("Format refusé") });
    expect(await creerUrlEnvoi({ nomFichier: "a.jpg", type: "image/jpeg", taille: 16 * 1024 * 1024 })).toMatchObject({ ok: false, message: expect.stringContaining("trop lourd") });
    expect(await enregistrerPhoto({ ...ENVOI, alt_fr: " " })).toMatchObject({ ok: false, erreurs: { alt_fr: expect.stringContaining("obligatoire") } });
    expect(await enregistrerPhoto({ ...ENVOI, chemin: "/images/hero-premiere-danse.jpg" })).toMatchObject({ ok: false, message: expect.stringContaining("Chemin de fichier refusé") });
    expect(await enregistrerPhoto({ ...ENVOI, chemin: "autre-bucket/x.jpg" })).toMatchObject({ ok: false });
    expect(await enregistrerPhoto({ ...ENVOI, galerie: "accueil" })).toMatchObject({ ok: false });
    expect(await modifierPhoto("pas-un-uuid", { alt_fr: "x" })).toMatchObject({ ok: false });
    expect(await ajouterAGalerie({ galerie: "option:inconnue", photoIds: [ID] })).toMatchObject({ ok: false });
    expect(await echangerOrdrePhotos({ galerie: "galerie_mariages", photoId: ID, avecId: ID, sens: "monter" })).toMatchObject({ ok: false });
    expect(await supprimerPhoto({ id: ID })).toMatchObject({ ok: false });
    expect(etat.appels).toEqual([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("creerUrlEnvoi", () => {
  it("calcule un chemin sûr (extension du type MIME, pas du nom) et demande l'URL signée avec la session", async () => {
    etat.repondre = (appel) => ({ data: { path: appel.operations[0][1][0], token: "jeton-signe", signedUrl: "https://…" }, error: null });
    const r = await creerUrlEnvoi({ nomFichier: "../../piste.php.jpg", type: "image/webp", taille: 1000 });
    expect(r).toMatchObject({ ok: true, jeton: "jeton-signe" });
    if (!r.ok) return;
    expect(r.chemin).toMatch(/^galeries\/\d{4}\/\d{2}\/\d{13}-[a-f0-9]{12}\.webp$/);
    const [appel] = appelsVers("storage:medias");
    expect(appel.operations).toEqual([["createSignedUploadUrl", [r.chemin]]]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("deux envois n'ont jamais le même chemin", async () => {
    etat.repondre = (appel) => ({ data: { path: appel.operations[0][1][0], token: "t" }, error: null });
    const a = await creerUrlEnvoi({ nomFichier: "a.jpg", type: "image/jpeg", taille: 10 });
    const b = await creerUrlEnvoi({ nomFichier: "a.jpg", type: "image/jpeg", taille: 10 });
    expect(a.ok && b.ok && a.chemin !== b.chemin).toBe(true);
  });

  it("un refus de Storage (session non admin) donne un message clair", async () => {
    etat.repondre = () => ({ data: null, error: { message: "new row violates row-level security policy", status: 403, statusCode: "403" } });
    expect(await creerUrlEnvoi({ nomFichier: "a.jpg", type: "image/jpeg", taille: 10 })).toMatchObject({ ok: false, message: expect.stringContaining("Droits refusés") });
  });
});

describe("enregistrerPhoto", () => {
  it("vérifie que le fichier est arrivé, enregistre la photo (métadonnées seules), puis régénère les galeries", async () => {
    etat.repondre = (appel) => (appel.cible === "storage:medias" ? { data: true, error: null } : { data: PHOTO, error: null });
    const r = await enregistrerPhoto(ENVOI);
    expect(r).toEqual({ ok: true, photo: PHOTO, liaison: null });
    expect(appelsVers("storage:medias")[0].operations).toEqual([["exists", [CHEMIN]]]);
    const [insertion] = appelsVers("photos");
    expect(operations(insertion)).toEqual(["insert", "select", "single"]);
    expect(insertion.operations[0][1][0]).toEqual({ origine: "stockage", chemin: CHEMIN, largeur: 2400, hauteur: 1600, alt_fr: "Mariés sur la piste", alt_en: null, credit: null });
    expect(revalidateTag).toHaveBeenCalledWith("galeries");
  });

  it("avec une galerie : ajoute la photo en dernière position", async () => {
    etat.repondre = (appel) => {
      if (appel.cible === "storage:medias") return { data: true, error: null };
      if (appel.cible === "galeries_photos" && operations(appel).includes("limit")) return { data: [{ ordre: 230 }], error: null };
      if (appel.cible === "galeries_photos") return { data: [{ galerie: "galerie_mariages", photo_id: ID, ordre: 240 }], error: null };
      return { data: PHOTO, error: null };
    };
    const r = await enregistrerPhoto({ ...ENVOI, galerie: "galerie_mariages" });
    expect(r).toMatchObject({ ok: true, liaison: { galerie: "galerie_mariages", photo_id: ID, ordre: 240 } });
    const [rang, liaison] = appelsVers("galeries_photos");
    expect(rang.operations).toContainEqual(["eq", ["galerie", "galerie_mariages"]]);
    expect(liaison.operations[0]).toEqual(["insert", [[{ galerie: "galerie_mariages", photo_id: ID, ordre: 240 }]]]);
  });

  it("un fichier absent du bucket n'est pas enregistré", async () => {
    etat.repondre = (appel) => (appel.cible === "storage:medias" ? { data: false, error: { message: "Object not found", status: 400 } } : { data: PHOTO, error: null });
    expect(await enregistrerPhoto(ENVOI)).toMatchObject({ ok: false, message: expect.stringContaining("pas arrivé") });
    expect(appelsVers("photos")).toEqual([]);
  });

  it("si l'ajout à la galerie échoue, la photo reste enregistrée et un avertissement le dit", async () => {
    etat.repondre = (appel) => {
      if (appel.cible === "storage:medias") return { data: true, error: null };
      if (appel.cible === "galeries_photos") return { data: null, error: { message: "réseau" } };
      return { data: PHOTO, error: null };
    };
    const r = await enregistrerPhoto({ ...ENVOI, galerie: "galerie_mariages" });
    expect(r).toMatchObject({ ok: true, liaison: null, avertissement: expect.stringContaining("photothèque") });
  });
});

describe("modifierPhoto, galeries, ordre", () => {
  it("enregistre les textes alternatifs validés", async () => {
    const r = await modifierPhoto(ID, { alt_fr: " Piste ", alt_en: "Dance floor", credit: "", chemin: "galeries/pirate.jpg", origine: "site" });
    expect(r).toEqual({ ok: true, photo: PHOTO });
    const [maj] = appelsVers("photos");
    expect(maj.operations[0]).toEqual(["update", [{ alt_fr: "Piste", alt_en: "Dance floor", credit: null }]]);
    expect(maj.operations[1]).toEqual(["eq", ["id", ID]]);
    expect(revalidateTag).toHaveBeenCalledWith("galeries");
  });

  it("ajoute depuis la photothèque à la fin, sans doublon", async () => {
    etat.repondre = (appel) => {
      if (operations(appel).includes("in")) return { data: [{ photo_id: ID }], error: null };
      if (operations(appel).includes("limit")) return { data: [], error: null };
      return { data: [{ galerie: "option:photobooth", photo_id: AUTRE, ordre: 10 }], error: null };
    };
    const r = await ajouterAGalerie({ galerie: "option:photobooth", photoIds: [ID, AUTRE] });
    expect(r).toEqual({ ok: true, liaisons: [{ galerie: "option:photobooth", photo_id: AUTRE, ordre: 10 }] });
    expect(appelsVers("galeries_photos")[2].operations[0]).toEqual(["insert", [[{ galerie: "option:photobooth", photo_id: AUTRE, ordre: 10 }]]]);
  });

  it("retire d'une galerie (la photo reste) et avertit si une page d'option passe sous 2 photos", async () => {
    etat.repondre = (appel) => (operations(appel).includes("delete") ? { data: [{ photo_id: ID }], error: null } : { data: null, error: null, count: 1 });
    const r = await retirerDeGalerie({ galerie: "option:bar-a-vinyles", photoId: ID });
    expect(r).toMatchObject({ ok: true, restantes: 1, avertissement: expect.stringContaining("ne s'affichera pas") });
    const [retrait] = appelsVers("galeries_photos");
    expect(retrait.operations).toEqual([
      ["delete", []],
      ["eq", ["galerie", "option:bar-a-vinyles"]],
      ["eq", ["photo_id", ID]],
      ["select", ["photo_id"]],
    ]);
    expect(appelsVers("photos")).toEqual([]);
    expect(revalidateTag).toHaveBeenCalledWith("galeries");
  });

  it("pas d'avertissement pour la page Galerie", async () => {
    etat.repondre = (appel) => (operations(appel).includes("delete") ? { data: [{ photo_id: ID }], error: null } : { data: null, error: null, count: 0 });
    const r = await retirerDeGalerie({ galerie: "galerie_mariages", photoId: ID });
    expect(r).toEqual({ ok: true, galerie: "galerie_mariages", photoId: ID, restantes: 0 });
  });

  it("échange le rang de deux photos de la même galerie", async () => {
    etat.repondre = (appel) =>
      operations(appel)[0] === "select" ? { data: [{ photo_id: ID, ordre: 30 }, { photo_id: AUTRE, ordre: 20 }], error: null } : { data: null, error: null };
    const r = await echangerOrdrePhotos({ galerie: "galerie_mariages", photoId: ID, avecId: AUTRE, sens: "monter" });
    expect(r).toEqual({ ok: true, rangs: [{ photoId: ID, ordre: 20 }, { photoId: AUTRE, ordre: 30 }] });
    expect(etat.appels.slice(1).map((a) => a.operations)).toEqual([
      [["update", [{ ordre: 20 }]], ["eq", ["galerie", "galerie_mariages"]], ["eq", ["photo_id", ID]]],
      [["update", [{ ordre: 30 }]], ["eq", ["galerie", "galerie_mariages"]], ["eq", ["photo_id", AUTRE]]],
    ]);
  });
});

describe("supprimerPhoto", () => {
  it("efface le fichier du bucket, puis la ligne (ses liaisons partent avec)", async () => {
    etat.repondre = (appel) => {
      if (appel.cible === "storage:medias") return { data: [{ name: CHEMIN }], error: null };
      if (operations(appel).includes("delete")) return { data: [{ id: ID }], error: null };
      return { data: { id: ID, origine: "stockage", chemin: CHEMIN }, error: null };
    };
    expect(await supprimerPhoto(ID)).toEqual({ ok: true, id: ID });
    expect(etat.appels.map((a) => `${a.cible}:${operations(a)[0]}`)).toEqual(["photos:select", "storage:medias:remove", "photos:delete"]);
    expect(appelsVers("storage:medias")[0].operations[0]).toEqual(["remove", [[CHEMIN]]]);
    expect(revalidateTag).toHaveBeenCalledWith("galeries");
  });

  it("refuse de supprimer un fichier du site, sans rien toucher", async () => {
    etat.repondre = () => ({ data: { id: ID, origine: "site", chemin: "/images/hero-premiere-danse.jpg" }, error: null });
    expect(await supprimerPhoto(ID)).toMatchObject({ ok: false, message: expect.stringContaining("fichiers du site") });
    expect(etat.appels).toHaveLength(1);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("si le fichier ne peut pas être effacé, la photo n'est pas supprimée", async () => {
    etat.repondre = (appel) =>
      appel.cible === "storage:medias" ? { data: null, error: { message: "réseau" } } : { data: { id: ID, origine: "stockage", chemin: CHEMIN }, error: null };
    expect(await supprimerPhoto(ID)).toMatchObject({ ok: false });
    expect(etat.appels.some((a) => operations(a).includes("delete"))).toBe(false);
  });
});
