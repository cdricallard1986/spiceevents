import { describe, expect, it } from "vitest";
import {
  DELAI_MINIMUM_MS,
  LIMITES,
  dateDuJourParis,
  estRobot,
  lireFormulaire,
  normaliserTelephone,
  validerDemande,
} from "./schema";

// « Maintenant » fixe : 15 octobre 2026, 10 h à Paris.
const MAINTENANT = new Date("2026-10-15T08:00:00Z");

/** Une demande valide, telle qu'envoyée par le formulaire (tout en texte). */
function brut(modifs: Record<string, string> = {}): Record<string, string> {
  return {
    prenoms: "Julie & Thomas",
    nom: "Martin",
    email: "julie.martin@exemple.fr",
    telephone: "06 12 34 56 78",
    type: "mariage",
    date: "2027-06-12",
    lieu: "Château de Vaux-le-Vicomte",
    invites: "120",
    message: "Bonjour, nous cherchons un DJ pour notre mariage.",
    langue: "fr",
    site_web: "",
    ouvert_le: "1760515200000",
    envoye_le: "1760515260000",
    ...modifs,
  };
}

function erreurs(modifs: Record<string, string>) {
  const r = validerDemande(brut(modifs), MAINTENANT);
  if (r.ok) throw new Error("La demande aurait dû être refusée");
  return r.erreurs;
}

describe("validerDemande", () => {
  it("accepte une demande complète et normalise les valeurs", () => {
    const r = validerDemande(brut({ email: "  julie.martin@exemple.fr ", prenoms: "  Julie   &  Thomas " }), MAINTENANT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.demande).toMatchObject({
      prenoms: "Julie & Thomas",
      nom: "Martin",
      email: "julie.martin@exemple.fr",
      telephone: "+33612345678",
      type: "mariage",
      date: "2027-06-12",
      lieu: "Château de Vaux-le-Vicomte",
      invites: 120,
      langue: "fr",
      ouvert_le: 1760515200000,
      envoye_le: 1760515260000,
    });
  });

  it("rend facultatifs la date, le lieu et le nombre d'invités", () => {
    const r = validerDemande(brut({ date: "", lieu: "  ", invites: "" }), MAINTENANT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.demande.date).toBeNull();
    expect(r.demande.lieu).toBeNull();
    expect(r.demande.invites).toBeNull();
  });

  it("exige prénoms, nom, email, téléphone, type et message", () => {
    const e = erreurs({ prenoms: "", nom: " ", email: "", telephone: "", type: "", message: "  " });
    expect(Object.keys(e).sort()).toEqual(["email", "message", "nom", "prenoms", "telephone", "type"]);
  });

  it("refuse un email invalide", () => {
    expect(erreurs({ email: "julie@" }).email).toBeDefined();
    expect(erreurs({ email: "pas un email" }).email).toBeDefined();
  });

  it("refuse un type d'événement inconnu", () => {
    expect(erreurs({ type: "concert" }).type).toBeDefined();
  });

  it.each(["mariage", "prive", "entreprise", "autre"])("accepte le type %s", (type) => {
    expect(validerDemande(brut({ type }), MAINTENANT).ok).toBe(true);
  });

  it("refuse une date passée, accepte aujourd'hui", () => {
    expect(erreurs({ date: "2026-10-14" }).date).toBeDefined();
    expect(validerDemande(brut({ date: "2026-10-15" }), MAINTENANT).ok).toBe(true);
  });

  it("refuse une date qui n'existe pas ou mal formée", () => {
    expect(erreurs({ date: "2027-02-30" }).date).toBeDefined();
    expect(erreurs({ date: "12/06/2027" }).date).toBeDefined();
  });

  it("exige un nombre d'invités entier et raisonnable", () => {
    expect(erreurs({ invites: "0" }).invites).toBeDefined();
    expect(erreurs({ invites: "12.5" }).invites).toBeDefined();
    expect(erreurs({ invites: "beaucoup" }).invites).toBeDefined();
    expect(erreurs({ invites: String(LIMITES.invitesMax + 1) }).invites).toBeDefined();
    expect(validerDemande(brut({ invites: String(LIMITES.invitesMax) }), MAINTENANT).ok).toBe(true);
  });

  it("limite la longueur du message et des champs courts", () => {
    expect(erreurs({ message: "a".repeat(LIMITES.message + 1) }).message).toBeDefined();
    expect(validerDemande(brut({ message: "a".repeat(LIMITES.message) }), MAINTENANT).ok).toBe(true);
    expect(erreurs({ prenoms: "a".repeat(LIMITES.nom + 1) }).prenoms).toBeDefined();
    expect(erreurs({ lieu: "a".repeat(LIMITES.lieu + 1) }).lieu).toBeDefined();
  });

  it("refuse un nom qui contient une adresse web ou un lien", () => {
    expect(erreurs({ prenoms: "Gagnez sur arnaque.com" }).prenoms).toBeDefined();
    expect(erreurs({ prenoms: '<a href="https://x.io">Cliquez</a>' }).prenoms).toBeDefined();
    expect(erreurs({ nom: "http://x" }).nom).toBeDefined();
  });

  it("accepte les prénoms composés, apostrophes et accents", () => {
    const r = validerDemande(brut({ prenoms: "Anne-Sophie & Jean-Pierre", nom: "O'Connor-Lefèvre" }), MAINTENANT);
    expect(r.ok).toBe(true);
  });

  it("remplace les retours à la ligne des champs courts par des espaces", () => {
    const r = validerDemande(brut({ lieu: "Domaine\r\nde la Forêt" }), MAINTENANT);
    expect(r.ok && r.demande.lieu).toBe("Domaine de la Forêt");
  });

  it("conserve les retours à la ligne du message (normalisés en \\n)", () => {
    const r = validerDemande(brut({ message: "Ligne 1\r\nLigne 2" }), MAINTENANT);
    expect(r.ok && r.demande.message).toBe("Ligne 1\nLigne 2");
  });

  it("exige les horodatages du formulaire", () => {
    expect(erreurs({ ouvert_le: "" }).formulaire).toBeDefined();
    expect(erreurs({ envoye_le: "abc" }).formulaire).toBeDefined();
  });

  it("donne les messages d'erreur dans la langue du formulaire", () => {
    const fr = erreurs({ email: "x" }).email;
    const en = erreurs({ email: "x", langue: "en" }).email;
    expect(fr).toMatch(/adresse/i);
    expect(en).toMatch(/address/i);
    expect(fr).not.toBe(en);
  });

  it("se rabat sur le français pour une langue inconnue", () => {
    const r = validerDemande(brut({ langue: "de" }), MAINTENANT);
    expect(r.ok && r.demande.langue).toBe("fr");
  });

  it("n'échoue pas sur le champ piège rempli (c'est estRobot qui décide)", () => {
    const r = validerDemande(brut({ site_web: "https://spam.example" }), MAINTENANT);
    expect(r.ok).toBe(true);
  });

  it("renvoie la langue même en cas d'erreur", () => {
    const r = validerDemande(brut({ email: "", langue: "en" }), MAINTENANT);
    expect(r.ok).toBe(false);
    expect(r.langue).toBe("en");
  });
});

