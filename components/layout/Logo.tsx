import Image from "next/image";

/**
 * Logo historique de Spice Events (SPICE / EVENTS et le piment), à ne jamais
 * redessiner : il est brodé sur les chemises. Version claire pour les fonds
 * sombres, tirée du PNG haute définition de l’ancien site (lettrage passé en
 * gris clair, piment d’origine). La hauteur se règle avec `className`.
 */
export function Logo({ className = "h-12" }: { className?: string }) {
  return (
    <Image
      src="/marque/logo-spice-clair.png"
      alt="Spice Events — Sonorisation, Éclairage, Animation"
      width={600}
      height={349}
      sizes="200px"
      className={`w-auto ${className}`}
    />
  );
}
