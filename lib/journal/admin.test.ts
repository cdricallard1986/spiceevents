import { describe, expect, it } from "vitest";
import { urlPublique } from "@/lib/photos/constantes";
import {
  aujourdhuiParis,
  cheminDepuisSrc,
  cheminEnvoiArticle,
  documentDepuisEditeur,
  documentVide,
  estBrouillonVide,
  estSlugProvisoire,
  filtrerArticles,
  formulaireDepuisLigne,
  manquesPublication,
  normaliserAdresseLien,
  slugPropose,
  slugProvisoire,
  slugSuitLeTitre,
  trierArticlesAdmin,
  type ArticleListe,
} from "./admin";
import { validerDocument } from "./document";
import { lignesDeRepli } from "./repli";
import { messageManques, typeDepuisChemin, lireSlugAuto } from "./schema-admin";
import { slugLibre } from "./slug";
import type { LigneArticle } from "./types";

const article = (a: Partial<ArticleListe>): ArticleListe => ({
  id: a.id ?? "x",
  statut: "publie",
  publie_le: "2026-01-01T00:00:00Z",
  slug: "a",
  titre: "Titre",
  categorie: "Conseils mariage",
  date_publication: "2026-01-01",
  updated_at: "2026-01-01T00:00:00Z",
  ...a,
});

describe("liste du journal", () => {
  const liste = [
    article({ id: "p-ancien", date_publication: "2025-05-01", titre: "Été" }),
    article({ id: "b-ancien", statut: "brouillon", publie_le: null, updated_at: "2026-10-01T00:00:00Z", titre: "" }),
    article({ id: "p-recent", date_publication: "2026-09-01", titre: "Éclairage d'automne", categorie: "Technique" }),
    article({ id: "b-recent", statut: "brouillon", publie_le: null, updated_at: "2026-10-18T00:00:00Z", titre: "Brouillon récent" }),
  ];

  it("brouillons en tête (le plus récemment modifié d'abord), puis publiés du plus récent au plus ancien", () => {
    expect(trierArticlesAdmin(liste).map((a) => a.id)).toEqual(["b-recent", "b-ancien", "p-recent", "p-ancien"]);
  });

  it("filtres : statut, catégorie, recherche dans le titre sans accents ni majuscules", () => {
    const f = { statut: "tous", recherche: "", categorie: "toutes" } as const;
    expect(filtrerArticles(liste, { ...f, statut: "brouillons" }).map((a) => a.id)).toEqual(["b-recent", "b-ancien"]);
    expect(filtrerArticles(liste, { ...f, statut: "publies" }).map((a) => a.id)).toEqual(["p-recent", "p-ancien"]);
    expect(filtrerArticles(liste, { ...f, recherche: "ECLAIRAGE" }).map((a) => a.id)).toEqual(["p-recent"]);
    expect(filtrerArticles(liste, { ...f, recherche: "ete" }).map((a) => a.id)).toEqual(["p-ancien"]);
    expect(filtrerArticles(liste, { ...f, categorie: "Technique" }).map((a) => a.id)).toEqual(["p-recent"]);
  });
});

describe("adresse (slug)", () => {
  it("adresse provisoire d'un brouillon neuf", () => {
    expect(slugProvisoire("A1B2C3D4E5")).toBe("brouillon-a1b2c3d4e5");
    expect(estSlugProvisoire("brouillon-a1b2c3d4e5")).toBe(true);
    expect(estSlugProvisoire("brouillon-de-mariage")).toBe(false);
    expect(() => slugProvisoire("ab")).toThrow();
  });

  it("l'adresse suit le titre tant que l'article n'a jamais été publié et qu'elle n'a pas été changée à la main", () => {
    const l = { titre: "Se marier en hiver", publie_le: null };
    expect(slugSuitLeTitre({ ...l, slug: "brouillon-a1b2c3d4e5" })).toBe(true);
    expect(slugSuitLeTitre({ ...l, slug: "se-marier-en-hiver" })).toBe(true);
    expect(slugSuitLeTitre({ ...l, slug: "se-marier-en-hiver-2" })).toBe(true);
    expect(slugSuitLeTitre({ ...l, slug: "mon-adresse" })).toBe(false);
    expect(slugSuitLeTitre({ ...l, slug: "se-marier-2" })).toBe(false);
    expect(slugSuitLeTitre({ ...l, slug: "se-marier-en-hiver", publie_le: "2026-01-01T00:00:00Z" })).toBe(false);
    // Adresse du titre raccourcie par slugLibre pour que le numéro tienne dans 120 caractères.
    const long = "a".repeat(60) + " " + "b".repeat(59);
    const base = "a".repeat(60) + "-" + "b".repeat(59);
    const libre = slugLibre(base, new Set([base]));
    expect(libre.length).toBeLessThanOrEqual(120);
    expect(slugSuitLeTitre({ titre: long, publie_le: null, slug: libre })).toBe(true);
  });

  it("adresse proposée d'après le titre ; sans lettre ni chiffre, l'adresse actuelle", () => {
    expect(slugPropose("Comment choisir l’ambiance musicale ?", "x")).toBe("comment-choisir-l-ambiance-musicale");
    expect(slugPropose("  ?! ", "brouillon-a1b2c3d4e5")).toBe("brouillon-a1b2c3d4e5");
  });

  it("formulaire de l'éditeur depuis une ligne", () => {
    const [l] = lignesDeRepli();
    const f = formulaireDepuisLigne(l);
    expect(f).toMatchObject({ slug: l.slug, titre: l.titre, slugAuto: false, contenu: l.contenu });
    expect(formulaireDepuisLigne({ ...l, publie_le: null, statut: "brouillon", slug: "brouillon-abcdef", sous_titre: null })).toMatchObject({ slugAuto: true, sous_titre: "" });
  });
});

