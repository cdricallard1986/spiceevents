import { describe, expect, it } from "vitest";
import { article, entreprise, filAriane, pageFaq, serialiser } from "./donneesStructurees";

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

  it("décrivent un article avec l'adresse complète de sa couverture (fichier du site ou stockage)", () => {
    const base = { titre: "T", description: "D", date: "2026-02-03", url: "/journal/t" };
    expect(article({ ...base, image: "/journal/t/couverture.jpg" })).toMatchObject({
      "@type": "BlogPosting",
      datePublished: "2026-02-03",
      url: "https://www.spiceevents.fr/journal/t",
      image: "https://www.spiceevents.fr/journal/t/couverture.jpg",
    });
    const stockage = "https://tyghpfqyppiughrknuit.supabase.co/storage/v1/object/public/medias/journal/t/c.jpg";
    expect(article({ ...base, image: stockage }).image).toBe(stockage);
    expect(article(base)).not.toHaveProperty("image");
  });

  it("ne permettent pas de fermer la balise script", () => {
    expect(serialiser({ texte: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
