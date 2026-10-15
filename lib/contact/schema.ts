import { z } from "zod";
import { CHAMPS, LANGUES, LIMITES, TYPES_EVENEMENT, type Champ, type Langue, type TypeEvenement } from "./constantes";

/**
 * Validation du formulaire de contact (logique pure, testée).
 * La sécurité ne dépend jamais du navigateur : ce schéma est appliqué par la
 * Server Action, le formulaire ne fait qu'afficher les erreurs renvoyées.
 */

export { CHAMPS, LANGUES, LIBELLES_TYPE, LIMITES, TYPES_EVENEMENT } from "./constantes";
export type { Champ, Langue, TypeEvenement } from "./constantes";

/** En dessous, l'envoi est trop rapide pour un humain : c'est un robot. */
export const DELAI_MINIMUM_MS = 3000;

/** Erreurs par champ ; `formulaire` pour ce qui ne dépend pas d'un champ visible. */
export type ErreursChamps = Partial<Record<Champ | "formulaire", string>>;

export type Demande = {
  prenoms: string;
  nom: string;
  email: string;
  /** Format international : +33612345678. */
  telephone: string;
  type: TypeEvenement;
  /** AAAA-MM-JJ. */
  date: string | null;
  lieu: string | null;
  invites: number | null;
  message: string;
  langue: Langue;
  /** Champ piège : invisible pour un humain, donc vide. */
  site_web: string;
  /** Horodatages (ms) d'ouverture et d'envoi du formulaire, pris par le navigateur. */
  ouvert_le: number;
  envoye_le: number;
};

const MESSAGES = {
  fr: {
    prenoms: "Indiquez vos prénoms.",
    nom: "Indiquez votre nom.",
    lettres: "Lettres, espaces, tirets et apostrophes uniquement.",
    trop_long: (max: number) => `${max} caractères maximum.`,
    email: "Indiquez une adresse email valide.",
    telephone: "Indiquez un numéro valide (ex. 06 12 34 56 78 ou +44 20 7946 0958).",
    type: "Choisissez le type d'événement.",
    date: "Indiquez une date valide.",
    date_passee: "Cette date est déjà passée.",
    invites: `Indiquez un nombre entier entre 1 et ${LIMITES.invitesMax}.`,
    message: "Dites-nous quelques mots sur votre projet.",
    formulaire: "Le formulaire n'a pas pu être vérifié. Rechargez la page puis réessayez.",
  },
  en: {
    prenoms: "Please enter your first names.",
    nom: "Please enter your surname.",
    lettres: "Letters, spaces, hyphens and apostrophes only.",
    trop_long: (max: number) => `${max} characters maximum.`,
    email: "Please enter a valid email address.",
    telephone: "Please enter a valid number (e.g. +44 20 7946 0958 or 06 12 34 56 78).",
    type: "Please choose the type of event.",
    date: "Please enter a valid date.",
    date_passee: "This date has already passed.",
    invites: `Please enter a whole number between 1 and ${LIMITES.invitesMax}.`,
    message: "Please tell us a few words about your plans.",
    formulaire: "The form could not be verified. Please reload the page and try again.",
  },
} as const;

/** Numéro saisi → format international (+33…), ou null s'il n'est pas plausible. */
export function normaliserTelephone(saisie: string): string | null {
  const s = saisie.trim();
  // Seuls chiffres, +, espaces et séparateurs usuels sont admis.
  if (!/^[+\d][\d\s.\-()/]*$/.test(s)) return null;
  let n = s.replace(/[\s.\-()/]/g, "");
  if (n.startsWith("00")) n = `+${n.slice(2)}`;
  // Format national français : 0X XX XX XX XX.
  if (/^0[1-9]\d{8}$/.test(n)) return `+33${n.slice(1)}`;
  if (!n.startsWith("+")) return null;
  // « +33 (0)6… » : le 0 national est en trop.
  if (/^\+330\d{9}$/.test(n)) n = `+33${n.slice(4)}`;
  if (n.startsWith("+33")) return /^\+33[1-9]\d{8}$/.test(n) ? n : null;
  // E.164 : indicatif sans 0 initial, 15 chiffres au plus.
  return /^\+[1-9]\d{7,14}$/.test(n) ? n : null;
}

/** Date du jour à Paris (AAAA-MM-JJ) : c'est elle qui compte pour une date « passée ». */
export function dateDuJourParis(maintenant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    maintenant,
  );
}

function dateExiste(iso: string): boolean {
  const [a, m, j] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
}

