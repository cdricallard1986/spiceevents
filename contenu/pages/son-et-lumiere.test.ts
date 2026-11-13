import { describe, expect, it } from "vitest";
import { IMAGES } from "@/lib/images";
import { redirections } from "@/lib/seo/redirections";
import { FAQ } from "./faq";
import { SON_ET_LUMIERE } from "./son-et-lumiere";

describe("page Son & lumière", () => {
  it("décrit les mêmes familles de matériel dans les deux langues, chacune avec sa photo", () => {
    const { fr, en } = SON_ET_LUMIERE;
    expect(en.materiel.familles.map((f) => f.image)).toEqual(fr.materiel.familles.map((f) => f.image));
    expect(new Set(fr.materiel.familles.map((f) => f.image)).size).toBe(fr.materiel.familles.length);
    for (const f of fr.materiel.familles) expect(IMAGES[f.image], f.image).toBeDefined();
    expect(en.preparation.etapes).toHaveLength(fr.preparation.etapes.length);
    expect(en.securite.points).toHaveLength(fr.securite.points.length);
  });

  it("a une description Google de longueur raisonnable", () => {
    for (const l of ["fr", "en"] as const) expect(SON_ET_LUMIERE[l].seo.description.length).toBeLessThanOrEqual(200);
  });

  it("reprend les questions techniques de la FAQ, dans les deux langues", () => {
    for (const l of ["fr", "en"] as const) expect(FAQ[l].themes.find((t) => t.id === "technique")?.questions.length).toBeGreaterThan(0);
  });

  it("reçoit l’ancienne page « performances techniques » et les articles sur le matériel", () => {
    const vers = (source: string) => redirections().find((r) => r.source === source)?.destination;
    expect(vers("/performances-techniques-son-and-lumieres")).toBe("/son-et-lumiere");
    expect(vers("/blog/nouvelle-regie-pioneer-blanche-edition-limitee")).toBe("/son-et-lumiere");
  });
});
