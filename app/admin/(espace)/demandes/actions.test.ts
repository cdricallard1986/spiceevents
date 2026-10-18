import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server Action du suivi des demandes, avec une garde et un client Supabase
 * simulés : garde d'abord, Zod ensuite, écriture par le client de session des
 * seules colonnes statut et note_interne, puis revalidation de la page.
 */

type Appel = { table: string; operations: [string, unknown[]][] };
type Reponse = { data: unknown; error: { code?: string; message: string } | null };

const etat = vi.hoisted(() => ({
  appels: [] as Appel[],
  repondre: (() => ({ data: null, error: null })) as (appel: Appel) => Reponse,
  admin: true,
}));

/** Client simulé : enregistre chaque chaîne d'appels et répond via `etat.repondre`. */
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
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));

const { enregistrerSuiviDemande } = await import("./actions");
const { exigerAdmin } = await import("@/lib/admin/garde");

const ID = "3f1c9b4e-2d7a-4c1e-9b8f-6a5d4c3b2a10";
const SUIVI = { id: ID, statut: "rappelee", note_interne: "Rappeler lundi", updated_at: "2026-10-18T10:00:00Z" };
const operations = (appel: Appel) => appel.operations.map(([nom]) => nom);

beforeEach(() => {
  etat.appels = [];
  etat.admin = true;
  etat.repondre = () => ({ data: SUIVI, error: null });
  revalidatePath.mockClear();
  vi.mocked(exigerAdmin).mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("enregistrerSuiviDemande", () => {
  it("refuse un appel sans session admin, avant toute requête", async () => {
    etat.admin = false;
    await expect(enregistrerSuiviDemande({ id: ID, statut: "signee" })).rejects.toThrow("NEXT_REDIRECT");
    expect(exigerAdmin).toHaveBeenCalledOnce();
    expect(etat.appels).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("une entrée invalide n'écrit rien", async () => {
    for (const entree of [{ id: "x", statut: "signee" }, { id: ID, statut: "archivee" }, { id: ID }, { id: ID, statut: "signee", email: "pirate@example.com" }, null]) {
      expect(await enregistrerSuiviDemande(entree)).toMatchObject({ ok: false });
    }
    expect(etat.appels).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("écrit seulement le statut et la note sur la demande visée, puis régénère la page", async () => {
    const r = await enregistrerSuiviDemande({ id: ID, statut: "rappelee", note_interne: "  Rappeler lundi  " });
    expect(r).toEqual({ ok: true, suivi: SUIVI });
    const [maj] = etat.appels;
    expect(maj.table).toBe("demandes_contact");
    expect(operations(maj)).toEqual(["update", "eq", "select", "maybeSingle"]);
    expect(maj.operations[0][1][0]).toEqual({ statut: "rappelee", note_interne: "Rappeler lundi" });
    expect(maj.operations[1][1]).toEqual(["id", ID]);
    expect(maj.operations[2][1][0]).toBe("id, statut, note_interne, updated_at");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/demandes");
  });

  it("n'écrit que la colonne fournie", async () => {
    await enregistrerSuiviDemande({ id: ID, statut: "perdue" });
    expect(etat.appels[0].operations[0][1][0]).toEqual({ statut: "perdue" });
  });

  it("demande introuvable, droits refusés, base indisponible : un message clair, sans revalidation", async () => {
    etat.repondre = () => ({ data: null, error: null });
    expect(await enregistrerSuiviDemande({ id: ID, statut: "signee" })).toEqual({ ok: false, message: "Demande introuvable : rechargez la page." });
    etat.repondre = () => ({ data: null, error: { code: "42501", message: "permission denied" } });
    expect(await enregistrerSuiviDemande({ id: ID, statut: "signee" })).toMatchObject({ ok: false, message: expect.stringContaining("Droits refusés") });
    etat.repondre = () => ({ data: null, error: { message: "fetch failed" } });
    expect(await enregistrerSuiviDemande({ id: ID, statut: "signee" })).toMatchObject({ ok: false, message: expect.stringContaining("la base ne répond pas") });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
