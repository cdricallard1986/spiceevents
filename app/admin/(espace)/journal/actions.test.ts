import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server Actions du journal, avec une garde et un client Supabase simulés :
 * garde d'abord, Zod ensuite, écriture par le client de session, messages
 * clairs pour les refus de la base (adresse prise, adresse figée, article
 * incomplet), puis revalidation de l'étiquette « articles » quand le site
 * public change. Aucune photo ne transite par ces actions.
 */

type Appel = { cible: string; operations: [string, unknown[]][] };
type Reponse = { data: unknown; error: { code?: string; message: string; status?: number; statusCode?: string } | null };

const etat = vi.hoisted(() => ({
  appels: [] as Appel[],
  repondre: (() => ({ data: null, error: null })) as (appel: Appel) => Reponse,
  admin: true,
}));

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
const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: cache.revalidateTag, revalidatePath: cache.revalidatePath, unstable_cache: (fn: unknown) => fn }));

const actions = await import("./actions");
const { copierPhotoPhototheque, creerArticle, creerUrlEnvoiArticle, enregistrerArticle, publierArticle, retirerArticle, supprimerArticle } = actions;
const { exigerAdmin } = await import("@/lib/admin/garde");

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";
const PHOTO_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const DOC = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour" }] }] };
const CHAMPS = {
  slug: "se-marier-en-hiver",
  titre: " Se marier en hiver ",
  sous_titre: "",
  description: "Nos conseils pour un mariage d'hiver.",
  categorie: "Conseils mariage",
  date_publication: "2026-10-19",
  couverture: "journal/2026/10/1760000000000-a1b2c3d4e5f6.jpg",
  couverture_alt: "Mariés sous la neige",
  contenu: DOC,
  slugAuto: true,
};
/** La ligne en base (colonnes de l'éditeur). */
const LIGNE = {
  id: ID,
  statut: "brouillon",
  publie_le: null,
  slug: "se-marier-en-hiver",
  titre: "Se marier en hiver",
  sous_titre: null,
  description: "Nos conseils pour un mariage d'hiver.",
  categorie: "Conseils mariage",
  date_publication: "2026-10-19",
  couverture: "journal/2026/10/1760000000000-a1b2c3d4e5f6.jpg",
  couverture_alt: "Mariés sous la neige",
  contenu: DOC,
  updated_at: "2026-10-19T10:00:00Z",
};

const operations = (appel: Appel) => appel.operations.map(([nom]) => nom);
const appelsVers = (cible: string) => etat.appels.filter((a) => a.cible === cible);
const operation = (appel: Appel, nom: string) => appel.operations.find(([n]) => n === nom)?.[1];

beforeEach(() => {
  etat.appels = [];
  etat.admin = true;
  etat.repondre = () => ({ data: LIGNE, error: null });
  cache.revalidateTag.mockClear();
  cache.revalidatePath.mockClear();
  vi.mocked(exigerAdmin).mockClear();
});

