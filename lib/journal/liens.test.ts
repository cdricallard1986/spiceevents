import { describe, expect, it } from "vitest";
import { estExterne, hrefInterne } from "./liens";

describe("hrefInterne", () => {
  it("reconnaît les pages fixes du site", () => {
    expect(hrefInterne("/")).toBe("/");
    expect(hrefInterne("/mariages")).toBe("/mariages");
    expect(hrefInterne("/a-propos/")).toBe("/a-propos");
  });

  it("traduit les pages à paramètre en href typé", () => {
    expect(hrefInterne("/journal/se-marier-en-hiver")).toEqual({ pathname: "/journal/[slug]", params: { slug: "se-marier-en-hiver" } });
    expect(hrefInterne("/animations/photobooth")).toEqual({ pathname: "/animations/[option]", params: { option: "photobooth" } });
  });

  it("laisse les ancres, les adresses inconnues et externes à un simple <a>", () => {
    expect(hrefInterne("/mariages#methode")).toBeNull();
    expect(hrefInterne("/booking-dj")).toBeNull();
    expect(hrefInterne("https://mxevenement.com/")).toBeNull();
    expect(hrefInterne("//exemple.com")).toBeNull();
  });
});

describe("estExterne", () => {
  it("distingue les liens externes", () => {
    expect(estExterne("https://mxevenement.com/")).toBe(true);
    expect(estExterne("http://www.leshautsdepardaillan.com/")).toBe(true);
    expect(estExterne("/contact")).toBe(false);
  });
});
