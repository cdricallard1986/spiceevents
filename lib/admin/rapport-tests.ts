/**
 * Rapport des tests automatiques (page `/admin/tests`) : sortie JSON de Vitest
 * → page HTML auto-contenue (logique pure, testée).
 *
 * ⚠️ Ce fichier est aussi exécuté tel quel par Node au `prebuild`
 * (`outils/rapport-tests.mjs`, types effacés à la volée) : AUCUN import, et
 * rien que de la syntaxe que Node sait dépouiller de ses types (pas d'`enum`).
 *
 * La page produite ne charge rien (ni script, ni police, ni image) : styles en
 * ligne seulement. Elle est servie avec `default-src 'none'`. Noms de tests et
 * messages d'échec sont échappés : un nom comme `<img onerror=…>` reste du texte.
 */

// --- Sortie JSON de Vitest (format « jest », champs utilisés seulement) ------

export type StatutVitest = "passed" | "failed" | "skipped" | "pending" | "todo" | "disabled";

export type AssertionVitest = {
  ancestorTitles?: string[];
  title: string;
  fullName?: string;
  status: StatutVitest | string;
  duration?: number | null;
  failureMessages?: string[];
};

export type FichierVitest = {
  name: string;
  status: string;
  message?: string;
  startTime?: number;
  endTime?: number;
  assertionResults?: AssertionVitest[];
};

export type SortieVitest = {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  numTodoTests?: number;
  startTime?: number;
  success?: boolean;
  testResults?: FichierVitest[];
};

// --- Modèle du rapport -------------------------------------------------------

export type StatutTest = "reussi" | "echoue" | "ignore";

export type TestRapport = {
  /** Blocs `describe` puis titre du test. */
  chemin: string[];
  statut: StatutTest;
  dureeMs: number | null;
  /** Messages d'échec, sans codes couleur du terminal. */
  messages: string[];
};

export type FichierRapport = {
  /** Chemin relatif à la racine du projet. */
  fichier: string;
  /** Erreur du fichier lui-même (import impossible, erreur hors test…). */
  erreur: string | null;
  dureeMs: number | null;
  tests: TestRapport[];
};

export type Totaux = { total: number; reussis: number; echoues: number; ignores: number };

export type Rapport = {
  /** Date du lancement des tests (ISO). */
  date: string;
  dureeMs: number;
  totaux: Totaux;
  /** Un fichier en erreur sans test échoué compte aussi comme un échec. */
  fichiersEnErreur: number;
  succes: boolean;
  fichiers: FichierRapport[];
};

/** Résumé exporté vers le module généré, affiché au-dessus du rapport. */
export type ResumeRapport = Pick<Rapport, "date" | "dureeMs" | "totaux" | "fichiersEnErreur" | "succes"> & { version: string };

// --- Transformation ----------------------------------------------------------

/** Codes couleur ANSI que Vitest met dans ses messages d'échec. */
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

export function sansCouleurs(texte: string): string {
  return texte.replace(ANSI, "");
}

function statutTest(statut: string): StatutTest {
  if (statut === "passed") return "reussi";
  if (statut === "failed") return "echoue";
  return "ignore";
}

/** « /home/…/spiceevents/lib/a.test.ts » → « lib/a.test.ts » (séparateurs Windows compris). */
export function cheminRelatif(chemin: string, racine: string): string {
  const normalise = chemin.replace(/\\/g, "/");
  const base = racine.replace(/\\/g, "/").replace(/\/+$/, "");
  return base && normalise.startsWith(`${base}/`) ? normalise.slice(base.length + 1) : normalise;
}

function duree(debut: number | undefined, fin: number | undefined): number | null {
  return typeof debut === "number" && typeof fin === "number" && fin >= debut ? fin - debut : null;
}