/** Chaîne vide (ou absente) → undefined, pour les champs facultatifs. */
const vide = (v: unknown) => (typeof v !== "string" || v.trim() === "" ? undefined : v);
/** Espaces multiples et retours à la ligne → un seul espace (champs d'une ligne). */
const uneLigne = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v);

function creerSchema(langue: Langue, aujourdhui: string) {
  const m = MESSAGES[langue];

  // Prénoms et nom sont repris dans les emails : on n'y accepte ni lien ni
  // adresse web (« arnaque.com »), pour qu'ils ne servent pas à de l'hameçonnage.
  const nomPropre = (requis: string) =>
    z.preprocess(
      uneLigne,
      z
        .string({ error: requis })
        .min(1, { error: requis })
        .max(LIMITES.nom, { error: m.trop_long(LIMITES.nom) })
        .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'’\-&.,]*$/u, { error: m.lettres })
        .refine((v) => !/\.\p{L}/u.test(v), { error: m.lettres }),
    );

  return z.object({
    prenoms: nomPropre(m.prenoms),
    nom: nomPropre(m.nom),
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.email({ error: m.email }).max(LIMITES.email, { error: m.email }),
    ),
    telephone: z
      .string({ error: m.telephone })
      .refine((v) => normaliserTelephone(v) !== null, { error: m.telephone })
      .transform((v) => normaliserTelephone(v) as string),
    type: z.enum(TYPES_EVENEMENT, { error: m.type }),
    date: z.preprocess(
      vide,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { error: m.date })
        .refine(dateExiste, { error: m.date })
        .refine((v) => v >= aujourdhui, { error: m.date_passee })
        .nullish()
        .transform((v) => v ?? null),
    ),
    lieu: z.preprocess(
      (v) => vide(uneLigne(v)),
      z
        .string()
        .max(LIMITES.lieu, { error: m.trop_long(LIMITES.lieu) })
        .nullish()
        .transform((v) => v ?? null),
    ),
    invites: z.preprocess(
      vide,
      z
        .string()
        .trim()
        .regex(/^\d{1,6}$/, { error: m.invites })
        .transform(Number)
        .refine((n) => n >= 1 && n <= LIMITES.invitesMax, { error: m.invites })
        .nullish()
        .transform((v) => v ?? null),
    ),
    message: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim() : v),
      z
        .string({ error: m.message })
        .min(1, { error: m.message })
        .max(LIMITES.message, { error: m.trop_long(LIMITES.message) }),
    ),
    langue: z.enum(LANGUES).catch("fr"),
    site_web: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string()),
    ouvert_le: z.coerce.number({ error: m.formulaire }).int({ error: m.formulaire }).positive({ error: m.formulaire }),
    envoye_le: z.coerce.number({ error: m.formulaire }).int({ error: m.formulaire }).positive({ error: m.formulaire }),
  });
}

export type ResultatValidation =
  | { ok: true; langue: Langue; demande: Demande }
  | { ok: false; langue: Langue; erreurs: ErreursChamps };

/** Valide les champs bruts du formulaire. `maintenant` sert à refuser une date passée. */
export function validerDemande(brut: Record<string, unknown>, maintenant: Date = new Date()): ResultatValidation {
  const langue: Langue = brut.langue === "en" ? "en" : "fr";
  // Un horodatage vide doit échouer (Number("") vaudrait 0, refusé par positive()).
  const resultat = creerSchema(langue, dateDuJourParis(maintenant)).safeParse(brut);
  if (resultat.success) return { ok: true, langue, demande: resultat.data };

  const erreurs: ErreursChamps = {};
  for (const probleme of resultat.error.issues) {
    const champ = probleme.path[0] as Champ;
    // Les champs techniques (horodatages) remontent comme une erreur générale.
    const cle = champ === "ouvert_le" || champ === "envoye_le" ? "formulaire" : champ;
    erreurs[cle] ??= probleme.message;
  }
  return { ok: false, langue, erreurs };
}

/** Champ piège rempli, ou formulaire envoyé trop vite : ce n'est pas un humain. */
export function estRobot(demande: Demande): boolean {
  return demande.site_web.trim() !== "" || demande.envoye_le - demande.ouvert_le < DELAI_MINIMUM_MS;
}

/** Lit les champs connus d'un FormData, en texte (un fichier envoyé à la place compte pour vide). */
export function lireFormulaire(formulaire: FormData): Record<Champ, string> {
  const lu = {} as Record<Champ, string>;
  for (const champ of CHAMPS) {
    const v = formulaire.get(champ);
    lu[champ] = typeof v === "string" ? v : "";
  }
  return lu;
}
