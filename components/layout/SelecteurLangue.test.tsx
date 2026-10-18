import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelecteurLangue } from "./SelecteurLangue";

let locale = "en";
vi.mock("next-intl", () => ({
  useLocale: () => locale,
  useTranslations: () => (cle: string) => cle,
}));
vi.mock("@/i18n/navigation", () => ({ usePathname: () => "/mariages" }));

afterEach(() => {
  cleanup();
  document.head.innerHTML = "";
  document.cookie = "NEXT_LOCALE=; path=/; max-age=0";
});

describe("SelecteurLangue", () => {
  it("pointe vers la page traduite déclarée en hreflang", async () => {
    locale = "en";
    document.head.innerHTML = '<link rel="alternate" hreflang="fr" href="https://www.spiceevents.fr/mariages">';
    render(<SelecteurLangue />);
    expect(await screen.findByRole("link", { name: "langue" })).toHaveAttribute("href", "/mariages");
  });

  it("mémorise la langue choisie pour que le middleware ne ramène pas vers l'ancienne", () => {
    locale = "en";
    document.cookie = "NEXT_LOCALE=en; path=/";
    render(<SelecteurLangue />);
    fireEvent.click(screen.getByRole("link", { name: "langue" }));
    expect(document.cookie).toContain("NEXT_LOCALE=fr");
  });

  it("passe à l'anglais depuis le français", () => {
    locale = "fr";
    render(<SelecteurLangue />);
    const lien = screen.getByRole("link", { name: "langue" });
    expect(lien).toHaveTextContent("EN");
    fireEvent.click(lien);
    expect(document.cookie).toContain("NEXT_LOCALE=en");
  });
});
