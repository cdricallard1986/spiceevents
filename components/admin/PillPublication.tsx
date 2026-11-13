import { CLASSES_PASTILLE } from "./champs";

/** Publié sur le site, ou non (avis, fiches DJ). */
export function PillPublication({ publie }: { publie: boolean }) {
  return (
    <span className={`${CLASSES_PASTILLE} ${publie ? "border-succes/60 text-succes" : "border-ligne text-sable"}`}>{publie ? "Publié" : "Non publié"}</span>
  );
}