describe("garde et validation", () => {
  it("chaque action refuse un appel sans session admin, avant toute requête", async () => {
    etat.admin = false;
    const appels = [
      () => creerArticle(),
      () => enregistrerArticle(ID, CHAMPS),
      () => publierArticle(ID),
      () => retirerArticle(ID),
      () => supprimerArticle(ID),
      () => creerUrlEnvoiArticle({ nomFichier: "a.jpg", type: "image/jpeg", taille: 10 }),
      () => copierPhotoPhototheque(PHOTO_ID),
    ];
    for (const appel of appels) await expect(appel()).rejects.toThrow("NEXT_REDIRECT");
    expect(exigerAdmin).toHaveBeenCalledTimes(appels.length);
    expect(Object.keys(actions).sort()).toEqual(
      ["copierPhotoPhototheque", "creerArticle", "creerUrlEnvoiArticle", "enregistrerArticle", "publierArticle", "retirerArticle", "supprimerArticle"].sort(),
    );
    expect(etat.appels).toEqual([]);
  });

  it("une entrée invalide n'écrit rien", async () => {
    expect(await enregistrerArticle("pas-un-uuid", CHAMPS)).toMatchObject({ ok: false, message: expect.stringContaining("introuvable") });
    expect(await enregistrerArticle(ID, { ...CHAMPS, slug: "Avec Majuscules" })).toMatchObject({ ok: false, erreurs: { slug: expect.stringContaining("minuscules") } });
    expect(await enregistrerArticle(ID, { ...CHAMPS, categorie: "Inconnue" })).toMatchObject({ ok: false, erreurs: { categorie: "Catégorie inconnue." } });
    expect(await enregistrerArticle(ID, { ...CHAMPS, couverture: "https://autre.fr/a.jpg" })).toMatchObject({ ok: false, erreurs: { couverture: expect.any(String) } });
    expect(await enregistrerArticle(ID, { ...CHAMPS, description: "x".repeat(161) })).toMatchObject({ ok: false, erreurs: { description: expect.stringContaining("160") } });
    // Document : lien dangereux, image d'un autre site, nœud inconnu.
    const lien = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] };
    expect(await enregistrerArticle(ID, { ...CHAMPS, contenu: lien })).toMatchObject({ ok: false, erreurs: { contenu: expect.stringContaining("Lien refusé") } });
    const image = { type: "doc", content: [{ type: "image", attrs: { src: "data:image/png;base64,AAAA", width: 1, height: 1, alt: "x" } }] };
    expect(await enregistrerArticle(ID, { ...CHAMPS, contenu: image })).toMatchObject({ ok: false, erreurs: { contenu: expect.stringContaining("Photo") } });
    expect(await enregistrerArticle(ID, { ...CHAMPS, contenu: { type: "doc", content: [{ type: "codeBlock" }] } })).toMatchObject({ ok: false, erreurs: { contenu: expect.any(String) } });
    expect(await publierArticle({ id: ID })).toMatchObject({ ok: false });
    expect(await retirerArticle("x")).toMatchObject({ ok: false });
    expect(await supprimerArticle(undefined)).toMatchObject({ ok: false });
    expect(await creerUrlEnvoiArticle({ nomFichier: "a.svg", type: "image/svg+xml", taille: 10 })).toMatchObject({ ok: false, message: expect.stringContaining("Format refusé") });
    expect(await creerUrlEnvoiArticle({ nomFichier: "a.jpg", type: "image/jpeg", taille: 16 * 1024 * 1024 })).toMatchObject({ ok: false, message: expect.stringContaining("trop lourd") });
    expect(await copierPhotoPhototheque("x")).toMatchObject({ ok: false });
    expect(etat.appels).toEqual([]);
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });
});

