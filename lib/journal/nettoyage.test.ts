import { describe, expect, it, vi } from "vitest";
import { nettoyerBrouillonsVides } from "./nettoyage";

/** Client simulé : enregistre les appels, répond selon l'opération (lecture ou suppression). */
function client(reponses: { lecture: { data: unknown; error: unknown }; suppression?: { data: unknown; error: unknown } }) {
  const appels: [string, unknown[]][][] = [];
  const from = vi.fn(() => {
    const ops: [string, unknown[]][] = [];
    appels.push(ops);
    const proxy: Record<string, unknown> = new Proxy(
      {},
      {
        get(_c, nom: string) {
          if (nom === "then") {
            const r = ops.some(([n]) => n === "delete") ? reponses.suppression : reponses.lecture;
            return (ok: (x: unknown) => unknown) => Promise.resolve(r).then(ok);
          }
          return (...args: unknown[]) => {
            ops.push([nom, args]);
            return proxy;
          };
        },
      },
    );
    return proxy;
  });
  return { supabase: { from } as never, appels };
}

const MAINTENANT = new Date("2026-10-19T12:00:00Z");
const VIDE = { statut: "brouillon", publie_le: null, titre: "", sous_titre: null, description: null, couverture: null, contenu: { type: "doc", content: [] }, updated_at: "2026-10-17T00:00:00Z" };

describe("nettoyage des brouillons jamais remplis", () => {
  it("cherche les brouillons vides de plus de 24 h, puis ne supprime que ceux qui sont vraiment vides, aux mêmes conditions", async () => {
    const { supabase, appels } = client({
      lecture: {
        data: [
          { ...VIDE, id: "a" },
          { ...VIDE, id: "b", contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Idée" }] }] } },
          { ...VIDE, id: "c", couverture: "journal/2026/10/1-abcdef.jpg" },
        ],
        error: null,
      },
      suppression: { data: [{ id: "a" }], error: null },
    });
    expect(await nettoyerBrouillonsVides(supabase, MAINTENANT)).toBe(1);
    const [lecture, suppression] = appels;
    expect(lecture).toEqual(
      expect.arrayContaining([
        ["eq", ["statut", "brouillon"]],
        ["is", ["publie_le", null]],
        ["eq", ["titre", ""]],
        ["lt", ["updated_at", "2026-10-18T12:00:00.000Z"]],
      ]),
    );
    expect(suppression).toEqual(
      expect.arrayContaining([["delete", []], ["in", ["id", ["a"]]], ["is", ["publie_le", null]], ["eq", ["titre", ""]], ["lt", ["updated_at", "2026-10-18T12:00:00.000Z"]]]),
    );
  });

  it("rien à supprimer : aucune suppression ; erreur de la base : journalisée, la page continue", async () => {
    const rien = client({ lecture: { data: [], error: null } });
    expect(await nettoyerBrouillonsVides(rien.supabase, MAINTENANT)).toBe(0);
    expect(rien.appels).toHaveLength(1);
    const avertir = vi.spyOn(console, "warn").mockImplementation(() => {});
    const panne = client({ lecture: { data: null, error: { code: "08006", message: "connexion perdue" } } });
    expect(await nettoyerBrouillonsVides(panne.supabase, MAINTENANT)).toBe(0);
    const refus = client({ lecture: { data: [{ ...VIDE, id: "a" }], error: null }, suppression: { data: null, error: { code: "42501", message: "refus" } } });
    expect(await nettoyerBrouillonsVides(refus.supabase, MAINTENANT)).toBe(0);
    expect(avertir).toHaveBeenCalledTimes(2);
    avertir.mockRestore();
  });
});
