// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { IMAGES_ACCUEIL_MARIAGES } from "@/contenu/pages/mariages";
import { IMAGES } from "@/lib/images";
import { FondAleatoire, SCRIPT_TIRAGE } from "./FondAleatoire";

vi.mock("next-intl", () => ({ useLocale: () => "fr" }));

const CLES = ["couple-champ", "hero-premiere-danse", "contact-maries-lumiere"] as const;

/** HTML statique du fond, puis le script exécuté comme le ferait le navigateur. */
function afficher(tirage: number) {
  document.body.innerHTML = renderToStaticMarkup(<FondAleatoire images={[...CLES]} />);
  const fond = document.body.firstElementChild!;
  vi.spyOn(Math, "random").mockReturnValue(tirage);
  vi.spyOn(document, "currentScript", "get").mockReturnValue(fond.querySelector("script"));
  new Function(SCRIPT_TIRAGE)();
  vi.restoreAllMocks();
  return [...fond.querySelectorAll(":scope > div")].map((d) => ({ visible: !(d as HTMLElement).hidden, src: d.querySelector("img")!.getAttribute("src")! }));
}

describe("FondAleatoire", () => {
  it("sans JavaScript, seule la première photo est visible ; les autres sont chargées en différé", () => {
    document.body.innerHTML = renderToStaticMarkup(<FondAleatoire images={[...CLES]} />);
    const blocs = [...document.querySelectorAll("div > div")] as HTMLElement[];
    expect(blocs.map((b) => b.hidden)).toEqual([false, true, true]);
    for (const img of document.querySelectorAll("img")) expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("le script révèle une seule photo, celle du tirage", () => {
    for (const [tirage, attendue] of [[0, 0], [0.5, 1], [0.99, 2]] as const) {
      const photos = afficher(tirage);
      expect(photos.filter((p) => p.visible)).toHaveLength(1);
      expect(photos[attendue].visible, `tirage ${tirage}`).toBe(true);
      expect(photos[attendue].src).toContain(encodeURIComponent(IMAGES[CLES[attendue]].src));
    }
  });
});

describe("photos d'en-tête de la page Mariages", () => {
  it("20 photos distinctes, au registre, paysage et assez grandes pour le plein écran", () => {
    expect(IMAGES_ACCUEIL_MARIAGES).toHaveLength(20);
    expect(new Set(IMAGES_ACCUEIL_MARIAGES).size).toBe(20);
    for (const cle of IMAGES_ACCUEIL_MARIAGES) {
      const { width, height } = IMAGES[cle];
      expect(width / height, cle).toBeGreaterThan(1.3);
      expect(width, cle).toBeGreaterThanOrEqual(1600);
    }
  });
});