describe("creerArticle", () => {
  it("crée une ligne brouillon (adresse provisoire, titre vide, date du jour) avec la session", async () => {
    etat.repondre = () => ({ data: { id: ID }, error: null });
    expect(await creerArticle()).toEqual({ ok: true, id: ID });
    const [appel] = appelsVers("articles");
    const [ligne] = operation(appel, "insert") as [Record<string, unknown>];
    expect(ligne.slug).toMatch(/^brouillon-[a-f0-9]{10}$/);
    expect(ligne).toMatchObject({ titre: "", date_publication: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    expect(ligne).not.toHaveProperty("statut");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/journal");
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });

  it("retente avec une autre adresse provisoire si elle est prise ; message clair si la base refuse", async () => {
    let n = 0;
    etat.repondre = () => (++n === 1 ? { data: null, error: { code: "23505", message: "duplicate key" } } : { data: { id: ID }, error: null });
    expect(await creerArticle()).toEqual({ ok: true, id: ID });
    expect(appelsVers("articles")).toHaveLength(2);
    etat.repondre = () => ({ data: null, error: { code: "42501", message: "permission denied" } });
    expect(await creerArticle()).toMatchObject({ ok: false, message: expect.stringContaining("Droits refusés") });
  });
});

describe("enregistrerArticle", () => {
  it("enregistre un brouillon (champs nettoyés, document validé) sans régénérer le site", async () => {
    const r = await enregistrerArticle(ID, CHAMPS);
    expect(r).toMatchObject({ ok: true, article: { id: ID } });
    const [lecture, ecriture] = appelsVers("articles");
    expect(operations(lecture)).toEqual(["select", "eq", "maybeSingle"]);
    const [valeurs] = operation(ecriture, "update") as [Record<string, unknown>];
    expect(valeurs).toEqual({
      slug: "se-marier-en-hiver",
      titre: "Se marier en hiver",
      sous_titre: null,
      description: "Nos conseils pour un mariage d'hiver.",
      categorie: "Conseils mariage",
      date_publication: "2026-10-19",
      couverture: "journal/2026/10/1760000000000-a1b2c3d4e5f6.jpg",
      couverture_alt: "Mariés sous la neige",
      contenu: DOC,
    });
    expect(valeurs).not.toHaveProperty("statut");
    expect(valeurs).not.toHaveProperty("publie_le");
    expect(valeurs).not.toHaveProperty("slugAuto");
    expect(operation(ecriture, "eq")).toEqual(["id", ID]);
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });

  it("article publié : régénère le site, mais refuse qu'il devienne incomplet", async () => {
    etat.repondre = () => ({ data: { ...LIGNE, statut: "publie", publie_le: "2026-10-01T10:00:00Z" }, error: null });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: true });
    expect(cache.revalidateTag).toHaveBeenCalledWith("articles");
    cache.revalidateTag.mockClear();
    etat.appels = [];
    const r = await enregistrerArticle(ID, { ...CHAMPS, description: "" });
    expect(r).toMatchObject({ ok: false, erreurs: { description: expect.any(String) }, message: expect.stringContaining("retirez-le du site") });
    expect(appelsVers("articles")).toHaveLength(1);
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });

  it("l'adresse d'un article déjà publié une fois ne change plus", async () => {
    etat.repondre = () => ({ data: { ...LIGNE, statut: "brouillon", publie_le: "2026-10-01T10:00:00Z" }, error: null });
    const r = await enregistrerArticle(ID, { ...CHAMPS, slug: "nouvelle-adresse", slugAuto: false });
    expect(r).toMatchObject({ ok: false, erreurs: { slug: expect.stringContaining("ne change plus") } });
    expect(appelsVers("articles")).toHaveLength(1);
  });

  it("adresse qui suit le titre et déjà prise : un numéro est ajouté", async () => {
    etat.repondre = (appel) => {
      if (operations(appel).includes("like")) return { data: [{ slug: "mariage-d-hiver" }, { slug: "mariage-d-hiver-2" }], error: null };
      if (operations(appel).includes("update")) return { data: { ...LIGNE, slug: (operation(appel, "update") as [{ slug: string }])[0].slug }, error: null };
      return { data: { ...LIGNE, slug: "brouillon-a1b2c3d4e5" }, error: null };
    };
    const r = await enregistrerArticle(ID, { ...CHAMPS, slug: "mariage-d-hiver", slugAuto: true });
    expect(r).toMatchObject({ ok: true, article: { slug: "mariage-d-hiver-3" } });
    const recherche = appelsVers("articles").find((a) => operations(a).includes("like"))!;
    expect(operation(recherche, "like")).toEqual(["slug", "mariage-d-hiver%"]);
    expect(operation(recherche, "neq")).toEqual(["id", ID]);
  });

  it("adresse saisie à la main et déjà prise : refusée, avec une proposition libre", async () => {
    etat.repondre = (appel) => {
      if (operations(appel).includes("like")) return { data: [{ slug: "mariage-d-hiver" }], error: null };
      return { data: { ...LIGNE, slug: "brouillon-a1b2c3d4e5" }, error: null };
    };
    const r = await enregistrerArticle(ID, { ...CHAMPS, slug: "mariage-d-hiver", slugAuto: false });
    expect(r).toMatchObject({ ok: false, erreurs: { slug: expect.stringContaining("Proposition : mariage-d-hiver-2") } });
    expect(appelsVers("articles").some((a) => operations(a).includes("update"))).toBe(false);
  });

  it("traduit les refus de la base en messages clairs", async () => {
    const refus = (error: Reponse["error"]) => (appel: Appel) => (operations(appel).includes("update") ? { data: null, error } : { data: LIGNE, error: null });
    etat.repondre = refus({ code: "23505", message: "duplicate key value violates unique constraint" });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: false, erreurs: { slug: "Adresse déjà prise." } });
    etat.repondre = refus({ code: "23514", message: "L'adresse d'un article déjà publié ne peut plus être modifiée." });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: false, erreurs: { slug: expect.stringContaining("ne change plus") } });
    etat.repondre = refus({ code: "23514", message: 'new row violates check constraint "articles_publie_complet"' });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: false, message: expect.stringContaining("doit rester complet") });
    etat.repondre = refus({ code: "42501", message: "permission denied" });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: false, message: expect.stringContaining("Droits refusés") });
    etat.repondre = refus({ message: "fetch failed" });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: false, message: expect.stringContaining("la base ne répond pas") });
  });

  it("article introuvable (supprimé entre-temps)", async () => {
    etat.repondre = () => ({ data: null, error: null });
    expect(await enregistrerArticle(ID, CHAMPS)).toMatchObject({ ok: false, message: expect.stringContaining("introuvable") });
  });
});

