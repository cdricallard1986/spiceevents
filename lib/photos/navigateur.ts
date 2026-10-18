import { COTE_MAX, QUALITE_REDUCTION, dimensionsReduites, estTypeImage, type TypeImage } from "./envoi";

/**
 * Préparation d'une photo dans le navigateur, avant l'envoi direct à Storage :
 * lecture de ses dimensions (enregistrées avec la photo, pour que `next/image`
 * réserve la bonne place) et réduction des très grandes photos (côté le plus
 * long > 3 000 px) en JPEG qualité 0,85 — inutile de stocker 15 Mo pour un
 * affichage à l'écran.
 */

export type FichierPrepare = {
  fichier: Blob;
  type: TypeImage;
  largeur: number;
  hauteur: number;
  /** La photo a été réduite (les dimensions sont celles de la version envoyée). */
  reduite: boolean;
};

type Decodee = { source: CanvasImageSource; largeur: number; hauteur: number; liberer: () => void };

/** Décode l'image (orientation EXIF appliquée) : `createImageBitmap`, sinon un élément `<img>`. */
async function decoder(fichier: Blob): Promise<Decodee> {
  if (typeof createImageBitmap === "function") {
    try {
      const b = await createImageBitmap(fichier, { imageOrientation: "from-image" });
      return { source: b, largeur: b.width, hauteur: b.height, liberer: () => b.close() };
    } catch {
      // Format que createImageBitmap ne sait pas lire ici : on essaie avec <img>.
    }
  }
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, largeur: img.naturalWidth, hauteur: img.naturalHeight, liberer: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Cette photo n'a pas pu être lue par le navigateur (fichier abîmé ou format non pris en charge).");
  }
}

function versBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resoudre, rejeter) =>
    canvas.toBlob((b) => (b ? resoudre(b) : rejeter(new Error("La réduction de la photo a échoué."))), "image/jpeg", QUALITE_REDUCTION),
  );
}

export async function preparerPhoto(fichier: File): Promise<FichierPrepare> {
  if (!estTypeImage(fichier.type)) throw new Error("Format refusé : envoyez une photo JPEG, PNG, WebP ou AVIF.");
  const d = await decoder(fichier);
  try {
    const cible = dimensionsReduites(d.largeur, d.hauteur, COTE_MAX);
    if (!cible) return { fichier, type: fichier.type, largeur: d.largeur, hauteur: d.hauteur, reduite: false };
    const canvas = document.createElement("canvas");
    canvas.width = cible.largeur;
    canvas.height = cible.hauteur;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("La réduction de la photo a échoué (navigateur).");
    // Fond clair : une photo PNG transparente ne devient pas noire en JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cible.largeur, cible.hauteur);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(d.source, 0, 0, cible.largeur, cible.hauteur);
    const blob = await versBlob(canvas);
    return { fichier: blob, type: "image/jpeg", largeur: cible.largeur, hauteur: cible.hauteur, reduite: true };
  } finally {
    d.liberer();
  }
}
