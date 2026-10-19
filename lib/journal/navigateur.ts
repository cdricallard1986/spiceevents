import { TAILLE_MAX_OCTETS, estTypeImage, formaterTaille, type TypeImage } from "@/lib/photos/envoi";
import { BUCKET_MEDIAS } from "@/lib/photos/constantes";
import { preparerPhoto, type FichierPrepare } from "@/lib/photos/navigateur";
import { clientNavigateur } from "@/lib/supabase/client";

/**
 * Envoi des photos d'un article depuis le navigateur (couverture et photos du
 * texte) : préparation (dimensions, réduction des très grandes photos), puis
 * envoi DIRECT à Storage avec l'URL signée de `creerUrlEnvoiArticle` — jamais
 * par une Server Action (limite de 4,5 Mo de Vercel). Remplacé dans les tests.
 */
export type OutilsEnvoiArticle = {
  preparer: (fichier: File) => Promise<FichierPrepare>;
  televerser: (chemin: string, jeton: string, fichier: Blob, type: TypeImage) => Promise<void>;
  /** Fichier d'une photo du site (`/images/…`), pour en faire une couverture du journal. */
  lireFichierDuSite: (chemin: string) => Promise<File>;
};

export const OUTILS_ENVOI_ARTICLE: OutilsEnvoiArticle = {
  preparer: preparerPhoto,
  async televerser(chemin, jeton, fichier, type) {
    const { error } = await clientNavigateur()
      .storage.from(BUCKET_MEDIAS)
      // Nom de fichier unique, jamais réécrit : il peut rester en cache un an.
      .uploadToSignedUrl(chemin, jeton, fichier, { contentType: type, cacheControl: "31536000" });
    if (error) throw new Error(error.message || "le stockage a refusé le fichier");
  },
  async lireFichierDuSite(chemin) {
    if (!/^\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(chemin)) throw new Error("Photo du site inconnue.");
    const reponse = await fetch(chemin, { credentials: "same-origin" });
    if (!reponse.ok) throw new Error("La photo du site n'a pas pu être lue.");
    const blob = await reponse.blob();
    const nom = chemin.split("/").pop() ?? "photo.jpg";
    return new File([blob], nom, { type: blob.type || "image/jpeg" });
  },
};

export type DemandeEnvoi = (entree: { nomFichier: string; type: TypeImage; taille: number }) => Promise<
  { ok: true; chemin: string; jeton: string } | { ok: false; message: string }
>;

export type PhotoEnvoyee = { chemin: string; largeur: number; hauteur: number; reduite: boolean };

/** Prépare, demande l'URL signée et envoie une photo ; une erreur porte un message à montrer tel quel. */
export async function envoyerPhotoArticle(fichier: File, creerUrlEnvoi: DemandeEnvoi, outils: OutilsEnvoiArticle): Promise<PhotoEnvoyee> {
  if (!estTypeImage(fichier.type)) throw new Error("Format refusé : envoyez une photo JPEG, PNG, WebP ou AVIF.");
  const prepare = await outils.preparer(fichier);
  if (prepare.fichier.size > TAILLE_MAX_OCTETS) {
    throw new Error(`Fichier trop lourd (${formaterTaille(prepare.fichier.size)}) : ${formaterTaille(TAILLE_MAX_OCTETS)} au maximum.`);
  }
  const url = await creerUrlEnvoi({ nomFichier: fichier.name || "photo", type: prepare.type, taille: prepare.fichier.size });
  if (!url.ok) throw new Error(url.message);
  await outils.televerser(url.chemin, url.jeton, prepare.fichier, prepare.type);
  return { chemin: url.chemin, largeur: prepare.largeur, hauteur: prepare.hauteur, reduite: prepare.reduite };
}
