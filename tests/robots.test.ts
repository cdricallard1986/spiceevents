import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots.txt", () => {
  it("ouvre le site, ferme l’API, et laisse lire le back office pour que son « noindex » soit vu", () => {
    const [regle] = [robots().rules].flat();
    expect(regle.allow).toBe("/");
    expect(regle.disallow).toEqual(["/api/"]);
    // Avec « Disallow: /admin », le robot ne lirait jamais l’en-tête X-Robots-Tag des pages du back office.
    expect([regle.disallow].flat().some((d) => d?.startsWith("/admin"))).toBe(false);
  });
});
