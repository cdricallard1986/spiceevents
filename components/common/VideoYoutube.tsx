import type { Locale } from "@/i18n/routing";
import type { Video } from "@/contenu/videos";
import { video as donneesVideo } from "@/lib/seo/donneesStructurees";
import { JsonLd } from "./JsonLd";
import { LecteurYoutube } from "./LecteurYoutube";

/**
 * Vidéo YouTube de la chaîne Spice Events, au format 16/9 : image d’aperçu et
 * bouton lecture, lecteur en mode confidentialité renforcée chargé seulement au
 * clic (aucun cookie avant), et ses données structurées VideoObject pour Google.
 */
export function VideoYoutube({ video, locale, className = "" }: { video: Video; locale: Locale; className?: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden border border-ligne bg-nuit ${className}`}>
      <LecteurYoutube id={video.id} titre={video.titre[locale]} libelleLecture={locale === "fr" ? "Lire la vidéo" : "Play the video"} />
      <JsonLd donnees={donneesVideo({ id: video.id, titre: video.titre[locale], description: video.description[locale], date: video.date })} />
    </div>
  );
}
