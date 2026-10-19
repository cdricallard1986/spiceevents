import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { describe, expect, it, vi } from "vitest";
import { imagesDuDocument, liensDuDocument, texteBrut, type DocumentArticle } from "@/lib/journal/document";
import { lignesDeRepli } from "@/lib/journal/repli";
import { ContenuArticle } from "./ContenuArticle";

// `Link` de next-intl : une simple balise <a> avec l'adresse française (sans contexte de langue en test).
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string | { pathname: string; params?: Record<string, string>; hash?: string }; children: ReactNode }) => {
    const adresse =
      typeof href === "string"
        ? href
        : href.pathname.replace(/\[(\w+)\]/g, (_, p: string) => href.params?.[p] ?? "") + (href.hash ? `#${href.hash}` : "");
    return <a href={adresse}>{children}</a>;
  },
}));

// Réglages d'images du site (next.config.ts : qualités 70 et 80), comme au build.
const IMAGES = { ...imageConfigDefault, qualities: [70, 80] };
const html = (document: unknown) =>
  renderToStaticMarkup(
    <ImageConfigContext.Provider value={IMAGES}>
      <ContenuArticle document={document as DocumentArticle} />
    </ImageConfigContext.Provider>,
  );
const t = (text: string, marks?: unknown[]) => (marks ? { type: "text", text, marks } : { type: "text", text });
const lien = (href: string) => ({ type: "link", attrs: { href } });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const doc = (...content: unknown[]) => ({ type: "doc", content });

describe("ContenuArticle", () => {
  it("rend les blocs avec les balises de l'ancien rendu MDX, un retour à la ligne entre deux blocs", () => {
    expect(
      html(
        doc(
          p(t("Un "), t("DJ", [{ type: "bold" }]), t(" et "), t("vous", [{ type: "italic" }]), { type: "hardBreak" }, t("ensuite.")),
          { type: "heading", attrs: { level: 2 }, content: [t("Le lieu")] },
          { type: "heading", attrs: { level: 3 }, content: [t("Détails")] },
          { type: "bulletList", content: [{ type: "listItem", content: [p(t("un"))] }, { type: "listItem", content: [p(t("deux"))] }] },
          { type: "blockquote", content: [p(t("Tenir un stand", [{ type: "bold" }]), t("."))] },
          { type: "horizontalRule" },
        ),
      ),
    ).toBe(
      [
        "<p>Un <strong>DJ</strong> et <em>vous</em><br/>ensuite.</p>",
        "<h2>Le lieu</h2>",
        "<h3>Détails</h3>",
        "<ul>\n<li>un</li>\n<li>deux</li>\n</ul>",
        "<blockquote>\n<p><strong>Tenir un stand</strong>.</p>\n</blockquote>",
        "<hr/>",
      ].join("\n"),
    );
  });

  it("liens : page du site par Link, extérieur dans un nouvel onglet ; email tel quel", () => {
    expect(html(doc(p(t("DJ", [lien("/mariages")]), t(" "), t("méthode", [lien("/mariages#methode")]), t(" "), t("MX", [lien("https://mxevenement.com/")]), t(" "), t("écrire", [lien("mailto:cedric@spiceevents.fr")]))))).toBe(
      '<p><a href="/mariages">DJ</a> <a href="/mariages#methode">méthode</a> <a href="https://mxevenement.com/" target="_blank" rel="noopener noreferrer">MX</a> <a href="mailto:cedric@spiceevents.fr">écrire</a></p>',
    );
  });

  it("imbrique les marques : la plus étendue d'abord, à égalité le lien à l'extérieur", () => {
    const gras = { type: "bold" };
    const italique = { type: "italic" };
    // Un passage en gras qui contient deux liens.
    expect(html(doc(p(t("Pour la ", [gras]), t("technique", [lien("/a-propos"), gras]), t(", écrivez-", [gras]), t("nous", [lien("/contact"), gras]))))).toBe(
      '<p><strong>Pour la <a href="/a-propos">technique</a>, écrivez-<a href="/contact">nous</a></strong></p>',
    );
    // Un lien en italique dans une phrase en italique ; un lien en gras.
    expect(html(doc(p(t("voir : ", [italique]), t("l’article", [lien("/journal/x"), italique]))))).toBe('<p><em>voir : <a href="/journal/x">l’article</a></em></p>');
    expect(html(doc(p(t("MX", [lien("https://mxevenement.com/"), gras]))))).toBe(
      '<p><a href="https://mxevenement.com/" target="_blank" rel="noopener noreferrer"><strong>MX</strong></a></p>',
    );
    // Deux liens contigus vers des adresses différentes restent deux liens.
    expect(html(doc(p(t("a", [lien("/a-propos")]), t("b", [lien("/contact")]))))).toBe('<p><a href="/a-propos">a</a><a href="/contact">b</a></p>');
  });

  it("photos : fichier du site ou du stockage, légende facultative", () => {
    const site = html(doc({ type: "image", attrs: { src: "/journal/a/1.jpg", width: 1200, height: 799, alt: "DJ aux platines", title: null } }));
    expect(site).toMatch(/^<figure class="my-10 md:my-12"><img alt="DJ aux platines" loading="lazy" width="1200" height="799" .*class="max-h-\[85svh\] object-contain".*src="\/_next\/image\?url=%2Fjournal%2Fa%2F1\.jpg&amp;w=3840&amp;q=70"\/><\/figure>$/);
    const stockage = html(doc({ type: "image", attrs: { src: "journal/2026/10/b.webp", width: 800, height: 600, alt: "Salle", title: "Le dîner" } }));
    expect(stockage).toContain(encodeURIComponent("https://tyghpfqyppiughrknuit.supabase.co/storage/v1/object/public/medias/journal/2026/10/b.webp"));
    expect(stockage).toContain('<figcaption class="mt-3 text-center text-sm text-sable">Le dîner</figcaption></figure>');
  });

  it("listes : numérotée avec son départ, élément à plusieurs blocs, paragraphes vides ignorés", () => {
    expect(
      html(
        doc(
          { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(t("trois")), { type: "bulletList", content: [{ type: "listItem", content: [p(t("a"))] }] }] }] },
          { type: "paragraph" },
          { type: "orderedList", attrs: { start: 1, type: null }, content: [{ type: "listItem", content: [p(t("un"))] }] },
        ),
      ),
    ).toBe('<ol start="3">\n<li>\n<p>trois</p>\n<ul>\n<li>a</li>\n</ul>\n</li>\n</ol>\n<ol>\n<li>un</li>\n</ol>');
  });

  it("n'injecte jamais de HTML : le texte est échappé", () => {
    expect(html(doc(p(t('<script>alert("x")</script><img src=x onerror=alert(1)>'))))).toBe(
      "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;</p>",
    );
    const source = readFileSync(join(__dirname, "ContenuArticle.tsx"), "utf8");
    expect(source).not.toMatch(/dangerouslySetInnerHTML|innerHTML/);
  });

  it("rend les 37 articles importés : tout le texte, toutes les photos, tous les liens", () => {
    for (const l of lignesDeRepli()) {
      const document = l.contenu as DocumentArticle;
      const rendu = html(document);
      const texte = rendu
        .replace(/<br\/>|<\/(p|h2|h3|li|ul|ol|blockquote)>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
      expect(texte, l.slug).toBe(texteBrut(document).replace(/\s+/g, " ").trim());
      expect(rendu.match(/<img /g)?.length ?? 0, l.slug).toBe(imagesDuDocument(document).length);
      expect([...rendu.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")), l.slug).toEqual(liensDuDocument(document).map((x) => x.href));
    }
  });
});
