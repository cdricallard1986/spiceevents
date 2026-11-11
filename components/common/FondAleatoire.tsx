import type { CleImage } from "@/lib/images";
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

export function FondAleatoire({ images }: { images: CleImage[] }) {
  return (
    <div className="absolute inset-0">
      {images.map((cle, i) => (
        // L'attribut `hidden` change avant l'hydratation : écart attendu.
        <div key={cle} className="absolute inset-0" hidden={i > 0} suppressHydrationWarning>
          <Photo cle={cle} remplir sizes="100vw" />
        </div>
      ))}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TIRAGE }} />
    </div>
  );
}
