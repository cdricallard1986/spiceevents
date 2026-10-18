import type { IconeSection } from "@/lib/admin/navigation";

/** Tracés des icônes du back office (trait fin, comme le burger de l'en-tête du site). */
const TRACES: Record<IconeSection | "burger" | "fermer" | "replier" | "deplier" | "site" | "sortie", string> = {
  accueil: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  avis: "M4 5h16v11H9l-5 4V5zM8 9h8M8 12h5",
  journal: "M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5",
  photos: "M3 6h18v13H3zM3 15l5-5 4 4 3-3 6 6M15.5 9.5h.01",
  demandes: "M3 6h18v12H3zM3 7l9 6 9-6",
  tests: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 14h9",
  emails: "M4 12l16-8-6 16-3-7-7-1zM11 13l9-9",
  burger: "M3 7h18M3 12h18M3 17h18",
  fermer: "M6 6l12 12M18 6L6 18",
  replier: "M15 6l-6 6 6 6",
  deplier: "M9 6l6 6-6 6",
  site: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  sortie: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
};

export type NomIcone = keyof typeof TRACES;

export function Icone({ nom, className = "size-5" }: { nom: NomIcone; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d={TRACES[nom]} />
    </svg>
  );
}
