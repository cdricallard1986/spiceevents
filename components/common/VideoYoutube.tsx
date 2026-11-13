import type { Locale } from "@/i18n/routing";
import { adresseLecteur, type Video } from "@/contenu/videos";
import { video as donneesVideo } from "@/lib/seo/donneesStructurees";
import { JsonLd } from "./JsonLd";

/**
 * Vidéo YouTube de la chaîne Spice Events, au format 16/9 : lecteur en mode
 * confidentialité renforcée chargé seulement à l'approche (aucun cookie avant la
 * lecture), et ses données structurées VideoObject pour Google.
 */
export function VideoYoutube({ video, locale, className = "" }: { video: Video; locale: Locale; className?: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden border border-ligne bg-nuit ${className}`}>
      <iframe
        src={adresseLecteur(video.id)}
        title={video.titre[locale]}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full"
      />
      <JsonLd donnees={donneesVideo({ id: video.id, titre: video.titre[locale], description: video.description[locale], date: video.date })} />
    </div>
  );
}
