import { describe, expect, it } from "vitest";
import {
  FILTRES_PAR_DEFAUT,
  FILTRES_STATUT,
  appliquerSuivi,
  compterParStatut,
  filtrerDemandes,
  filtresActifs,
  formaterDateEvenement,
  formaterInvites,
  formaterReception,
  formaterReceptionCourte,
  lienAppel,
  lienEcrire,
  lienWhatsApp,
  noteTropLongue,
  paginer,
  sansEmail,
  telephoneAffiche,
  trierDemandes,
} from "./admin";
import { COULEURS_STATUT, LIBELLES_FILTRE, LIBELLES_STATUT, STATUTS, estStatut } from "./constantes";
import type { Demande } from "./types";

function demande(id: string, champs: Partial<Demande> = {}): Demande {
  return {
    id,
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z",
    langue: "fr",
    prenoms: "Juliette",
    nom: "Martin",
    email: "juliette@example.com",
    telephone: "+33612345678",
    type_evenement: "mariage",
    date_evenement: "2027-06-12",
    lieu: "Château de Chantilly",
    invites: 120,
    message: "Bonjour",
    email_envoye: true,
    accuse_envoye: true,
    statut: "nouvelle",
    note_interne: null,
    ...champs,
  };
}

const LISTE = [
  demande("a", { created_at: "2026-10-01T10:00:00Z", prenoms: "Hélène", nom: "Durand", lieu: "Paris", statut: "rappelee" }),
  demande("b", { created_at: "2026-10-15T08:00:00Z", prenoms: "Pierre", nom: "Leroy", email: "pierre@exemple.fr", lieu: null, email_envoye: false }),
  demande("c", { created_at: "2026-10-10T08:00:00Z", statut: "signee" }),
];

describe("statuts", () => {
  it("chaque statut a un libellé, un filtre et une couleur ; l'ordre suit le parcours commercial", () => {
    expect(STATUTS).toEqual(["nouvelle", "rappelee", "devis_envoye", "signee", "perdue"]);
    for (const s of STATUTS) {
      expect(LIBELLES_STATUT[s]).toBeTruthy();
      expect(COULEURS_STATUT[s]).toMatch(/border-/);
    }
    expect(FILTRES_STATUT.map((s) => LIBELLES_FILTRE[s])).toEqual(["Nouvelles", "Rappelées", "Devis envoyé", "Signées", "Perdues", "Toutes"]);
    expect(estStatut("signee")).toBe(true);
    expect(estStatut("archivee")).toBe(false);
  });
});

describe("liste", () => {
  it("les plus récentes en tête", () => {
    expect(trierDemandes(LISTE).map((d) => d.id)).toEqual(["b", "c", "a"]);
  });

  it("filtre par statut et recherche (prénoms, nom, email, lieu ; sans accents ni casse)", () => {
    const ids = (f: Partial<typeof FILTRES_PAR_DEFAUT>) => filtrerDemandes(LISTE, { ...FILTRES_PAR_DEFAUT, ...f }).map((d) => d.id);
    expect(ids({})).toEqual(["b", "c", "a"]);
    expect(ids({ statut: "nouvelle" })).toEqual(["b"]);
    expect(ids({ statut: "perdue" })).toEqual([]);
    expect(ids({ recherche: "helene" })).toEqual(["a"]);
    expect(ids({ recherche: "DURAND" })).toEqual(["a"]);
    expect(ids({ recherche: "pierre leroy" })).toEqual(["b"]);
    expect(ids({ recherche: "leroy pierre" })).toEqual(["b"]);
    expect(ids({ recherche: "@exemple.fr" })).toEqual(["b"]);
    expect(ids({ recherche: "chantilly" })).toEqual(["c"]);
    expect(ids({ recherche: "  " })).toEqual(["b", "c", "a"]);
    expect(ids({ statut: "rappelee", recherche: "martin" })).toEqual([]);
  });

  it("filtres actifs", () => {
    expect(filtresActifs(FILTRES_PAR_DEFAUT)).toBe(false);
    expect(filtresActifs({ statut: "signee", recherche: "" })).toBe(true);
    expect(filtresActifs({ statut: "toutes", recherche: " x " })).toBe(true);
  });

  it("compteurs par statut et au total, en tenant compte de la recherche", () => {
    expect(compterParStatut(LISTE)).toEqual({ nouvelle: 1, rappelee: 1, devis_envoye: 0, signee: 1, perdue: 0, toutes: 3 });
    expect(compterParStatut(LISTE, "martin")).toEqual({ nouvelle: 0, rappelee: 0, devis_envoye: 0, signee: 1, perdue: 0, toutes: 1 });
    expect(compterParStatut([])).toEqual({ nouvelle: 0, rappelee: 0, devis_envoye: 0, signee: 0, perdue: 0, toutes: 0 });
  });

  it("repère les demandes dont l'email n'est pas parti", () => {
    expect(sansEmail(LISTE).map((d) => d.id)).toEqual(["b"]);
  });

  it("pagine par 50, en ramenant la page dans les bornes", () => {
    const n = Array.from({ length: 120 }, (_, i) => i);
    expect(paginer(n, 1)).toMatchObject({ page: 1, pages: 3, total: 120 });
    expect(paginer(n, 1).elements).toHaveLength(50);
    expect(paginer(n, 3).elements).toEqual(n.slice(100));
    expect(paginer(n, 9).page).toBe(3);
    expect(paginer(n, 0).page).toBe(1);
    expect(paginer(n, Number.NaN).page).toBe(1);
    expect(paginer([], 1)).toEqual({ elements: [], page: 1, pages: 1, total: 0 });
    expect(paginer(n.slice(0, 50), 2)).toMatchObject({ page: 1, pages: 1 });
  });

  it("intègre le suivi enregistré à la bonne demande seulement", () => {
    const maj = appliquerSuivi(LISTE, { id: "b", statut: "devis_envoye", note_interne: "Devis le 20", updated_at: "2026-10-18T09:00:00Z" });
    expect(maj.find((d) => d.id === "b")).toMatchObject({ statut: "devis_envoye", note_interne: "Devis le 20", updated_at: "2026-10-18T09:00:00Z", email: "pierre@exemple.fr" });
    expect(maj.find((d) => d.id === "a")).toEqual(LISTE[0]);
  });
});

