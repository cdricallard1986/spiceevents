import localFont from "next/font/local";

// Polices auto-hébergées (aucun appel à Google Fonts) : rapide et compatible avec la CSP.
export const policeDisplay = localFont({
  src: [
    { path: "../app/fonts/bodoni-moda-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/bodoni-moda-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../app/fonts/bodoni-moda-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/bodoni-moda-latin-500-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--police-display",
  display: "swap",
});

export const policeTexte = localFont({
  src: [{ path: "../app/fonts/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--police-texte",
  display: "swap",
});
