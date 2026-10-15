import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { estExterne, hrefInterne } from "@/lib/journal/liens";

/** Lien du corps d'un article : `Link` pour les pages du site, nouvel onglet pour l'extérieur. */
export function LienArticle({ href = "", children, ...props }: ComponentProps<"a">) {
  const interne = hrefInterne(href);
  if (interne) {
    return <Link href={interne}>{children}</Link>;
  }
  if (estExterne(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
