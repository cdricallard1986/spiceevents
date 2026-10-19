import { describe, expect, it } from "vitest";
import { etatPastilleConfiguration, etatPastilleSuite, etatPastilleUnitaires, ongletDepuis, ongletVoisin, pastille } from "./onglets-tests";

describe("ongletDepuis", () => {
  it("lit l'onglet de l'adresse, sinon le premier", () => {
    expect(ongletDepuis("droits")).toBe("droits");
    expect(ongletDepuis(["configuration", "sql"])).toBe("configuration");
    expect(ongletDepuis(undefined)).toBe("sql");
    expect(ongletDepuis("<script>")).toBe("sql");
  });
});

describe("ongletVoisin", () => {
  it("flèches en boucle, Début et Fin ; les autres touches ne font rien", () => {
    expect(ongletVoisin("sql", "ArrowRight")).toBe("droits");
    expect(ongletVoisin("configuration", "ArrowRight")).toBe("sql");
    expect(ongletVoisin("sql", "ArrowLeft")).toBe("configuration");
    expect(ongletVoisin("droits", "Home")).toBe("sql");
    expect(ongletVoisin("droits", "End")).toBe("configuration");
    expect(ongletVoisin("droits", "Enter")).toBeNull();
  });
});

describe("pastilles", () => {
  it("✓ / ✗ n / … / ! / –", () => {
    expect(pastille({ type: "ok" })).toEqual({ signe: "✓", ton: "succes", libelle: "tout passe" });
    expect(pastille({ type: "ok", total: 703 }).signe).toBe("✓ 703");
    expect(pastille({ type: "echec", nombre: 2 })).toEqual({ signe: "✗ 2", ton: "erreur", libelle: "2 échecs" });
    expect(pastille({ type: "en_cours" }).signe).toBe("…");
    expect(pastille({ type: "erreur" })).toEqual({ signe: "!", ton: "erreur", libelle: "n'a pas pu s'exécuter" });
    expect(pastille({ type: "absent" }).ton).toBe("neutre");
  });

  it("suite live : en cours, puis erreur, échecs ou vert", () => {
    expect(etatPastilleSuite({ enCours: true, erreur: null, echecs: 3 })).toEqual({ type: "en_cours" });
    expect(etatPastilleSuite({ enCours: false, erreur: "panne", echecs: null })).toEqual({ type: "erreur" });
    expect(etatPastilleSuite({ enCours: false, erreur: null, echecs: 0 })).toEqual({ type: "ok" });
    expect(etatPastilleSuite({ enCours: false, erreur: null, echecs: 2 })).toEqual({ type: "echec", nombre: 2 });
  });

  it("tests unitaires : vert avec le total si 0 échec ; un fichier en erreur compte comme un échec", () => {
    expect(etatPastilleUnitaires(null)).toEqual({ type: "absent" });
    expect(etatPastilleUnitaires({ succes: true, totaux: { total: 703, echoues: 0 }, fichiersEnErreur: 0 })).toEqual({ type: "ok", total: 703 });
    expect(etatPastilleUnitaires({ succes: false, totaux: { total: 703, echoues: 2 }, fichiersEnErreur: 0 })).toEqual({ type: "echec", nombre: 2 });
    expect(etatPastilleUnitaires({ succes: false, totaux: { total: 700, echoues: 0 }, fichiersEnErreur: 1 })).toEqual({ type: "echec", nombre: 1 });
  });

  it("configuration : chaque secret absent est un échec, une valeur par défaut n'en est pas un", () => {
    expect(etatPastilleConfiguration([{ secret: true, presente: true }, { secret: false, presente: false }])).toEqual({ type: "ok" });
    expect(etatPastilleConfiguration([{ secret: true, presente: false }, { secret: true, presente: false }])).toEqual({ type: "echec", nombre: 2 });
  });
});
