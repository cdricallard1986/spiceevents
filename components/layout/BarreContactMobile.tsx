"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SITE } from "@/contenu/site";
import { lienAppel, lienWhatsAppSite } from "@/lib/contact/liens";

/** Défilement (px) à partir duquel la barre apparaît : après les boutons du haut de page. */
const SEUIL = 480;

/**
 * Barre de contact fixe en bas de l’écran, sur téléphone seulement (sur
 * ordinateur, le bouton « Vérifier ma date » est déjà dans l’en-tête) :
 * « Vérifier ma date », appeler, WhatsApp. Elle apparaît une fois les boutons
 * du haut de page dépassés, et jamais sur la page Contact (le formulaire y est).
 * Menu ouvert (`data-menu="ouvert"` posé par l’en-tête sur <html>) : elle se retire.
 */
export function BarreContactMobile() {
  const t = useTranslations("nav");
  const locale = useLocale() as "fr" | "en";
  const chemin = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const surDefilement = () => setVisible(window.scrollY > SEUIL);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, [chemin]);

  if (chemin === "/contact") return null;

  const carre = "flex size-12 shrink-0 items-center justify-center border border-ivoire/40 text-ivoire transition-colors active:border-or active:text-or";
  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-ligne bg-nuit/95 backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none sm:hidden [[data-menu=ouvert]_&]:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-stretch gap-2 p-2">
        <Link href="/contact" className="flex h-12 flex-1 items-center justify-center gap-2 bg-or text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-nuit active:bg-or-clair">
          {t("devis")} <span aria-hidden="true">→</span>
        </Link>
        <a href={lienAppel()} aria-label={t("appeler", { numero: SITE.telephoneAffiche })} className={carre}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
          </svg>
        </a>
        <a href={lienWhatsAppSite(locale)} target="_blank" rel="noopener" aria-label={t("whatsapp")} className={carre}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.700 6.700 0 01-2-1.200 7.400 7.400 0 01-1.400-1.700c-.1-.2 0-.4.1-.5l.4-.4.2-.4a.5.5 0 000-.4c0-.1-.6-1.400-.8-1.900s-.4-.4-.6-.4h-.5a1 1 0 00-.7.300 2.900 2.900 0 00-.9 2.200 5 5 0 001.100 2.700 11.500 11.500 0 004.400 3.900c.600.300 1.100.400 1.500.500a3.600 3.600 0 001.600.100 2.700 2.700 0 001.800-1.200 2.200 2.200 0 00.200-1.200c-.1-.100-.300-.200-.500-.300z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
