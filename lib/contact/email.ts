import { SITE } from "@/contenu/site";
import { LIBELLES_TYPE, type Demande, type Langue } from "./schema";

/**
 * Construction des emails du formulaire de contact (logique pure, testée).
 *
 * Règles de sécurité :
 * - tout texte saisi passe par `echapper()` avant d'entrer dans le HTML : un
 *   prénom comme `<a href="…">Confirmez votre compte</a>` deviendrait sinon un
 *   vrai lien dans un email envoyé par notre domaine ;
 * - aucun lien n'est construit à partir d'une saisie (pas de mailto:/tel: vers
 *   le couple) : les seuls liens sont fixes (le site, le téléphone de Cédric) ;
 * - l'accusé de réception, envoyé à l'adresse saisie, ne reprend AUCUN texte
 *   libre (message, lieu, nom) : sinon un robot pourrait s'en servir pour faire
 *   envoyer son propre texte à n'importe qui, signé Spice Events.
 */

export type ConfigEmail = {
  /** Adresse de Cédric, qui reçoit les demandes. */
  destinataire: string;
  /** Expéditeur vérifié dans Resend, ex. « Spice Events <contact@spiceevents.fr> ». */
  expediteur: string;
};

export type EmailPrepare = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

const ECHAPPEMENTS: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Rend un texte saisi inoffensif dans du HTML. */
export function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ECHAPPEMENTS[c]);
}

/** « 2027-06-12 » → « samedi 12 juin 2027 » / « Saturday 12 June 2027 ». */
export function formaterDate(iso: string, langue: Langue): string {
  const [a, m, j] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(a, m - 1, j)))
    // Selon la version d'ICU, l'anglais britannique met ou non une virgule après le jour.
    .replace(",", "");
}

