import { describe, expect, it } from "vitest";
import { SITE } from "../site";
import { CONFIDENTIALITE, MENTIONS_LEGALES } from "./legal";

const texte = (page: typeof MENTIONS_LEGALES.fr) => JSON.stringify(page.blocs);

describe("mentions légales", () => {
  it("identifient la société éditrice dans les deux langues", () => {
    for (const page of [MENTIONS_LEGALES.fr, MENTIONS_LEGALES.en]) {
      const t = texte(page);
      for (const valeur of [SITE.societe.raisonSociale, SITE.societe.siret, SITE.societe.tva, SITE.societe.adresse.codePostal]) {
        expect(t).toContain(valeur);
      }
    }
  });

  it("ne laissent un champ à compléter que pour le capital, tant qu'il est inconnu", () => {
    const restants = [MENTIONS_LEGALES, CONFIDENTIALITE].flatMap((p) => [texte(p.fr), texte(p.en)]).join(" ").match(/\[À COMPLÉTER[^\]]*\]/g) ?? [];
    const attendus = SITE.societe.capital ? [] : restants.filter((r) => r.includes("capital"));
    expect(restants).toEqual(attendus);
  });
});
