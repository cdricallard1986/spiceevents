import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";

vi.mock("next-intl/server", () => ({ setRequestLocale: () => {} }));
vi.mock("next/navigation", async (orig) => ({ ...(await orig<object>()), notFound: () => { throw new Error("NOT_FOUND"); } }));

import PageMariages, { generateMetadata as metaMariages } from "@/app/[locale]/mariages/page";
import PageAnimations from "@/app/[locale]/animations/page";
import PageEvenementiel from "@/app/[locale]/evenementiel/page";
import PageOption, { generateMetadata as metaOption, generateStaticParams } from "@/app/[locale]/animations/[option]/page";

async function rendre(el: Promise<React.ReactElement>, locale: "fr" | "en") {
  const arbre = await el;
  return renderToString(<NextIntlClientProvider locale={locale} messages={{}}>{arbre}</NextIntlClientProvider>);
}

describe("rendu", () => {
  for (const locale of ["fr", "en"] as const) {
    it(`mariages ${locale}`, async () => {
      const html = await rendre(PageMariages({ params: Promise.resolve({ locale }) }), locale);
      expect(html.match(/<h1/g)?.length).toBe(1);
      expect(html).toContain('id="methode"');
      const liens = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !h.startsWith("/_next"));
      console.log(locale, [...new Set(liens)].join(" "));
    });
    it(`animations ${locale}`, async () => {
      const html = await rendre(PageAnimations({ params: Promise.resolve({ locale }) }), locale);
      expect(html.match(/<h1/g)?.length).toBe(1);
      console.log(locale, [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))].join(" "));
    });
    it(`evenementiel ${locale}`, async () => {
      const html = await rendre(PageEvenementiel({ params: Promise.resolve({ locale }) }), locale);
      expect(html.match(/<h1/g)?.length).toBe(1);
    });
    it(`options ${locale}`, async () => {
      for (const { option } of generateStaticParams({ params: { locale } })) {
        const html = await rendre(PageOption({ params: Promise.resolve({ locale, option }) }), locale);
        expect(html.match(/<h1/g)?.length).toBe(1);
        const m = await metaOption({ params: Promise.resolve({ locale, option }) });
        console.log(option, JSON.stringify(m.alternates), (html.match(/« [^»]{0,80}/) ?? [""])[0]);
      }
      await expect(metaOption({ params: Promise.resolve({ locale, option: "inconnue" }) })).rejects.toThrow("NOT_FOUND");
    });
  }
  it("meta mariages", async () => {
    console.log(JSON.stringify((await metaMariages({ params: Promise.resolve({ locale: "en" }) })).alternates));
  });
});
