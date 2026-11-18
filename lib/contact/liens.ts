import { SITE } from "@/contenu/site";

/**
 * Liens de contact direct du site public (barre fixe sur téléphone) : appel et
 * WhatsApp vers le numéro de Cédric, avec un message d’ouverture pour que la
 * conversation ne commence pas à vide.
 */

const OUVERTURE = {
  fr: "Bonjour Cédric, je vous écris depuis votre site spiceevents.fr.",
  en: "Hello Cédric, I’m writing from your website spiceevents.fr.",
} as const;

/** `tel:+33676403776` */
export function lienAppel(telephone: string = SITE.telephone): string {
  return `tel:${telephone}`;
}

/** `https://wa.me/33676403776?text=…` (numéro international sans « + »). */
export function lienWhatsAppSite(locale: "fr" | "en", telephone: string = SITE.telephone): string {
  const numero = telephone.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(OUVERTURE[locale])}`;
}