/** Sortie JSON de Vitest → rapport (fichiers triés, échecs en tête). */
export function construireRapport(sortie: SortieVitest, racine: string, maintenant: number = Date.now()): Rapport {
  const fichiers: FichierRapport[] = (sortie.testResults ?? []).map((f) => {
    const tests = (f.assertionResults ?? []).map<TestRapport>((a) => ({
      chemin: [...(a.ancestorTitles ?? []), a.title],
      statut: statutTest(a.status),
      dureeMs: typeof a.duration === "number" ? a.duration : null,
      messages: (a.failureMessages ?? []).map(sansCouleurs),
    }));
    const message = f.message ? sansCouleurs(f.message).trim() : "";
    // Un fichier « failed » sans test échoué : il n'a pas pu s'exécuter.
    const erreur = message || (f.status === "failed" && !tests.some((t) => t.statut === "echoue") ? "Le fichier n'a pas pu être exécuté." : null);
    return { fichier: cheminRelatif(f.name, racine), erreur, dureeMs: duree(f.startTime, f.endTime), tests };
  });

  const enEchec = (f: FichierRapport) => f.erreur !== null || f.tests.some((t) => t.statut === "echoue");
  fichiers.sort((a, b) => Number(enEchec(b)) - Number(enEchec(a)) || a.fichier.localeCompare(b.fichier));

  const tous = fichiers.flatMap((f) => f.tests);
  const totaux: Totaux = {
    total: tous.length,
    reussis: tous.filter((t) => t.statut === "reussi").length,
    echoues: tous.filter((t) => t.statut === "echoue").length,
    ignores: tous.filter((t) => t.statut === "ignore").length,
  };
  const fichiersEnErreur = fichiers.filter((f) => f.erreur !== null).length;

  // Durée totale : du lancement à la fin du dernier fichier (Vitest ne la donne pas).
  const nombres = (valeurs: (number | undefined)[]) => valeurs.filter((n): n is number => typeof n === "number");
  const debuts = nombres((sortie.testResults ?? []).map((f) => f.startTime));
  const fins = nombres((sortie.testResults ?? []).map((f) => f.endTime));
  const debut = sortie.startTime ?? (debuts.length ? Math.min(...debuts) : null);
  const dureeMs = debut !== null && fins.length ? Math.max(0, Math.round(Math.max(...fins) - debut)) : 0;

  return {
    date: new Date(debut ?? maintenant).toISOString(),
    dureeMs,
    totaux,
    fichiersEnErreur,
    succes: totaux.echoues === 0 && fichiersEnErreur === 0 && sortie.success !== false,
    fichiers,
  };
}

// --- Rendu HTML --------------------------------------------------------------

const ECHAPPEMENTS: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Échappement HTML. (Même règle que `echapper()` de lib/contact/email.ts,
 * recopiée ici parce que ce fichier ne peut rien importer.)
 */
export function echapperHtml(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ECHAPPEMENTS[c]);
}