describe("publierArticle", () => {
  it("publie un article complet : statut publié, date de première publication posée une fois", async () => {
    etat.repondre = (appel) => (operations(appel).includes("update") ? { data: { ...LIGNE, statut: "publie" }, error: null } : { data: LIGNE, error: null });
    const avant = Date.now();
    expect(await publierArticle(ID)).toMatchObject({ ok: true, article: { statut: "publie" } });
    const ecriture = appelsVers("articles").find((a) => operations(a).includes("update"))!;
    const [valeurs] = operation(ecriture, "update") as [{ statut: string; publie_le: string }];
    expect(valeurs.statut).toBe("publie");
    expect(Date.parse(valeurs.publie_le)).toBeGreaterThanOrEqual(avant - 1000);
    expect(cache.revalidateTag).toHaveBeenCalledWith("articles");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/journal");
  });

  it("republier un article retiré garde sa première date de publication", async () => {
    const premiere = "2026-01-02T03:04:05Z";
    etat.repondre = (appel) => ({ data: { ...LIGNE, publie_le: premiere, statut: operations(appel).includes("update") ? "publie" : "brouillon" }, error: null });
    await publierArticle(ID);
    const ecriture = appelsVers("articles").find((a) => operations(a).includes("update"))!;
    expect(operation(ecriture, "update")).toEqual([{ statut: "publie", publie_le: premiere }]);
  });

  it("article incomplet : la liste de ce qui manque, rien n'est écrit", async () => {
    etat.repondre = () => ({ data: { ...LIGNE, slug: "brouillon-a1b2c3d4e5", titre: "", description: null, couverture: null, couverture_alt: null }, error: null });
    const r = await publierArticle(ID);
    expect(r).toMatchObject({
      ok: false,
      message: "Pour publier, il manque : l'adresse, le titre, la description (résultat Google), la photo de couverture, le texte alternatif de la couverture.",
      erreurs: { titre: expect.any(String), description: expect.any(String), couverture: expect.any(String), couverture_alt: expect.any(String), slug: expect.any(String) },
    });
    expect(appelsVers("articles").some((a) => operations(a).includes("update"))).toBe(false);
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });

  it("contenu invalide en base : refusé", async () => {
    etat.repondre = () => ({ data: { ...LIGNE, contenu: { type: "doc", content: [{ type: "table" }] } }, error: null });
    expect(await publierArticle(ID)).toMatchObject({ ok: false, message: expect.stringContaining("ne peut pas être publié") });
  });
});

