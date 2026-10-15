import { describe, expect, it } from "vitest";
import { echapper, emailAccuse, emailNotification, formaterDate, formaterTelephone } from "./email";
import type { Demande } from "./schema";

const DEMANDE: Demande = {
  prenoms: "Julie & Thomas",
  nom: "Martin",
  email: "julie.martin@exemple.fr",
  telephone: "+33612345678",
  type: "mariage",
  date: "2027-06-12",
  lieu: "Château de Vaux-le-Vicomte",
  invites: 120,
  message: "Bonjour,\nnous cherchons un DJ.",
  langue: "fr",
  site_web: "",
  ouvert_le: 0,
  envoye_le: 60000,
};

const CONFIG = {
  destinataire: "cedric@spiceevents.fr",
  expediteur: "Spice Events <contact@spiceevents.fr>",
};

const PIEGE = '<a href="https://arnaque.example/connexion">Confirmez votre compte</a>';

/** Tous les liens présents dans un HTML. */
function liens(html: string): string[] {
  return [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
}

describe("echapper", () => {
  it("neutralise les caractères HTML", () => {
    expect(echapper(`<b>"Tom" & 'Jerry'</b>`)).toBe("&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;");
  });

  it("transforme un lien saisi en texte inoffensif", () => {
    const e = echapper(PIEGE);
    expect(e).not.toContain("<a");
    expect(e).not.toContain('href="');
    expect(e).toBe(
      "&lt;a href=&quot;https://arnaque.example/connexion&quot;&gt;Confirmez votre compte&lt;/a&gt;",
    );
  });

  it("échappe l'esperluette en premier (pas de double échappement raté)", () => {
    expect(echapper("&lt;")).toBe("&amp;lt;");
  });

  it("laisse le texte ordinaire intact", () => {
    expect(echapper("Château de l'Étang")).toBe("Château de l&#39;Étang");
  });
});

describe("formaterDate / formaterTelephone", () => {
  it("écrit la date en toutes lettres dans la langue", () => {
    expect(formaterDate("2027-06-12", "fr")).toBe("samedi 12 juin 2027");
    expect(formaterDate("2027-06-12", "en")).toBe("Saturday 12 June 2027");
  });

  it("affiche un numéro français par paires", () => {
    expect(formaterTelephone("+33612345678")).toBe("06 12 34 56 78");
    expect(formaterTelephone("+442079460958")).toBe("+442079460958");
  });
});

describe("emailNotification (à Cédric)", () => {
  const e = emailNotification(DEMANDE, CONFIG);

  it("part de l'expéditeur vers Cédric, réponse directe au couple", () => {
    expect(e.from).toBe(CONFIG.expediteur);
    expect(e.to).toBe(CONFIG.destinataire);
    expect(e.replyTo).toBe(DEMANDE.email);
  });

  it("contient toutes les informations, en HTML et en texte", () => {
    for (const contenu of [e.html, e.text]) {
      expect(contenu).toContain("Martin");
      expect(contenu).toContain("julie.martin@exemple.fr");
      expect(contenu).toContain("06 12 34 56 78");
      expect(contenu).toContain("Mariage");
      expect(contenu).toContain("samedi 12 juin 2027");
      expect(contenu).toContain("Vaux-le-Vicomte");
      expect(contenu).toContain("120");
      expect(contenu).toContain("nous cherchons un DJ");
    }
    expect(e.html).toContain("Julie &amp; Thomas");
    expect(e.text).toContain("Julie & Thomas");
  });

  it("résume la demande dans l'objet", () => {
    expect(e.subject).toContain("Mariage");
    expect(e.subject).toContain("Julie & Thomas");
    expect(e.subject).toContain("12/06/2027");
  });

  it("signale la langue du couple", () => {
    expect(emailNotification({ ...DEMANDE, langue: "en" }, CONFIG).text).toMatch(/anglais/i);
  });

  it("indique les champs facultatifs non renseignés", () => {
    const vide = emailNotification({ ...DEMANDE, date: null, lieu: null, invites: null }, CONFIG);
    expect(vide.text).toMatch(/Date\s*:\s*non précisée/);
    expect(vide.subject).not.toContain("null");
  });

  it("échappe tout texte saisi et ne crée aucun lien à partir d'une saisie", () => {
    const piege = emailNotification(
      { ...DEMANDE, nom: PIEGE, lieu: PIEGE, message: `${PIEGE}\n<script>alert(1)</script>` },
      CONFIG,
    );
    expect(piege.html).not.toContain("<a href=\"https://arnaque");
    expect(piege.html).not.toContain("<script>");
    expect(piege.html).toContain("&lt;a href=&quot;https://arnaque.example/connexion&quot;&gt;");
    expect(liens(piege.html).some((l) => l.includes("arnaque") || l.includes("julie"))).toBe(false);
    // Le seul lien est fixe (le site), jamais construit à partir d'une saisie.
    expect(liens(piege.html).every((l) => l.startsWith("https://www.spiceevents.fr"))).toBe(true);
  });

  it("conserve les retours à la ligne du message", () => {
    expect(e.html).toContain("Bonjour,<br>nous cherchons un DJ.");
  });
});

describe("emailAccuse (au couple)", () => {
  it("part vers le couple, réponse à Cédric", () => {
    const e = emailAccuse(DEMANDE, CONFIG);
    expect(e.to).toBe(DEMANDE.email);
    expect(e.from).toBe(CONFIG.expediteur);
    expect(e.replyTo).toBe(CONFIG.destinataire);
  });

  it("est écrit dans la langue du couple", () => {
    const fr = emailAccuse(DEMANDE, CONFIG);
    const en = emailAccuse({ ...DEMANDE, langue: "en" }, CONFIG);
    expect(fr.subject).toMatch(/demande/i);
    expect(fr.text).toContain("samedi 12 juin 2027");
    expect(en.subject).toMatch(/request/i);
    expect(en.text).toContain("Saturday 12 June 2027");
    expect(en.text).toContain("Wedding");
  });

  it("salue le couple par ses prénoms, échappés", () => {
    const e = emailAccuse(DEMANDE, CONFIG);
    expect(e.html).toContain("Julie &amp; Thomas");
    expect(e.text).toContain("Julie & Thomas");
  });

  it("ne reprend aucun texte libre (message, lieu, nom) : rien à détourner pour du spam", () => {
    const e = emailAccuse({ ...DEMANDE, message: "Visitez arnaque.example", lieu: "arnaque.example", nom: "Arnaque" }, CONFIG);
    for (const contenu of [e.html, e.text, e.subject]) {
      expect(contenu).not.toContain("arnaque");
      expect(contenu).not.toContain("Arnaque");
    }
  });

  it("ne contient que des liens fixes (site, téléphone)", () => {
    const e = emailAccuse(DEMANDE, CONFIG);
    expect(liens(e.html).every((l) => l.startsWith("https://www.spiceevents.fr") || l === "tel:+33676403776")).toBe(true);
  });
});
