import Image from "next/image";

type Props = { src: string; width: number | string; height: number | string; alt: string };

/**
 * Photo insérée dans un article (MDX). Les dimensions réelles viennent du script de
 * conversion ; une photo en hauteur est limitée à la hauteur de l'écran.
 */
export function PhotoArticle({ src, width, height, alt }: Props) {
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
    </figure>
  );
}
