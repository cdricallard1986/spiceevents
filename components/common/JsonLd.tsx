import { serialiser } from "@/lib/seo/donneesStructurees";

/** Insère des données structurées schema.org dans la page. */
export function JsonLd({ donnees }: { donnees: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiser(donnees) }} />;
}
