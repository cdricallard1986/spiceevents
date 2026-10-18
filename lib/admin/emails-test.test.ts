import { describe, expect, it, vi } from "vitest";
import { emailAccuse, emailNotification } from "@/lib/contact/email";
import {
  MESSAGES_ENVOI,
  creerLimiteur,
  demandeFictive,
  emailDeTest,
  schemaEnvoiTest,
  traiterEnvoiTest,
  type DependancesEnvoiTest,
} from "./emails-test";

const CONFIG = { destinataire: "cedric@spiceevents.fr", expediteur: "Spice Events <contact@spiceevents.fr>" };
const MAINTENANT = new Date("2026-10-18T10:00:00Z");
const MOI = "moi@exemple.fr";

describe("emailDeTest", () => {
  it("part uniquement vers le compte connecté, objet préfixé [TEST]", () => {
    for (const modele of ["notification", "accuse"] as const) {
      for (const langue of ["fr", "en"] as const) {
        const email = emailDeTest({ modele, langue }, MOI, CONFIG, MAINTENANT);
        expect(email.to).toBe(MOI);
        expect(email.subject.startsWith("[TEST] ")).toBe(true);
        expect(email.from).toBe(CONFIG.expediteur);
      }
    }
  });

  it("réutilise les vrais modèles du formulaire (même corps, seuls l'objet et les adresses changent)", () => {
    const demande = demandeFictive("en", MAINTENANT);
    const reel = emailAccuse(demande, CONFIG);
    const test = emailDeTest({ modele: "accuse", langue: "en" }, MOI, CONFIG, MAINTENANT);
    expect(test.html).toBe(reel.html);
    expect(test.text).toBe(reel.text);
    expect(test.subject).toBe(`[TEST] ${reel.subject}`);
    expect(test.replyTo).toBe(CONFIG.destinataire);

    const notif = emailDeTest({ modele: "notification", langue: "fr" }, MOI, CONFIG, MAINTENANT);
    expect(notif.html).toBe(emailNotification(demandeFictive("fr", MAINTENANT), CONFIG).html);
    // « Répondre » ne vise pas le couple fictif.
    expect(notif.replyTo).toBe(MOI);
  });

  it("la demande fictive est clairement marquée, dans les deux langues", () => {
    expect(demandeFictive("fr", MAINTENANT).prenoms).toContain("(test)");
    expect(demandeFictive("en", MAINTENANT).prenoms).toContain("(test)");
    expect(demandeFictive("fr", MAINTENANT).message).toContain("DEMANDE FICTIVE");
    expect(demandeFictive("fr", MAINTENANT).date).toBe("2027-10-18");
    expect(emailDeTest({ modele: "notification", langue: "fr" }, MOI, CONFIG, MAINTENANT).html).toContain("DEMANDE FICTIVE");
    expect(emailDeTest({ modele: "accuse", langue: "en" }, MOI, CONFIG, MAINTENANT).html).toContain("Hello Camille and Alex (test)");
  });
});

describe("schemaEnvoiTest", () => {
  it("n'accepte que le modèle et la langue — surtout pas une adresse", () => {
    expect(schemaEnvoiTest.safeParse({ modele: "accuse", langue: "en" }).success).toBe(true);
    expect(schemaEnvoiTest.safeParse({ modele: "accuse", langue: "en", to: "x@y.z" }).success).toBe(false);
    expect(schemaEnvoiTest.safeParse({ modele: "facture", langue: "fr" }).success).toBe(false);
    expect(schemaEnvoiTest.safeParse({ modele: "accuse", langue: "de" }).success).toBe(false);
    expect(schemaEnvoiTest.safeParse(null).success).toBe(false);
  });
});

describe("creerLimiteur", () => {
  it("un envoi toutes les 10 s par compte", () => {
    const l = creerLimiteur(10_000);
    expect(l.reserver("a", 0)).toEqual({ autorise: true });
    expect(l.reserver("a", 4_000)).toEqual({ autorise: false, attenteMs: 6_000 });
    expect(l.reserver("b", 4_000)).toEqual({ autorise: true });
    expect(l.reserver("a", 10_000)).toEqual({ autorise: true });
  });
});

describe("traiterEnvoiTest", () => {
  function deps(surcharge: Partial<DependancesEnvoiTest> = {}): DependancesEnvoiTest {
    return {
      destinataire: MOI,
      cle: "u1",
      expediteur: { config: CONFIG, envoyer: vi.fn(async () => ({ ok: true as const, id: "re_123" })) },
      limiteur: creerLimiteur(),
      maintenant: MAINTENANT,
      ...surcharge,
    };
  }

  it("envoie et indique l'adresse et l'identifiant Resend", async () => {
    const d = deps();
    const etat = await traiterEnvoiTest({ modele: "notification", langue: "fr" }, d);
    expect(etat).toEqual({ statut: "succes", message: `Email de test envoyé à ${MOI} (identifiant Resend : re_123).` });
    expect(d.expediteur!.envoyer).toHaveBeenCalledWith(expect.objectContaining({ to: MOI }));
  });

  it("refuse une entrée invalide sans rien envoyer", async () => {
    const d = deps();
    expect(await traiterEnvoiTest({ modele: "notification", langue: "fr", destinataire: "pirate@x.fr" }, d)).toEqual({
      statut: "erreur",
      message: MESSAGES_ENVOI.invalide,
    });
    expect(d.expediteur!.envoyer).not.toHaveBeenCalled();
  });

  it("explique que Resend n'est pas configuré", async () => {
    const etat = await traiterEnvoiTest({ modele: "accuse", langue: "en" }, deps({ expediteur: null }));
    expect(etat).toEqual({ statut: "erreur", message: "La variable resend_api_key est absente de cet environnement Vercel : aucun email ne peut partir." });
  });

  it("affiche le nom et le message de l'erreur Resend", async () => {
    const d = deps({
      expediteur: { config: CONFIG, envoyer: async () => ({ ok: false as const, nom: "validation_error", message: "The domain is not verified." }) },
    });
    expect(await traiterEnvoiTest({ modele: "accuse", langue: "fr" }, d)).toEqual({
      statut: "erreur",
      message: "Resend a refusé l'envoi — validation_error : The domain is not verified.",
    });
  });

  it("sans email sur le compte : aucun envoi", async () => {
    const d = deps({ destinataire: undefined });
    expect((await traiterEnvoiTest({ modele: "accuse", langue: "fr" }, d)).statut).toBe("erreur");
    expect(d.expediteur!.envoyer).not.toHaveBeenCalled();
  });

  it("un second envoi dans les 10 s est refusé", async () => {
    const d = deps();
    await traiterEnvoiTest({ modele: "accuse", langue: "fr" }, d);
    const second = await traiterEnvoiTest({ modele: "accuse", langue: "fr" }, { ...d, maintenant: new Date(MAINTENANT.getTime() + 3_000) });
    expect(second).toEqual({ statut: "erreur", message: "Un envoi toutes les 10 secondes au plus : réessayez dans 7 s." });
    expect(d.expediteur!.envoyer).toHaveBeenCalledTimes(1);
  });
});
