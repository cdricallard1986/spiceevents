import Image from "next/image";

type Props = { src: string; width: number | string; height: number | string; alt: string; legende?: string };

/**
 * Photo insérée dans un article. Les dimensions réelles viennent du document
 * de l'éditeur ; une photo en hauteur est limitée à la hauteur de l'écran.
 * Légende facultative, sous la photo (même style que celle de la galerie).
 */
export function PhotoArticle({ src, width, height, alt, legende }: Props) {
  return (
    <figure className="my-10 md:my-12">
      <Image
        src={src}
        alt={alt}
        width={Number(width)}
        height={Number(height)}
        sizes="(min-width: 768px) 44rem, 100vw"
        quality={70}
        className="max-h-[85svh] object-contain"
      />
      {legende && <figcaption className="mt-3 text-center text-sm text-sable">{legende}</figcaption>}
    </figure>
  );
}
