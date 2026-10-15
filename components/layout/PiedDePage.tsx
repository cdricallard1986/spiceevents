import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/contenu/site";
import { Logo } from "./Logo";
import { menuPour } from "./navigation";

export async function PiedDePage() {
  const locale = await getLocale();
  const t = await getTranslations("pied");
  const tn = await getTranslations("nav");
  const annee = new Date().getFullYear();

  const titre = "mb-5 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-or";
  const lien = "text-sable transition-colors hover:text-ivoire";

  return (
    <footer className="border-t border-ligne bg-nuit-2">
      <div className="conteneur grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Link href="/" aria-label={tn("accueil")} className="text-2xl">
            <Logo />
          </Link>
          <p className="max-w-sm text-sable">{t("accroche")}</p>
          <p className="text-sm text-ivoire">
            {t("awards")} <span className="text-or">{SITE.weddingAwards.join(" · ")}</span>
          </p>
        </div>

        <div>
          <p className={titre}>{t("explorer")}</p>
          <ul className="flex flex-col gap-2.5">
            {menuPour(locale).map((e) => (
              <li key={e.href}>
                <Link href={e.href} className={lien}>
                  {tn(e.cle)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/a-propos" className={lien}>{tn("aPropos")}</Link>
            </li>
            <li>
              <Link href="/faq" className={lien}>{tn("faq")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className={titre}>{t("contact")}</p>
          <ul className="flex flex-col gap-2.5">
            <li>
              <a href={`tel:${SITE.telephone}`} className={lien}>{SITE.telephoneAffiche}</a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className={lien}>{SITE.email}</a>
            </li>
            <li className="text-sable">{SITE.zone[locale === "fr" ? "fr" : "en"]}</li>
            <li className="pt-2">
              <Link href="/contact" className="text-or underline-offset-4 hover:underline">{tn("devis")} →</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className={titre}>{t("suivre")}</p>
          <ul className="flex flex-col gap-2.5">
            <li><a href={SITE.reseaux.instagram} className={lien} rel="noopener" target="_blank">Instagram</a></li>
            <li><a href={SITE.reseaux.facebook} className={lien} rel="noopener" target="_blank">Facebook</a></li>
            <li><a href={SITE.reseaux.youtube} className={lien} rel="noopener" target="_blank">YouTube</a></li>
            <li><a href={SITE.reseaux.mariagesNet} className={lien} rel="noopener" target="_blank">Mariages.net</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ligne">
        <div className="conteneur flex flex-wrap items-center justify-between gap-4 py-6 text-sm text-sable">
          <p>© {annee} {SITE.nom}. {t("droits")}</p>
          <ul className="flex flex-wrap gap-6">
            {locale === "fr" && (
              <li><Link href="/recrutement" className="hover:text-ivoire">{t("recrutement")}</Link></li>
            )}
            <li><Link href="/mentions-legales" className="hover:text-ivoire">{t("mentions")}</Link></li>
            <li><Link href="/confidentialite" className="hover:text-ivoire">{t("confidentialite")}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
