import Image from "next/image";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { image, type CleImage } from "@/lib/images";

type Props = {
  cle: CleImage;
  /** Largeur affichée, pour que le navigateur télécharge la bonne taille. */
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Remplit son parent (qui doit être `relative`) au lieu d'avoir sa taille propre. */
  remplir?: boolean;
};

export function Photo({ cle, sizes, className = "", priority = false, remplir = false }: Props) {
  const locale = useLocale() as Locale;
  const i = image(cle, locale);
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
