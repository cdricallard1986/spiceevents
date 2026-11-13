import type { CleImage } from "@/lib/images";
import type { PhotoAffichee } from "@/lib/photos/types";
import { Photo } from "@/components/ui/Photo";

/**
 * Tire une photo au hasard à chaque visite, sans rendre la page dynamique : toutes
 * les photos sont dans le HTML statique, masquées sauf la première, et un court
 * script (exécuté pendant la lecture de la page, avant le premier affichage) en
 * révèle une autre. Les photos masquées, chargées en différé, ne sont jamais
 * téléchargées. Sans JavaScript : la première photo.
 */
export const SCRIPT_TIRAGE =
  "(function(){var f=document.currentScript.parentNode.children,n=f.length-1,i=Math.floor(Math.random()*n);if(i>0){f[0].hidden=true;f[i].hidden=false}})()";

/** Une photo : clé du registre, ou photo lue en base (diaporama géré dans le back office). */
export type PhotoFond = CleImage | PhotoAffichee;

export function FondAleatoire({ images, sizes = "100vw" }: { images: readonly PhotoFond[]; sizes?: string }) {
  return (
    <div className="absolute inset-0">
      {images.map((p, i) => (
        // L’attribut `hidden` change avant l’hydratation : écart attendu.
        <div key={typeof p === "string" ? p : p.src} className="absolute inset-0" hidden={i > 0} suppressHydrationWarning>
          {typeof p === "string" ? <Photo cle={p} remplir sizes={sizes} /> : <Photo photo={p} remplir sizes={sizes} />}
        </div>
      ))}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TIRAGE }} />
    </div>
  );
}