describe("liens de contact", () => {
  it("Appeler : tel: avec les seuls chiffres", () => {
    expect(lienAppel("+33612345678")).toBe("tel:+33612345678");
    expect(lienAppel("06 12 34 56 78")).toBe("tel:0612345678");
    expect(lienAppel("+44 20 7946 0958")).toBe("tel:+442079460958");
    expect(lienAppel("javascript:alert(1)")).toBeNull();
    expect(lienAppel("")).toBeNull();
  });

  it("WhatsApp : portables français seulement (06 / 07), convertis en +33", () => {
    expect(lienWhatsApp("+33612345678")).toBe("https://wa.me/33612345678");
    expect(lienWhatsApp("+33712345678")).toBe("https://wa.me/33712345678");
    expect(lienWhatsApp("06 12 34 56 78")).toBe("https://wa.me/33612345678");
    expect(lienWhatsApp("07.12.34.56.78")).toBe("https://wa.me/33712345678");
    expect(lienWhatsApp("0033 6 12 34 56 78")).toBe("https://wa.me/33612345678");
    expect(lienWhatsApp("+33 (0)6 12 34 56 78")).toBe("https://wa.me/33612345678");
    // Fixe, numéro spécial, étranger : rien ne dit qu'il a WhatsApp.
    expect(lienWhatsApp("+33142345678")).toBeNull();
    expect(lienWhatsApp("0142345678")).toBeNull();
    expect(lienWhatsApp("+442079460958")).toBeNull();
    expect(lienWhatsApp("+3361234567")).toBeNull();
    expect(lienWhatsApp("n'importe quoi")).toBeNull();
  });

  it("Écrire : mailto: avec l'objet dans la langue de la demande ; adresse douteuse → pas de lien", () => {
    expect(lienEcrire("juliette@example.com")).toBe(`mailto:juliette@example.com?subject=${encodeURIComponent("Votre demande — Spice Events")}`);
    expect(lienEcrire("juliette@example.com", "en")).toBe(`mailto:juliette@example.com?subject=${encodeURIComponent("Your enquiry — Spice Events")}`);
    expect(decodeURIComponent(lienEcrire("a@b.fr")!.split("subject=")[1])).toBe("Votre demande — Spice Events");
    expect(lienEcrire("a@b.fr?cc=pirate@x.com")).toBeNull();
    expect(lienEcrire("a@b.fr&body=x")).toBeNull();
    expect(lienEcrire("pas une adresse")).toBeNull();
    expect(lienEcrire("javascript:alert(1)//@x.fr")).toBeNull();
  });

  it("téléphone affiché au format français", () => {
    expect(telephoneAffiche("+33612345678")).toBe("06 12 34 56 78");
    expect(telephoneAffiche("+442079460958")).toBe("+442079460958");
  });
});

describe("dates et nombres en français", () => {
  it("réception à l'heure de Paris (heure d'été et d'hiver)", () => {
    expect(formaterReception("2026-10-18T14:05:00Z")).toBe("18 octobre 2026 à 16:05");
    expect(formaterReception("2026-12-31T23:30:00Z")).toBe("1 janvier 2027 à 00:30");
    expect(formaterReception("pas une date")).toBe("—");
    expect(formaterReceptionCourte("2026-10-18T14:05:00Z")).toBe("18 oct. 2026");
  });

  it("date de l'événement, avec ou sans le jour de la semaine", () => {
    expect(formaterDateEvenement("2027-06-12")).toBe("samedi 12 juin 2027");
    expect(formaterDateEvenement("2027-06-12", false)).toBe("12 juin 2027");
    expect(formaterDateEvenement(null)).toBeNull();
    expect(formaterDateEvenement("2027-02-30")).toBeNull();
    expect(formaterDateEvenement("12/06/2027")).toBeNull();
  });

  it("invités", () => {
    expect(formaterInvites(1)).toBe("1 invité");
    expect(formaterInvites(120)).toBe("120 invités");
    expect(formaterInvites(1500)).toMatch(/^1\s500 invités$/);
    expect(formaterInvites(null)).toBeNull();
  });

  it("note trop longue (en caractères, comme Postgres)", () => {
    expect(noteTropLongue("a".repeat(5000))).toBe(false);
    expect(noteTropLongue("a".repeat(5001))).toBe(true);
    expect(noteTropLongue("🎉".repeat(5000))).toBe(false);
    expect(noteTropLongue(` ${"a".repeat(5000)} `)).toBe(false);
  });
});