describe("publication", () => {
  it("liste ce qui manque d'après le formulaire à l'écran", () => {
    const [l] = lignesDeRepli();
    expect(manquesPublication(formulaireDepuisLigne(l))).toEqual([]);
    const vide = formulaireDepuisLigne({ ...l, slug: "brouillon-abcdef", titre: " ", description: null, categorie: null, date_publication: null, couverture: null, couverture_alt: null, publie_le: null });
    expect(manquesPublication(vide)).toEqual([
      "le titre",
      "l'adresse (donnez un titre à l'article)",
      "la description (résultat Google)",
      "la catégorie",
      "la date",
      "la photo de couverture",
      "le texte alternatif de la couverture",
    ]);
  });

  it("message du serveur, dans l'ordre de la fiche", () => {
    expect(messageManques({ couverture: "x", titre: "y" })).toBe("Pour publier, il manque : le titre, la photo de couverture.");
  });
});

describe("brouillons jamais remplis", () => {
  const maintenant = new Date("2026-10-19T12:00:00Z");
  const vide = {
    statut: "brouillon" as const,
    publie_le: null,
    titre: "",
    sous_titre: null,
    description: null,
    couverture: null,
    contenu: { type: "doc", content: [] },
    updated_at: "2026-10-18T11:00:00Z",
  };

  it("vide depuis plus de 24 heures : à supprimer", () => {
    expect(estBrouillonVide(vide, maintenant)).toBe(true);
    expect(estBrouillonVide({ ...vide, contenu: { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph", content: [{ type: "text", text: "  " }] }] } }, maintenant)).toBe(true);
  });

  it("gardé : récent, rempli (titre, texte, photo, description, couverture), publié une fois ou contenu illisible", () => {
    expect(estBrouillonVide({ ...vide, updated_at: "2026-10-18T13:00:00Z" }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, titre: "Idée" }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, description: "x" }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, couverture: "journal/2026/10/1-abcdef.jpg" }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, contenu: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Début" }] }] } }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, contenu: { type: "doc", content: [{ type: "horizontalRule" }] } }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, publie_le: "2026-01-01T00:00:00Z" }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, statut: "publie" } as never, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, contenu: "n'importe quoi" }, maintenant)).toBe(false);
    expect(estBrouillonVide({ ...vide, updated_at: "illisible" }, maintenant)).toBe(false);
    expect(documentVide({ type: "doc" })).toBe(true);
    expect(documentVide(null)).toBe(false);
  });
});

describe("document de l'éditeur → forme enregistrée", () => {
  it("retire les attributs à null de Tiptap et les paragraphes vides de la fin, sans toucher au reste", () => {
    const editeur = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "link", attrs: { href: "/mariages", target: null, rel: null, class: null } }] }] },
        { type: "orderedList", attrs: { start: 3, type: null }, content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
        { type: "image", attrs: { src: "/journal/a/1.jpg", alt: "x", title: null, width: 10, height: 20 } },
        { type: "image", attrs: { src: "/journal/a/2.jpg", alt: "y", title: "Légende", width: 10, height: 20 } },
        { type: "paragraph" },
        { type: "paragraph" },
      ],
    };
    const sortie = documentDepuisEditeur(editeur);
    expect(sortie).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "link", attrs: { href: "/mariages" } }] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
        { type: "image", attrs: { src: "/journal/a/1.jpg", alt: "x", width: 10, height: 20 } },
        { type: "image", attrs: { src: "/journal/a/2.jpg", alt: "y", title: "Légende", width: 10, height: 20 } },
      ],
    });
    expect(validerDocument(sortie).ok).toBe(true);
    // Un paragraphe vide au milieu reste (ligne laissée blanche).
    const milieu = { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph", content: [{ type: "text", text: "b" }] }] };
    expect(documentDepuisEditeur(milieu)).toEqual(milieu);
    expect(documentDepuisEditeur({ type: "doc", content: [{ type: "paragraph" }] })).toEqual({ type: "doc", content: [] });
  });

  it("les 37 articles importés sont déjà dans la forme enregistrée", () => {
    for (const l of lignesDeRepli()) expect(documentDepuisEditeur(l.contenu), l.slug).toEqual(l.contenu);
  });
});

