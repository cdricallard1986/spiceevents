/**
 * Envoi direct des photos navigateur → Supabase Storage (règle de Cédric :
 * jamais par une Server Action, plafonnée à ~4,5 Mo sur Vercel). Logique pure
 * partagée par les Server Actions et le navigateur.
 *
 * 1. `creerUrlEnvoi` (Server Action) : garde, Zod, chemin sûr calculé ici,
 *    `createSignedUploadUrl` → `{ chemin, jeton }` ;
 * 2. le navigateur envoie le fichier avec `uploadToSignedUrl` ;
 * 3. `enregistrerPhoto` (Server Action) : vérifie le chemin, enregistre les
 *    métadonnées (dimensions, textes alternatifs).
 */

/** Types acceptés (ceux du bucket `medias`, migration 0006) et l'extension de chacun. */
export const TYPES_IMAGE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type TypeImage = keyof typeof TYPES_IMAGE;

export const LISTE_TYPES_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const satisfies readonly TypeImage[];

export function estTypeImage(type: string): type is TypeImage {
  return Object.hasOwn(TYPES_IMAGE, type);
}

/** 15 Mo : la limite du bucket. */
export const TAILLE_MAX_OCTETS = 15 * 1024 * 1024;

/** Côté le plus long au-delà duquel le navigateur réduit la photo avant l'envoi. */
export const COTE_MAX = 3000;
/** Qualité JPEG des photos réduites. */
export const QUALITE_REDUCTION = 0.85;

/** Chemin d'un fichier du bucket : celui qu'impose la table `photos` (CHECK de la migration 0006). */
export const MOTIF_CHEMIN_STOCKAGE = /^galeries\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/;

/** Chemin acceptable pour une photo envoyée : le motif de la base, sans dossier vide. */
export function estCheminStockage(chemin: string): boolean {
  return MOTIF_CHEMIN_STOCKAGE.test(chemin) && !chemin.includes("//") && !/\/\./.test(chemin);
}

/**
 * Chemin sûr d'un nouvel envoi : `galeries/<aaaa>/<mm>/<horodatage>-<aléa>.<ext>`.
 * L'extension vient du type MIME (validé), jamais du nom du fichier.
 */
export function cheminEnvoi(type: TypeImage, maintenant: Date, alea: string): string {
  const aaaa = String(maintenant.getUTCFullYear());
  const mm = String(maintenant.getUTCMonth() + 1).padStart(2, "0");
  const propre = alea.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (propre.length < 6) throw new Error("Aléa trop court pour un nom de fichier.");
  return `galeries/${aaaa}/${mm}/${maintenant.getTime()}-${propre}.${TYPES_IMAGE[type]}`;
}

/** Dimensions après réduction (côté le plus long ≤ `max`), ou null si la photo est déjà assez petite. */
export function dimensionsReduites(largeur: number, hauteur: number, max: number = COTE_MAX): { largeur: number; hauteur: number } | null {
  const cote = Math.max(largeur, hauteur);
  if (cote <= max) return null;
  const k = max / cote;
  return { largeur: Math.max(1, Math.round(largeur * k)), hauteur: Math.max(1, Math.round(hauteur * k)) };
}

/**
 * Texte alternatif proposé à partir du nom du fichier, à corriger : extension,
 * tirets et soulignés retirés. Un nom d'appareil photo (« IMG_1234 »,
 * « DSC01234 ») ne décrit rien : rien n'est proposé.
 */
export function altDepuisNomFichier(nom: string): string {
  const base = nom
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_\-.+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (base === "" || /^(img|dsc|dscn|dscf|pxl|p|photo|image|screenshot|capture)?\s*[\d\s]+(?:\s*\(\d+\))?$/i.test(base)) return "";
  const texte = base.charAt(0).toUpperCase() + base.slice(1);
  return Array.from(texte).slice(0, 300).join("");
}

/** « 4,2 Mo », « 850 ko ». */
export function formaterTaille(octets: number): string {
  if (octets >= 1024 * 1024) return `${(octets / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
  return `${Math.max(1, Math.round(octets / 1024)).toLocaleString("fr-FR")} ko`;
}
