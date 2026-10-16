import { describe, expect, it } from "vitest";
import { entreprise, filAriane, pageFaq, serialiser } from "./donneesStructurees";

describe("données structurées", () => {
  it("décrivent l'entreprise avec sa zone et ses distinctions, sans note inventée", () => {
    const e = entreprise("fr");
    expect(e["@type"]).toBe("EntertainmentBusiness");
    expect(JSON.stringify(e.areaServed)).toContain("Île-de-France");
    expect(e.award).toHaveLength(3);
    expect(e).not.toHaveProperty("aggregateRating");
    expect(e.legalName).toBe("MX ÉVÉNEMENT");
    expect(e.address).toMatchObject({ postalCode: "77144", addressLocality: "Chalifert", addressCountry: "FR" });
    expect(e.taxID).toBe("530672666");
  });

  it("produisent une FAQ et un fil d'Ariane conformes", () => {
    const f = pageFaq([{ question: "Q ?", reponse: "R." }]);
    expect(f.mainEntity).toEqual([{ "@type": "Question", name: "Q ?", acceptedAnswer: { "@type": "Answer", text: "R." } }]);
    const a = filAriane([{ nom: "Accueil", url: "/" }, { nom: "FAQ", url: "/faq" }]);
    expect((a.itemListElement as { item: string }[])[1].item).toBe("https://www.spiceevents.fr/faq");
  });

  it("ne permettent pas de fermer la balise script", () => {
    expect(serialiser({ texte: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