/** « +33612345678 » → « 06 12 34 56 78 » ; les numéros étrangers restent au format international. */
export function formaterTelephone(telephone: string): string {
  if (!/^\+33\d{9}$/.test(telephone)) return telephone;
  return `0${telephone.slice(3)}`.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** « 2027-06-12 » → « 12/06/2027 » (objet de l'email). */
function dateCourte(iso: string): string {
  return iso.split("-").reverse().join("/");
}

// --- Gabarit commun (charte Nocturne du site) ---------------------------------

/** Couleurs du site : nuit, orange du piment, ivoire, sable. */
const COULEURS = { fond: "#141414", carte: "#202020", encart: "#141414", texte: "#f3f3f3", doux: "#b3b3b3", or: "#ff6838", ligne: "#363636" };
/** Titres en capitales condensées (Barlow Condensed sur le site ; les messageries prennent la suivante). */
const POLICE_TITRE = "'Barlow Condensed','Arial Narrow','Helvetica Neue',Arial,sans-serif";
const POLICE_TEXTE = "Helvetica,Arial,sans-serif";

const BANDEAU = {
  fr: ["Vos nuits ont du goût", "Ajoutons-y du piment"],
  en: ["Your nights have flavour", "Let's add some spice"],
} as const;

/** Bouton (lien FIXE seulement : jamais construit à partir d'une saisie). */
function bouton(libelle: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td style="background:${COULEURS.or}">
<a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${POLICE_TEXTE};font-size:13px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;color:${COULEURS.fond};text-decoration:none">${echapper(libelle)}</a>
</td></tr></table>`;
}

/**
 * Enveloppe HTML (styles en ligne : les messageries ignorent les feuilles de
 * style). Titre en capitales, `accroche` en orange à la suite ; `corps` est
 * déjà échappé.
 */
function gabarit(titre: string, accroche: string, corps: string, langue: Langue): string {
  const c = COULEURS;
  const [bandeau1, bandeau2] = BANDEAU[langue];
  return `<!doctype html>
<html lang="${langue}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${echapper(`${titre} ${accroche}`)}</title></head>
<body style="margin:0;padding:0;background:${c.fond};font-family:${POLICE_TEXTE};color:${c.texte}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.fond}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${c.carte};border:1px solid ${c.ligne}">
<tr><td style="padding:28px 32px 0">
<a href="${SITE.url}" style="text-decoration:none"><img src="${SITE.logoEmail}" width="150" height="87" alt="Spice Events" style="display:block;width:150px;height:auto;border:0;font-family:${POLICE_TITRE};font-size:26px;font-weight:bold;text-transform:uppercase;color:${c.texte}"></a>
</td></tr>
<tr><td style="padding:24px 32px 0">
<h1 style="margin:0;font-family:${POLICE_TITRE};font-weight:bold;font-size:34px;line-height:1.02;text-transform:uppercase;color:${c.texte}">${echapper(titre)} <span style="color:${c.or}">${echapper(accroche)}</span></h1>
</td></tr>
<tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.6;color:${c.texte}">${corps}</td></tr>
<tr><td style="background:${c.or};padding:12px 32px;font-family:${POLICE_TITRE};font-size:15px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${c.fond}">
${echapper(bandeau1)} &nbsp;·&nbsp; ${echapper(bandeau2)}
</td></tr>
<tr><td style="padding:16px 32px;font-size:12px;color:${c.doux}">
<a href="${SITE.url}" style="color:${c.or};text-decoration:none">spiceevents.fr</a> · ${echapper(SITE.zone[langue])}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Tableau libellé / valeur ; les valeurs sont échappées ici. */
function tableau(lignes: [string, string][]): string {
  const c = COULEURS;
  const tr = lignes
    .map(
      ([libelle, valeur]) =>
        `<tr><td style="padding:10px 16px 10px 0;border-bottom:1px solid ${c.ligne};color:${c.doux};font-size:11px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;vertical-align:top">${echapper(libelle)}</td>` +
        `<td style="padding:10px 0;border-bottom:1px solid ${c.ligne};color:${c.texte};vertical-align:top">${echapper(valeur)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:15px">${tr}</table>`;
}

/** Version texte du tableau. */
function texteTableau(lignes: [string, string][]): string {
  return lignes.map(([libelle, valeur]) => `${libelle} : ${valeur}`).join("\n");
}

// --- Notification à Cédric (toujours en français) ----------------------------

/** Email à Cédric : toutes les informations ; « Répondre » écrit directement au couple. */
export function emailNotification(demande: Demande, config: ConfigEmail): EmailPrepare {
  const type = LIBELLES_TYPE.fr[demande.type];
  const lignes: [string, string][] = [
    ["Prénoms", demande.prenoms],
    ["Nom", demande.nom],
    ["Email", demande.email],
    ["Téléphone", formaterTelephone(demande.telephone)],
    ["Événement", type],
    ["Date", demande.date ? formaterDate(demande.date, "fr") : "non précisée"],
    ["Lieu", demande.lieu ?? "non précisé"],
    ["Invités", demande.invites !== null ? String(demande.invites) : "non précisé"],
    ["Langue", demande.langue === "fr" ? "français" : "anglais — répondre en anglais"],
  ];

  const sujet = ["Nouvelle demande", type, demande.date ? dateCourte(demande.date) : null, demande.prenoms]
    .filter(Boolean)
    .join(" — ");

  const messageHtml = echapper(demande.message).replace(/\n/g, "<br>");
  const html = gabarit(
    "Nouvelle demande.",
    "Ça pimente !",
    `${tableau(lignes)}
<p style="margin:24px 0 8px;color:${COULEURS.doux};font-size:11px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase">Message</p>
<p style="margin:0;padding:16px 18px;background:${COULEURS.encart};border-left:3px solid ${COULEURS.or}">${messageHtml}</p>
<p style="margin:24px 0 0;font-size:13px;color:${COULEURS.doux}">Répondez directement à cet email pour écrire au couple.</p>
${bouton("Ouvrir dans le back office", `${SITE.url}/admin/demandes`)}`,
    "fr",
  );
  const text = `Nouvelle demande de contact\n\n${texteTableau(lignes)}\n\nMessage :\n${demande.message}\n\nRépondez directement à cet email pour écrire au couple.`;

  return { from: config.expediteur, to: config.destinataire, replyTo: demande.email, subject: sujet, html, text };
}

// --- Accusé de réception au couple (dans sa langue) --------------------------

const ACCUSE = {
  fr: {
    sujet: "Votre demande est bien arrivée — Spice Events",
    titre: "Votre demande",
    accroche: "est bien arrivée.",
    animations: "Découvrir nos animations",
    lienAnimations: "/animations",
    bonjour: (p: string) => `Bonjour ${p},`,
    merci: "Merci pour votre message. Cédric le lit personnellement et revient vers vous dans les meilleurs délais pour un premier échange, de vive voix ou en visio.",
    rappel: "Pour mémoire :",
    evenement: "Événement",
    date: "Date",
    invites: "Invités",
    urgent: "Une question qui ne peut pas attendre ? Appelez Cédric au",
    signature: "À très vite,\nCédric Allard — Spice Events",
  },
  en: {
    sujet: "We've received your request — Spice Events",
    titre: "We've received",
    accroche: "your request.",
    animations: "Discover our entertainment",
    lienAnimations: "/en/entertainment",
    bonjour: (p: string) => `Hello ${p},`,
    merci: "Thank you for getting in touch. Cédric reads every request himself and will get back to you as soon as possible to arrange a first conversation, in person or by video call.",
    rappel: "For your records:",
    evenement: "Event",
    date: "Date",
    invites: "Guests",
    urgent: "A question that can't wait? Call Cédric on",
    signature: "Speak soon,\nCédric Allard — Spice Events",
  },
} as const;

/** Accusé de réception, envoyé au couple ; « Répondre » écrit à Cédric. */
export function emailAccuse(demande: Demande, config: ConfigEmail): EmailPrepare {
  const l = demande.langue;
  const t = ACCUSE[l];
  // Seules des valeurs contrôlées (liste fermée, date, nombre) sont rappelées.
  const lignes: [string, string][] = [[t.evenement, LIBELLES_TYPE[l][demande.type]]];
  if (demande.date) lignes.push([t.date, formaterDate(demande.date, l)]);
  if (demande.invites !== null) lignes.push([t.invites, String(demande.invites)]);

  const telephoneAffiche = l === "fr" ? SITE.telephoneAffiche : "+33 6 76 40 37 76";
  const html = gabarit(
    t.titre,
    t.accroche,
    `<p style="margin:16px 0 0">${echapper(t.bonjour(demande.prenoms))}</p>
<p style="margin:16px 0 0">${echapper(t.merci)}</p>
<p style="margin:24px 0 0;color:${COULEURS.doux};font-size:11px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase">${echapper(t.rappel)}</p>
${tableau(lignes)}
<p style="margin:16px 0 0">${echapper(t.urgent)} <a href="tel:${SITE.telephone}" style="color:${COULEURS.or}">${telephoneAffiche}</a>.</p>
<p style="margin:24px 0 0">${echapper(t.signature).replace(/\n/g, "<br>")}</p>
${bouton(t.animations, `${SITE.url}${t.lienAnimations}`)}`,
    l,
  );
  const text = `${t.bonjour(demande.prenoms)}\n\n${t.merci}\n\n${t.rappel}\n${texteTableau(lignes)}\n\n${t.urgent} ${telephoneAffiche}.\n\n${t.signature}\n${SITE.url}`;

  return { from: config.expediteur, to: demande.email, replyTo: config.destinataire, subject: t.sujet, html, text };
}
