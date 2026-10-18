import Image from "next/image";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { image, type CleImage } from "@/lib/images";
import type { PhotoAffichee } from "@/lib/photos/types";

type Props = {
  /** Largeur affichée, pour que le navigateur télécharge la bonne taille. */
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Remplit son parent (qui doit être `relative`) au lieu d'avoir sa taille propre. */
  remplir?: boolean;
} & (
  | {
      /** Une image du registre (`lib/images.generated.ts`), texte alternatif dans la langue de la page. */
      cle: CleImage;
      photo?: never;
    }
  | {
      /** Une photo de galerie lue en base : fichier du site ou du bucket Supabase, déjà dans la bonne langue. */
      photo: PhotoAffichee;
      cle?: never;
    }
);

export function Photo({ cle, photo, sizes, className = "", priority = false, remplir = false }: Props) {
  const locale = useLocale() as Locale;
  const i = photo ?? image(cle, locale);
  if (remplir) {
    return <Image src={i.src} alt={i.alt} fill sizes={sizes} priority={priority} quality={70} className={`object-cover ${className}`} />;
  }
  return (
    <Image
      src={i.src}
      alt={i.alt}
      width={i.width}
      height={i.height}
      sizes={sizes}
      priority={priority}
      quality={70}
      className={`object-cover ${className}`}
    />
  );
}
