import { describe, expect, it, vi } from "vitest";
import { traiterDemande, type Base, type Dependances, type Envoi } from "./traitement";
import { LIMITE } from "./limite";

const MAINTENANT = new Date("2026-10-15T08:00:00Z");

function brut(modifs: Record<string, string> = {}): Record<string, string> {
  return {
    prenoms: "Julie & Thomas",
    nom: "Martin",
    email: "julie.martin@exemple.fr",
    telephone: "06 12 34 56 78",
    type: "mariage",
    date: "2027-06-12",
    lieu: "Domaine du Lac",
    invites: "120",
    message: "Bonjour !",
    langue: "fr",
    site_web: "",
    ouvert_le: "1000000",
    envoye_le: "1060000",
    ...modifs,
  };
}

/** Fausse base en mémoire, avec des pannes à la demande. */
function fausseBase(options: { panneComptage?: boolean; panneInsertion?: boolean; recentes?: number } = {}) {
  const lignes: Record<string, unknown>[] = [];
  const marques: { id: string; etat: { email_envoye: boolean; accuse_envoye: boolean } }[] = [];
  const base: Base = {
    compterRecentes: vi.fn(async () => {
      if (options.panneComptage) throw new Error("base indisponible");
      return options.recentes ?? 0;
    }),
    inserer: vi.fn(async (ligne) => {
      if (options.panneInsertion) throw new Error("base indisponible");
      lignes.push(ligne);
      return "id-1";
    }),
    marquer: vi.fn(async (id, etat) => {
      marques.push({ id, etat });
    }),
  };
  return { base, lignes, marques };
}

/** Faux envoi d'emails, avec des pannes à la demande. */
function fauxEnvoi(options: { panne?: boolean; panneAccuse?: boolean } = {}) {
  const envoyes: { to: string; subject: string }[] = [];
  const envoi: Envoi = {
    config: { destinataire: "cedric@spiceevents.fr", expediteur: "Spice Events <contact@spiceevents.fr>" },
    envoyer: vi.fn(async (email) => {
      if (options.panne) throw new Error("Resend indisponible");
      if (options.panneAccuse && email.to !== "cedric@spiceevents.fr") throw new Error("Resend indisponible");
      envoyes.push({ to: email.to, subject: email.subject });
    }),
  };
  return { envoi, envoyes };
}

function deps(modifs: Partial<Dependances> = {}): Dependances {
  return {
    maintenant: MAINTENANT,
    production: true,
    ip: "203.0.113.7",
    secretIp: "secret",
    base: fausseBase().base,
    envoi: fauxEnvoi().envoi,
    journal: { info: vi.fn(), avertir: vi.fn(), erreur: vi.fn() },
    ...modifs,
  };
}

describe("traiterDemande — cas nominal", () => {
  it("enregistre, prévient Cédric, accuse réception puis met à jour les booléens", async () => {
    const b = fausseBase();
    const e = fauxEnvoi();
    const r = await traiterDemande(brut(), deps({ base: b.base, envoi: e.envoi }));
    expect(r).toEqual({ statut: "succes" });
    expect(b.lignes).toHaveLength(1);
    expect(e.envoyes.map((x) => x.to)).toEqual(["cedric@spiceevents.fr", "julie.martin@exemple.fr"]);
    expect(b.marques).toEqual([{ id: "id-1", etat: { email_envoye: true, accuse_envoye: true } }]);
  });

  it("stocke l'empreinte de l'IP, jamais l'IP en clair", async () => {
    const b = fausseBase();
    await traiterDemande(brut(), deps({ base: b.base }));
    const ligne = b.lignes[0];
    expect(ligne.ip_empreinte).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(ligne)).not.toContain("203.0.113.7");
  });

  it("enregistre les champs normalisés, sans le champ piège ni les horodatages", async () => {
    const b = fausseBase();
    await traiterDemande(brut(), deps({ base: b.base }));
    expect(b.lignes[0]).toMatchObject({
      langue: "fr",
      prenoms: "Julie & Thomas",
      telephone: "+33612345678",
      type_evenement: "mariage",
      date_evenement: "2027-06-12",
      invites: 120,
    });
    expect(b.lignes[0]).not.toHaveProperty("site_web");
    expect(b.lignes[0]).not.toHaveProperty("ouvert_le");
  });
});

describe("traiterDemande — validation", () => {
  it("renvoie les erreurs par champ et les valeurs saisies, sans rien écrire ni envoyer", async () => {
    const b = fausseBase();
    const e = fauxEnvoi();
    const r = await traiterDemande(brut({ email: "x" }), deps({ base: b.base, envoi: e.envoi }));
    expect(r.statut).toBe("erreur");
    if (r.statut !== "erreur") return;
    expect(r.erreurs.email).toBeDefined();
    expect(r.valeurs.prenoms).toBe("Julie & Thomas");
    expect(r.valeurs).not.toHaveProperty("site_web");
    expect(b.lignes).toHaveLength(0);
    expect(e.envoyes).toHaveLength(0);
  });

  it("répond dans la langue du formulaire", async () => {
    const r = await traiterDemande(brut({ email: "x", langue: "en" }), deps());
    expect(r.statut === "erreur" && r.message).toMatch(/check/i);
  });
});

describe("traiterDemande — robots", () => {
  it.each([
    ["champ piège rempli", { site_web: "https://spam.example" }],
    ["envoi en moins de 3 s", { ouvert_le: "1000000", envoye_le: "1001000" }],
  ])("%s : succès silencieux, rien n'est écrit ni envoyé", async (_, modifs) => {
    const b = fausseBase();
    const e = fauxEnvoi();
    const r = await traiterDemande(brut(modifs), deps({ base: b.base, envoi: e.envoi }));
    expect(r).toEqual({ statut: "succes" });
    expect(b.base.compterRecentes).not.toHaveBeenCalled();
    expect(b.lignes).toHaveLength(0);
    expect(e.envoyes).toHaveLength(0);
  });
});