describe("liens de l'éditeur", () => {
  it("accepte et complète ce qui est sans ambiguïté", () => {
    expect(normaliserAdresseLien(" /mariages ")).toEqual({ ok: true, href: "/mariages" });
    expect(normaliserAdresseLien("/mariages#methode")).toEqual({ ok: true, href: "/mariages#methode" });
    expect(normaliserAdresseLien("https://www.mariages.net/x")).toEqual({ ok: true, href: "https://www.mariages.net/x" });
    expect(normaliserAdresseLien("http://exemple.fr")).toEqual({ ok: true, href: "http://exemple.fr" });
    expect(normaliserAdresseLien("www.spiceevents.fr/mariages")).toEqual({ ok: true, href: "https://www.spiceevents.fr/mariages" });
    expect(normaliserAdresseLien("exemple.fr")).toEqual({ ok: true, href: "https://exemple.fr" });
    expect(normaliserAdresseLien("contact@spiceevents.fr")).toEqual({ ok: true, href: "mailto:contact@spiceevents.fr" });
    expect(normaliserAdresseLien("mailto:contact@spiceevents.fr")).toEqual({ ok: true, href: "mailto:contact@spiceevents.fr" });
    expect(normaliserAdresseLien("tel:+33612345678")).toEqual({ ok: true, href: "tel:+33612345678" });
    expect(normaliserAdresseLien("06 12 34 56 78")).toEqual({ ok: true, href: "tel:0612345678" });
  });

  it("refuse tout autre schéma, les adresses vides ou ambiguës", () => {
    for (const mauvais of ["", "  ", "javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,x", "vbscript:x", "file:///C:/x", "//autre.fr", "#ancre", "ftp://x.fr", "https://", "mailto:x"]) {
      expect(normaliserAdresseLien(mauvais).ok, mauvais).toBe(false);
    }
    expect(normaliserAdresseLien("//autre.fr")).toMatchObject({ message: expect.stringContaining("https://") });
  });
});

describe("photos de l'éditeur", () => {
  it("chemin d'envoi sous journal/<aaaa>/<mm>/, extension du type MIME", () => {
    const d = new Date("2026-03-05T10:00:00Z");
    expect(cheminEnvoiArticle("image/jpeg", d, "A1B2C3D4E5F6")).toBe(`journal/2026/03/${d.getTime()}-a1b2c3d4e5f6.jpg`);
    expect(cheminEnvoiArticle("image/avif", d, "abcdef")).toMatch(/\.avif$/);
    expect(() => cheminEnvoiArticle("image/png", d, "ab")).toThrow();
  });

  it("adresse d'une image collée → chemin enregistrable, sinon null", () => {
    expect(cheminDepuisSrc("/journal/a/1.jpg")).toBe("/journal/a/1.jpg");
    expect(cheminDepuisSrc(urlPublique("journal/2026/10/1-abcdef.webp"))).toBe("journal/2026/10/1-abcdef.webp");
    expect(cheminDepuisSrc("journal/2026/10/1-abcdef.webp")).toBe("journal/2026/10/1-abcdef.webp");
    for (const refuse of [null, "", "data:image/png;base64,AAAA", "https://autre.fr/journal/a.jpg", urlPublique("galeries/2026/1-abcdef.jpg"), "/images/a.jpg", "/journal/../x.jpg", "blob:http://x/1"])
      expect(cheminDepuisSrc(refuse), String(refuse)).toBeNull();
  });

  it("type MIME d'après l'extension (copie d'une photo de la photothèque)", () => {
    expect(typeDepuisChemin("galeries/2026/1-a.jpg")).toBe("image/jpeg");
    expect(typeDepuisChemin("galeries/2026/1-a.jpeg")).toBe("image/jpeg");
    expect(typeDepuisChemin("galeries/2026/1-a.avif")).toBe("image/avif");
    expect(typeDepuisChemin("galeries/2026/1-a.gif")).toBeNull();
  });
});

describe("divers", () => {
  it("« l'adresse suit le titre » n'est vrai que pour un vrai booléen true", () => {
    expect(lireSlugAuto({ slugAuto: true })).toBe(true);
    expect(lireSlugAuto({ slugAuto: "true" })).toBe(false);
    expect(lireSlugAuto({})).toBe(false);
    expect(lireSlugAuto(null)).toBe(false);
  });

  it("date du jour à Paris", () => {
    expect(aujourdhuiParis(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19");
    expect(aujourdhuiParis(new Date("2026-07-01T10:00:00Z"))).toBe("2026-07-01");
  });
});

// Le type `LigneArticle` reste celui de la table : formulaireDepuisLigne l'accepte tel quel.
export type _Verif = Parameters<typeof formulaireDepuisLigne>[0] extends LigneArticle ? true : never;
