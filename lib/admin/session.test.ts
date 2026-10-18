import { describe, expect, it } from "vitest";
import { nomCookieSession } from "@/lib/supabase/config";
import { aCookieSession, cheminDeRetour, decisionAcces, estCheminAdmin, estCheminConnexion, type EtatAcces } from "./session";

describe("estCheminAdmin", () => {
  it("reconnaît /admin et ses sous-pages", () => {
    expect(estCheminAdmin("/admin")).toBe(true);
    expect(estCheminAdmin("/admin/")).toBe(true);
    expect(estCheminAdmin("/admin/avis")).toBe(true);
    expect(estCheminAdmin("/admin/connexion")).toBe(true);
  });

  it("laisse le site public à next-intl", () => {
    for (const chemin of ["/", "/en", "/mariages", "/en/weddings", "/administration", "/en/admin", "/adminx"]) {
      expect(estCheminAdmin(chemin)).toBe(false);
    }
  });

  it("isole la page de connexion", () => {
    expect(estCheminConnexion("/admin/connexion")).toBe(true);
    expect(estCheminConnexion("/admin/connexions")).toBe(false);
    expect(estCheminConnexion("/admin/connexion/autre")).toBe(false);
    expect(estCheminConnexion("/admin")).toBe(false);
  });
});

describe("nomCookieSession", () => {
  it("dérive le nom du cookie de la référence du projet", () => {
    expect(nomCookieSession("https://tyghpfqyppiughrknuit.supabase.co")).toBe("sb-tyghpfqyppiughrknuit-auth-token");
  });
});

describe("aCookieSession", () => {
  const nom = "sb-abc-auth-token";

  it("trouve le cookie entier ou découpé (.0, .1…)", () => {
    expect(aCookieSession([nom], nom)).toBe(true);
    expect(aCookieSession(["autre", `${nom}.0`, `${nom}.1`], nom)).toBe(true);
  });

  it("ignore les autres cookies, y compris le vérificateur PKCE", () => {
    expect(aCookieSession([], nom)).toBe(false);
    expect(aCookieSession(["NEXT_LOCALE", `${nom}-code-verifier`, `${nom}.x`, "sb-autre-auth-token"], nom)).toBe(false);
  });
});

describe("cheminDeRetour", () => {
  it("accepte une page du back office", () => {
    expect(cheminDeRetour("/admin/avis")).toBe("/admin/avis");
    expect(cheminDeRetour("/admin/avis?filtre=publies")).toBe("/admin/avis?filtre=publies");
  });

  it("refuse toute autre destination (pas de redirection ouverte)", () => {
    for (const valeur of ["https://exemple.com", "//exemple.com", "/\\exemple.com", "/admin//exemple.com", "/mariages", "/administration", "javascript:alert(1)", "", null, undefined, 42, ["/admin/avis"]]) {
      expect(cheminDeRetour(valeur)).toBe("/admin");
    }
  });

  it("ne renvoie jamais vers la connexion elle-même", () => {
    expect(cheminDeRetour("/admin/connexion")).toBe("/admin");
    expect(cheminDeRetour("/admin/connexion?raison=deconnecte")).toBe("/admin");
  });
});

describe("decisionAcces", () => {
  const etat = (e: Partial<EtatAcces>): EtatAcces => ({
    chemin: "/admin",
    recherche: "",
    connecte: false,
    avaitSession: false,
    indisponible: false,
    ...e,
  });

  it("laisse passer un utilisateur validé par getUser()", () => {
    expect(decisionAcces(etat({ connecte: true }))).toEqual({ type: "continuer" });
  });

  it("laisse la connexion accessible sans session", () => {
    expect(decisionAcces(etat({ chemin: "/admin/connexion" }))).toEqual({ type: "continuer" });
    expect(decisionAcces(etat({ chemin: "/admin/connexion", avaitSession: true }))).toEqual({ type: "continuer" });
  });

  it("renvoie un visiteur sans session vers la connexion, sans raison", () => {
    expect(decisionAcces(etat({}))).toEqual({ type: "rediriger", vers: "/admin/connexion" });
  });

  it("explique une session refusée (cookie présent mais getUser() le rejette)", () => {
    expect(decisionAcces(etat({ avaitSession: true }))).toEqual({ type: "rediriger", vers: "/admin/connexion?raison=session_expiree" });
  });

  it("distingue une panne du serveur d'auth", () => {
    expect(decisionAcces(etat({ avaitSession: true, indisponible: true }))).toEqual({ type: "rediriger", vers: "/admin/connexion?raison=indisponible" });
  });

  it("garde la page demandée pour y revenir après la connexion", () => {
    expect(decisionAcces(etat({ chemin: "/admin/avis", recherche: "?page=2" }))).toEqual({
      type: "rediriger",
      vers: "/admin/connexion?suite=%2Fadmin%2Favis%3Fpage%3D2",
    });
  });
});
