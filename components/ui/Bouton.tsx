import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

type Variante = "primaire" | "contour" | "lien";

const STYLES: Record<Variante, string> = {
  primaire:
    "inline-flex items-center justify-center bg-or px-7 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-nuit transition-colors hover:bg-or-clair",
  contour:
    "inline-flex items-center justify-center border border-ivoire/60 px-7 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-ivoire transition-colors hover:border-or hover:text-or",
  lien: "inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair",
};

export function classesBouton(variante: Variante = "primaire") {
  return STYLES[variante];
}

/** Lien interne (adresse traduite automatiquement) au style bouton. */
export function Bouton({
  variante = "primaire",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link {...props} className={`${STYLES[variante]} ${className}`} />;
}
