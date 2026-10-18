import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots.txt", () => {
  it("interdit le back office et l'API, ouvre le reste du site", () => {
    const [regle] = [robots().rules].flat();
    expect(regle.allow).toBe("/");
    expect(regle.disallow).toEqual(expect.arrayContaining(["/admin", "/api/"]));
  });
});
