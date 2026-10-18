import { describe, expect, it } from "vitest";
import { sourceAvis } from "./source";

describe("source des avis des pages publiques", () => {
  it("Supabase dès que NEXT_PUBLIC_SUPABASE_URL est définie", () => {
    expect(sourceAvis({ NEXT_PUBLIC_SUPABASE_URL: "https://projet.supabase.co" })).toBe("base");
  });

  it("toujours Supabase sur Vercel (production comme aperçu), même si la variable manquait", () => {
    expect(sourceAvis({ VERCEL: "1", VERCEL_ENV: "production" })).toBe("base");
    expect(sourceAvis({ VERCEL: "1", VERCEL_ENV: "preview", NEXT_PUBLIC_SUPABASE_URL: "" })).toBe("base");
  });

  it("les fichiers de secours sans Supabase dans l'environnement (local, tests), même pour un build de production", () => {
    expect(sourceAvis({})).toBe("fichiers");
    expect(sourceAvis({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "" })).toBe("fichiers");
  });
});
