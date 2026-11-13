import { describe, expect, it } from "vitest";
import { FORMULAIRE_MEMBRE_VIDE, stylesDepuisTexte, validerChampsMembre } from "./schema";
import { cadrageDepuisClic, estCheminPhotoMembre, lireCadrage } from "./constantes";
import { cheminEnvoiMembre, trierEquipe } from "./admin";
import { EQUIPE_INITIALE } from "@/contenu/equipe";

const FICHE = { ...FORMULAIRE_MEMBRE_VIDE, nom: "Antoine D.", accroche_fr: "Le dernier arrivé.", presentation_fr: "Bonjour." };

describe("validation d'une fiche de l'équipe", () => {
  it("accepte une fiche minimale ; les champs vides deviennent null, sans photo ni cadrage", () => {
    const v = validerChampsMembre(FICHE);
    expect(v).toMatchObject({ ok: true, champs: { nom: "Antoine D.", role_fr: "DJ", role_en: null, styles_fr: [], photo_chemin: null, photo_largeur: null, photo_cadrage: "50% 50%" } });
  });

  it("exige nom, rôle, accroche et présentation en français", () => {
    const v = validerChampsMembre({ ...FORMULAIRE_MEMBRE_VIDE, role_fr: "" });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(Object.keys(v.erreurs).sort()).toEqual(["accroche_fr", "nom", "presentation_fr", "role_fr"]);
  });

  it("nettoie la présentation : retours Windows, lignes vides multiples ramenées à une", () => {
    const v = validerChampsMembre({ ...FICHE, presentation_fr: "  Un.\r\n\r\n\r\n\r\nDeux.  \n" });
    expect(v).toMatchObject({ ok: true, champs: { presentation_fr: "Un.\n\nDeux." } });
  });

  it("styles : séparés par des virgules, sans doublon ni vide, 8 au maximum", () => {
    expect(stylesDepuisTexte(" Électro ,Funk;; Funk\nHouse ")).toEqual(["Électro", "Funk", "House"]);
    expect(validerChampsMembre({ ...FICHE, styles_fr: "a,b,c,d,e,f,g,h,i" })).toMatchObject({ ok: false, erreurs: { styles_fr: expect.any(String) } });
  });

  it("lien : https seulement, avec un texte ; un texte sans adresse est refusé", () => {
    expect(validerChampsMembre({ ...FICHE, lien_url: "www.mixcloud.com/kevin", lien_libelle_fr: "Sa page" })).toMatchObject({
      ok: true,
      champs: { lien_url: "https://www.mixcloud.com/kevin" },
    });
    expect(validerChampsMembre({ ...FICHE, lien_url: "javascript:alert(1)", lien_libelle_fr: "x" })).toMatchObject({ ok: false, erreurs: { lien_url: expect.any(String) } });
    expect(validerChampsMembre({ ...FICHE, lien_url: "https://a.fr" })).toMatchObject({ ok: false, erreurs: { lien_libelle_fr: expect.any(String) } });
    expect(validerChampsMembre({ ...FICHE, lien_libelle_fr: "Sa page" })).toMatchObject({ ok: false, erreurs: { lien_url: expect.any(String) } });
  });

  it("avis : le texte français et son auteur vont ensemble", () => {
    expect(validerChampsMembre({ ...FICHE, avis_texte_fr: "Génial" })).toMatchObject({ ok: false, erreurs: { avis_auteur_fr: expect.any(String) } });
    expect(validerChampsMembre({ ...FICHE, avis_auteur_fr: "Roman" })).toMatchObject({ ok: false, erreurs: { avis_texte_fr: expect.any(String) } });
  });

  it("photo : fichier du site ou dossier equipe/ du stockage, avec ses dimensions ; cadrage en pourcentages", () => {
    const photo = { photo_largeur: 1200, photo_hauteur: 1800, photo_cadrage: "50% 30%" };
    expect(validerChampsMembre({ ...FICHE, ...photo, photo_chemin: "/images/dj-pans.jpg" }).ok).toBe(true);
    expect(validerChampsMembre({ ...FICHE, ...photo, photo_chemin: "equipe/2026/11/1-abcdef.jpg" }).ok).toBe(true);
    for (const chemin of ["galeries/2026/11/1-abcdef.jpg", "equipe/../x.jpg", "https://a.fr/x.jpg", "equipe//x.jpg"]) {
      expect(validerChampsMembre({ ...FICHE, ...photo, photo_chemin: chemin }), chemin).toMatchObject({ ok: false, erreurs: { photo_chemin: expect.any(String) } });
    }
    expect(validerChampsMembre({ ...FICHE, photo_chemin: "/images/dj-pans.jpg" })).toMatchObject({ ok: false, erreurs: { photo_chemin: expect.any(String) } });
    expect(validerChampsMembre({ ...FICHE, ...photo, photo_chemin: "/images/dj-pans.jpg", photo_cadrage: "150% 0%" })).toMatchObject({ ok: false });
    // Sans photo : ni dimensions ni cadrage enregistrés.
    expect(validerChampsMembre({ ...FICHE, ...photo })).toMatchObject({ ok: true, champs: { photo_largeur: null, photo_hauteur: null, photo_cadrage: "50% 50%" } });
  });
});

describe("outils de la section DJ", () => {
  it("cadrage d'un clic : arrondi au pour cent, borné à 0–100", () => {
    expect(cadrageDepuisClic(0.504, 0.081)).toBe("50% 8%");
    expect(cadrageDepuisClic(-1, 2)).toBe("0% 100%");
    expect(lireCadrage("55% 30%")).toEqual({ x: 55, y: 30 });
    expect(lireCadrage("n'importe quoi")).toEqual({ x: 50, y: 50 });
  });

  it("chemin d'envoi sûr, et seuls les chemins attendus sont acceptés", () => {
    const c = cheminEnvoiMembre("image/png", new Date(Date.UTC(2026, 10, 13)), "A1-b2/c3d4");
    expect(c).toBe(`equipe/2026/11/${Date.UTC(2026, 10, 13)}-a1b2c3d4.png`);
    expect(() => cheminEnvoiMembre("image/png", new Date(), "ab")).toThrow();
    expect(estCheminPhotoMembre("/images/dj-pans.jpg")).toBe(true);
    expect(estCheminPhotoMembre("/images/../x.jpg")).toBe(false);
  });

  it("tri : les DJ d'abord, puis les musiciens, chacun dans son ordre", () => {
    const melange = [EQUIPE_INITIALE[5], EQUIPE_INITIALE[2], { ...EQUIPE_INITIALE[0], ordre: 99 }, EQUIPE_INITIALE[1]];
    expect(trierEquipe(melange).map((m) => m.nom)).toEqual(["Kevin R.", "DJ Pan's", "Antoine D.", "Angel"]);
  });
});