describe("retirerArticle et supprimerArticle", () => {
  it("retirer : repasse en brouillon et régénère le site", async () => {
    etat.repondre = () => ({ data: { ...LIGNE, statut: "brouillon", publie_le: "2026-01-01T00:00:00Z" }, error: null });
    expect(await retirerArticle(ID)).toMatchObject({ ok: true, article: { statut: "brouillon" } });
    const [appel] = appelsVers("articles");
    expect(operation(appel, "update")).toEqual([{ statut: "brouillon" }]);
    expect(cache.revalidateTag).toHaveBeenCalledWith("articles");
  });

  it("supprimer : seulement un article jamais publié", async () => {
    etat.repondre = () => ({ data: { id: ID, publie_le: "2026-01-01T00:00:00Z" }, error: null });
    expect(await supprimerArticle(ID)).toMatchObject({ ok: false, message: expect.stringContaining("Retirez-le du site") });
    expect(appelsVers("articles").some((a) => operations(a).includes("delete"))).toBe(false);

    etat.appels = [];
    etat.repondre = (appel) => (operations(appel).includes("delete") ? { data: [{ id: ID }], error: null } : { data: { id: ID, publie_le: null }, error: null });
    expect(await supprimerArticle(ID)).toEqual({ ok: true, id: ID });
    const suppression = appelsVers("articles").find((a) => operations(a).includes("delete"))!;
    // Condition revérifiée à la suppression : un article publié entre-temps n'est pas touché.
    expect(operation(suppression, "is")).toEqual(["publie_le", null]);
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/journal");
  });
});

describe("photos d'un article", () => {
  it("creerUrlEnvoiArticle : chemin sûr sous journal/<aaaa>/<mm>/ (extension du type MIME), URL signée avec la session", async () => {
    etat.repondre = (appel) => ({ data: { path: appel.operations[0][1][0], token: "jeton" }, error: null });
    const r = await creerUrlEnvoiArticle({ nomFichier: "../../x.php.jpg", type: "image/webp", taille: 1000 });
    expect(r).toMatchObject({ ok: true, jeton: "jeton" });
    if (!r.ok) return;
    expect(r.chemin).toMatch(/^journal\/\d{4}\/\d{2}\/\d{13}-[a-f0-9]{12}\.webp$/);
    expect(appelsVers("storage:medias")[0].operations).toEqual([["createSignedUploadUrl", [r.chemin]]]);
  });

  it("copierPhotoPhototheque : une photo envoyée est copiée dans le dossier du journal ; une photo du site est refusée ici", async () => {
    etat.repondre = (appel) =>
      appel.cible === "photos" ? { data: { id: PHOTO_ID, origine: "stockage", chemin: "galeries/2026/09/1750000000000-abcdef123456.png", alt_fr: "Piste" }, error: null } : { data: {}, error: null };
    const r = await copierPhotoPhototheque(PHOTO_ID);
    expect(r).toMatchObject({ ok: true, alt: "Piste", chemin: expect.stringMatching(/^journal\/\d{4}\/\d{2}\/\d{13}-[a-f0-9]{12}\.png$/) });
    const [copie] = appelsVers("storage:medias");
    expect(copie.operations[0][0]).toBe("copy");
    expect(copie.operations[0][1][0]).toBe("galeries/2026/09/1750000000000-abcdef123456.png");

    etat.appels = [];
    etat.repondre = () => ({ data: { id: PHOTO_ID, origine: "site", chemin: "/images/a.jpg", alt_fr: "x" }, error: null });
    expect(await copierPhotoPhototheque(PHOTO_ID)).toMatchObject({ ok: false });
    expect(appelsVers("storage:medias")).toEqual([]);
  });
});