describe("estRobot", () => {
  function demande(modifs: Record<string, string>) {
    const r = validerDemande(brut(modifs), MAINTENANT);
    if (!r.ok) throw new Error("demande invalide");
    return r.demande;
  }

  it("laisse passer un humain", () => {
    expect(estRobot(demande({}))).toBe(false);
  });

  it("repère le champ piège rempli", () => {
    expect(estRobot(demande({ site_web: "https://spam.example" }))).toBe(true);
    expect(estRobot(demande({ site_web: "   x " }))).toBe(true);
  });

  it(`repère un envoi en moins de ${DELAI_MINIMUM_MS / 1000} s`, () => {
    expect(estRobot(demande({ ouvert_le: "1000000", envoye_le: String(1000000 + DELAI_MINIMUM_MS - 1) }))).toBe(true);
    expect(estRobot(demande({ ouvert_le: "1000000", envoye_le: String(1000000 + DELAI_MINIMUM_MS) }))).toBe(false);
  });

  it("repère un horodatage d'envoi antérieur à l'ouverture", () => {
    expect(estRobot(demande({ ouvert_le: "2000000", envoye_le: "1000000" }))).toBe(true);
  });
});

describe("normaliserTelephone", () => {
  it.each([
    ["06 12 34 56 78", "+33612345678"],
    ["06.12.34.56.78", "+33612345678"],
    ["01-23-45-67-89", "+33123456789"],
    ["+33 6 12 34 56 78", "+33612345678"],
    ["+33 (0)6 12 34 56 78", "+33612345678"],
    ["0033612345678", "+33612345678"],
    ["+44 20 7946 0958", "+442079460958"],
    ["+1 (415) 555-2671", "+14155552671"],
  ])("%s → %s", (saisie, attendu) => {
    expect(normaliserTelephone(saisie)).toBe(attendu);
  });

  it.each(["", "12345", "06 12 34", "+0 6 12 34 56 78", "+33 6 12 34", "+33 6 12 34 56 78 90 12 34 56", "tel:0612345678", "06 12 AB 56 78"])(
    "refuse « %s »",
    (saisie) => {
      expect(normaliserTelephone(saisie)).toBeNull();
    },
  );
});

describe("dateDuJourParis", () => {
  it("donne la date à Paris, pas en UTC", () => {
    // 23 h 30 UTC le 14 = 1 h 30 à Paris le 15 (heure d'été).
    expect(dateDuJourParis(new Date("2026-10-14T23:30:00Z"))).toBe("2026-10-15");
    expect(dateDuJourParis(new Date("2026-10-15T08:00:00Z"))).toBe("2026-10-15");
  });
});

describe("lireFormulaire", () => {
  it("ne garde que les champs connus, en texte", () => {
    const fd = new FormData();
    fd.set("prenoms", "Julie");
    fd.set("inconnu", "x");
    fd.set("$ACTION_ID_abc", "");
    const lu = lireFormulaire(fd);
    expect(lu.prenoms).toBe("Julie");
    expect(lu).not.toHaveProperty("inconnu");
    expect(lu).not.toHaveProperty("$ACTION_ID_abc");
    expect(lu.email).toBe("");
  });

  it("ignore les fichiers envoyés à la place d'un texte", () => {
    const fd = new FormData();
    fd.set("message", new Blob(["x"]), "x.txt");
    expect(lireFormulaire(fd).message).toBe("");
  });
});
