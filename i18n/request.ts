import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { typographier } from "../lib/typographie";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale;
  return {
    locale,
    // Typographie française (espaces fines insécables) sur tous les textes de l'interface.
    messages: typographier((await import(`../messages/${locale}.json`)).default),
  };
});
