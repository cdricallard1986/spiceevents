import { describe, expect, it } from "vitest";
import { insecables, typographier } from "./typographie";

const F = " ";

describe("typographie française", () => {
  it("espace fine insécable avant ; : ! ? » et après «", () => {
    expect(insecables("Une première danse à couper le souffle ?")).toBe(`Une première danse à couper le souffle${F}?`);
    expect(insecables("Écrivez-nous : Cédric répond ; merci !")).toBe(`Écrivez-nous${F}: Cédric répond${F}; merci${F}!`);
    expect(insecables("les champs « facultatif »")).toBe(`les champs «${F}facultatif${F}»`);
    expect(insecables("déjà ?")).toBe(`déjà${F}?`);
  });

  it("ne touche ni l'anglais, ni les adresses, ni les clés", () => {
    for (const t of ["Which DJ for your night?", "https://www.spiceevents.fr/contact?x=1", "option:bar-a-vinyles", "/images/dj-pans.jpg", "20:30"]) {
      expect(insecables(t)).toBe(t);
    }
  });

  it("parcourt un contenu sans en changer la forme", () => {
    const c = { fr: { titre: "Quelle nuit *préparez-vous* ?", liste: ["a : b"], n: 3, actif: true, rien: null }, en: { titre: "Which night?" } };
    expect(typographier(c)).toEqual({ fr: { titre: `Quelle nuit *préparez-vous*${F}?`, liste: [`a${F}: b`], n: 3, actif: true, rien: null }, en: { titre: "Which night?" } });
  });
});

describe("apostrophes", () => {
  it("apostrophe typographique entre deux lettres, en français comme en anglais", () => {
    expect(insecables("l'équipe d'Angel")).toBe("l’équipe d’Angel");
    expect(insecables("Let's rock!")).toBe("Let’s rock!");
    expect(insecables("aujourd’hui")).toBe("aujourd’hui");
  });
  it("ne touche pas aux guillemets de code ni aux apostrophes isolées", () => {
    expect(insecables("'self' 'unsafe-inline'")).toBe("'self' 'unsafe-inline'");
    expect(insecables("rock 'n' roll")).toBe("rock 'n' roll");
  });
});