/** 1234 → « 1,23 s » ; 12 → « 12 ms ». */
export function formaterDuree(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2).replace(".", ",")} s`;
}

/** Date en heure de Paris : « 18/10/2026 à 14:05 ». */
export function formaterDateRapport(iso: string): string {
  const d = new Date(iso);
  const jour = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  const heure = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
  return `${jour} à ${heure}`;
}

// Charte « Nuit de fête » (mêmes valeurs que app/globals.css).
const C = {
  nuit: "#0e0d12",
  nuit2: "#17151d",
  nuit3: "#211e28",
  ligne: "#2b2733",
  ivoire: "#efe8dd",
  sable: "#bdb4a8",
  or: "#e2bd72",
  erreur: "#f08a7e",
  succes: "#9cd3a8",
};

const STYLES = `
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;padding:24px;background:${C.nuit};color:${C.ivoire};font:300 14px/1.6 Manrope,system-ui,-apple-system,"Segoe UI",sans-serif}
h1{margin:0;font:400 28px/1.2 "Bodoni Moda",Georgia,serif}
.surtitre{margin:0 0 8px;font-size:12px;font-weight:500;letter-spacing:.28em;text-transform:uppercase;color:${C.or}}
.meta{margin:8px 0 0;color:${C.sable}}
.totaux{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}
.total{min-width:120px;padding:12px 16px;border:1px solid ${C.ligne};background:${C.nuit2}}
.total b{display:block;font:400 26px/1.1 "Bodoni Moda",Georgia,serif}
.total span{color:${C.sable};font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.bandeau{margin:0 0 24px;padding:12px 16px;border-left:2px solid;background:${C.nuit3}}
.ok{color:${C.succes};border-color:${C.succes}}
.ko{color:${C.erreur};border-color:${C.erreur}}
.ign{color:${C.sable}}
details{margin:0 0 8px;border:1px solid ${C.ligne};background:${C.nuit2}}
details.echec{border-color:${C.erreur}}
summary{display:flex;gap:12px;align-items:baseline;padding:10px 14px;cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"▸";color:${C.sable}}
details[open]>summary::before{content:"▾"}
.fichier{flex:1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;word-break:break-all}
.compte{color:${C.sable};font-size:12px;white-space:nowrap}
ul{margin:0;padding:0 14px 10px;list-style:none}
li{display:flex;flex-wrap:wrap;gap:4px 12px;padding:6px 0;border-top:1px solid ${C.ligne}}
.statut{width:16px;text-align:center}
.titre{flex:1;min-width:200px}
.titre .bloc{color:${C.sable}}
.duree{color:${C.sable};font-size:12px;white-space:nowrap}
pre{flex-basis:100%;margin:6px 0 0;padding:10px 12px;overflow:auto;background:${C.nuit};border:1px solid ${C.ligne};color:${C.erreur};font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word}
.vide{color:${C.sable}}
`;

const SYMBOLES: Record<StatutTest, { signe: string; classe: string; libelle: string }> = {
  reussi: { signe: "✓", classe: "ok", libelle: "réussi" },
  echoue: { signe: "✗", classe: "ko", libelle: "échoué" },
  ignore: { signe: "○", classe: "ign", libelle: "ignoré" },
};

function rendreTest(t: TestRapport): string {
  const s = SYMBOLES[t.statut];
  const blocs = t.chemin.slice(0, -1).map((b) => `<span class="bloc">${echapperHtml(b)} › </span>`).join("");
  const titre = echapperHtml(t.chemin[t.chemin.length - 1] ?? "");
  const messages = t.messages.map((m) => `<pre>${echapperHtml(m)}</pre>`).join("");
  return `<li><span class="statut ${s.classe}" title="${s.libelle}" aria-label="${s.libelle}">${s.signe}</span><span class="titre">${blocs}${titre}</span><span class="duree">${formaterDuree(t.dureeMs)}</span>${messages}</li>`;
}

function rendreFichier(f: FichierRapport): string {
  const echoues = f.tests.filter((t) => t.statut === "echoue").length;
  const enEchec = echoues > 0 || f.erreur !== null;
  const compte = `${f.tests.length} test${f.tests.length > 1 ? "s" : ""}${echoues ? ` · <span class="ko">${echoues} échoué${echoues > 1 ? "s" : ""}</span>` : ""} · ${formaterDuree(f.dureeMs)}`;
  const erreur = f.erreur ? `<ul><li><pre>${echapperHtml(f.erreur)}</pre></li></ul>` : "";
  const tests = f.tests.length ? `<ul>${f.tests.map(rendreTest).join("")}</ul>` : "";
  // Les fichiers en échec sont dépliés d'office.
  return `<details${enEchec ? ' class="echec" open' : ""}><summary><span class="statut ${enEchec ? "ko" : "ok"}">${enEchec ? "✗" : "✓"}</span><span class="fichier">${echapperHtml(f.fichier)}</span><span class="compte">${compte}</span></summary>${erreur}${tests}</details>`;
}

/** Page HTML complète, sans aucune ressource externe. */
export function rapportHtml(rapport: Rapport, version: string): string {
  const { totaux } = rapport;
  const bandeau = rapport.succes
    ? `<p class="bandeau ok">Tous les tests passent.</p>`
    : `<p class="bandeau ko">${totaux.echoues} test${totaux.echoues > 1 ? "s" : ""} en échec${rapport.fichiersEnErreur ? `, ${rapport.fichiersEnErreur} fichier${rapport.fichiersEnErreur > 1 ? "s" : ""} en erreur` : ""} : le déploiement a été bloqué.</p>`;
  const carte = (valeur: number, libelle: string, classe = "") => `<div class="total"><b class="${classe}">${valeur}</b><span>${libelle}</span></div>`;
  const fichiers = rapport.fichiers.length ? rapport.fichiers.map(rendreFichier).join("\n") : `<p class="vide">Aucun fichier de test trouvé.</p>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Rapport des tests — version ${echapperHtml(version)}</title>
<style>${STYLES}</style>
</head>
<body>
<p class="surtitre">Tests automatiques</p>
<h1>Rapport Vitest</h1>
<p class="meta">Lancé le ${formaterDateRapport(rapport.date)} · durée ${formaterDuree(rapport.dureeMs)} · version ${echapperHtml(version)}</p>
<div class="totaux">${carte(totaux.total, "tests")}${carte(totaux.reussis, "réussis", "ok")}${carte(totaux.echoues, "échoués", totaux.echoues ? "ko" : "")}${carte(totaux.ignores, "ignorés", "ign")}</div>
${bandeau}
${fichiers}
</body>
</html>
`;
}

/** Page affichée tant qu'aucun build n'a produit de rapport (développement local). */
export function rapportAbsentHtml(): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Rapport des tests</title><style>${STYLES}</style></head>
<body>
<p class="surtitre">Tests automatiques</p>
<h1>Rapport non encore généré</h1>
<p class="meta">Le rapport est produit à chaque build (<code>npm run build</code>, étape <code>prebuild</code>). En local : <code>npm run tests:rapport</code>.</p>
</body>
</html>
`;
}

/** Résumé de la page `/admin/tests`. */
export function resumer(rapport: Rapport, version: string): ResumeRapport {
  const { date, dureeMs, totaux, fichiersEnErreur, succes } = rapport;
  return { date, dureeMs, totaux, fichiersEnErreur, succes, version };
}

/** Contenu du module `rapport-tests.generated.ts` (chaînes sérialisées en JSON : rien n'y est interprété). */
export function moduleGenere(resume: ResumeRapport | null, html: string): string {
  return `// Fichier généré par outils/rapport-tests.mjs au prebuild — ne pas modifier à la main.
// Module serveur : servi seulement par la route protégée /admin/tests/rapport (jamais dans public/).
import "server-only";
import type { ResumeRapport } from "./rapport-tests";

export const RESUME_TESTS: ResumeRapport | null = ${JSON.stringify(resume)};

export const RAPPORT_TESTS_HTML: string = ${JSON.stringify(html)};
`;
}