describe("traiterDemande — limitation par IP", () => {
  it("bloque au-delà de la limite, avec un message qui donne le téléphone", async () => {
    const b = fausseBase({ recentes: LIMITE.maximum });
    const e = fauxEnvoi();
    const r = await traiterDemande(brut(), deps({ base: b.base, envoi: e.envoi }));
    expect(r.statut).toBe("erreur");
    expect(r.statut === "erreur" && r.message).toContain("06 76 40 37 76");
    expect(b.lignes).toHaveLength(0);
    expect(e.envoyes).toHaveLength(0);
  });

  it("compte sur la fenêtre d'une heure, par empreinte", async () => {
    const b = fausseBase();
    await traiterDemande(brut(), deps({ base: b.base }));
    expect(b.base.compterRecentes).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f]{64}$/), new Date("2026-10-15T07:00:00Z"));
  });

  it("laisse passer si le comptage échoue (base indisponible), en le journalisant", async () => {
    const b = fausseBase({ panneComptage: true });
    const d = deps({ base: b.base });
    const r = await traiterDemande(brut(), d);
    expect(r).toEqual({ statut: "succes" });
    expect(d.journal.avertir).toHaveBeenCalled();
  });

  it("sans secret IP : pas d'empreinte, pas de limite, mais la demande passe", async () => {
    const b = fausseBase();
    const r = await traiterDemande(brut(), deps({ base: b.base, secretIp: null }));
    expect(r).toEqual({ statut: "succes" });
    expect(b.base.compterRecentes).not.toHaveBeenCalled();
    expect(b.lignes[0].ip_empreinte).toBeNull();
  });
});

describe("traiterDemande — pannes (aucune demande perdue)", () => {
  it("si l'insertion échoue, l'email part quand même : succès", async () => {
    const b = fausseBase({ panneInsertion: true });
    const e = fauxEnvoi();
    const d = deps({ base: b.base, envoi: e.envoi });
    const r = await traiterDemande(brut(), d);
    expect(r).toEqual({ statut: "succes" });
    expect(e.envoyes.map((x) => x.to)).toEqual(["cedric@spiceevents.fr", "julie.martin@exemple.fr"]);
    expect(b.base.marquer).not.toHaveBeenCalled();
    expect(d.journal.erreur).toHaveBeenCalled();
  });

  it("si l'email échoue mais que la demande est en base : succès, booléens à faux", async () => {
    const b = fausseBase();
    const e = fauxEnvoi({ panne: true });
    const r = await traiterDemande(brut(), deps({ base: b.base, envoi: e.envoi }));
    expect(r).toEqual({ statut: "succes" });
    expect(b.marques).toEqual([{ id: "id-1", etat: { email_envoye: false, accuse_envoye: false } }]);
  });

  it("si seul l'accusé échoue : succès, accuse_envoye à faux", async () => {
    const b = fausseBase();
    const e = fauxEnvoi({ panneAccuse: true });
    const r = await traiterDemande(brut(), deps({ base: b.base, envoi: e.envoi }));
    expect(r).toEqual({ statut: "succes" });
    expect(b.marques).toEqual([{ id: "id-1", etat: { email_envoye: true, accuse_envoye: false } }]);
  });

  it("si ni la base ni l'email ne fonctionnent : erreur claire avec le téléphone, pas d'accusé", async () => {
    const b = fausseBase({ panneInsertion: true });
    const e = fauxEnvoi({ panne: true });
    const d = deps({ base: b.base, envoi: e.envoi });
    const r = await traiterDemande(brut(), d);
    expect(r.statut).toBe("erreur");
    if (r.statut !== "erreur") return;
    expect(r.message).toContain("06 76 40 37 76");
    expect(r.valeurs.message).toBe("Bonjour !");
    expect(e.envoi.envoyer).toHaveBeenCalledTimes(1);
    expect(d.journal.erreur).toHaveBeenCalled();
  });

  it("sans email configuré, la demande en base suffit : succès", async () => {
    const b = fausseBase();
    const r = await traiterDemande(brut(), deps({ base: b.base, envoi: null }));
    expect(r).toEqual({ statut: "succes" });
    expect(b.marques).toEqual([{ id: "id-1", etat: { email_envoye: false, accuse_envoye: false } }]);
  });

  it("sans base configurée, l'email suffit : succès", async () => {
    const e = fauxEnvoi();
    const r = await traiterDemande(brut(), deps({ base: null, envoi: e.envoi }));
    expect(r).toEqual({ statut: "succes" });
    expect(e.envoyes).toHaveLength(2);
  });
});

describe("traiterDemande — sans configuration", () => {
  it("en développement : journalise la demande et répond succès", async () => {
    const d = deps({ production: false, base: null, envoi: null });
    const r = await traiterDemande(brut(), d);
    expect(r).toEqual({ statut: "succes" });
    expect(d.journal.info).toHaveBeenCalledWith(expect.stringContaining("développement"), expect.objectContaining({ prenoms: "Julie & Thomas" }));
  });

  it("en production : erreur avec le téléphone (jamais un faux succès)", async () => {
    const d = deps({ production: true, base: null, envoi: null });
    const r = await traiterDemande(brut(), d);
    expect(r.statut).toBe("erreur");
    expect(r.statut === "erreur" && r.message).toContain("06 76 40 37 76");
    expect(d.journal.erreur).toHaveBeenCalled();
  });
});
