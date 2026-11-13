import type { StatutArticle } from "@/lib/journal/types";
import { CLASSES_PASTILLE } from "./champs";


/** Pastille du statut d'un article : publié, brouillon, ou retiré du site (brouillon déjà publié une fois). */
export function PillArticle({ statut, dejaPublie }: { statut: StatutArticle; dejaPublie: boolean }) {
  if (statut === "publie") return <span className={`${CLASSES_PASTILLE} border-succes/60 text-succes`}>Publié</span>;
  return <span className={`${CLASSES_PASTILLE} border-ligne text-sable`}>{dejaPublie ? "Retiré du site" : "Brouillon"}</span>;
}
