import type { Locale } from "@/i18n/routing";
import { IMAGES, type CleImage } from "./images.generated";

export { IMAGES, type CleImage };

export function image(cle: CleImage, locale: Locale) {
  const i = IMAGES[cle];
  return { src: i.src, width: i.width, height: i.height, alt: i.alt[locale] };
}
