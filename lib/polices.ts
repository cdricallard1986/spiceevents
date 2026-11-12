import localFont from "next/font/local";

// Polices auto-hébergées (aucun appel à Google Fonts) : rapide et compatible avec la CSP.
// Charte « Nocturne » : titres en Barlow Condensed (capitales), texte en DM Sans.
export const policeDisplay = localFont({
  src: [
    { path: "../app/fonts/barlow-condensed-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/barlow-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../app/fonts/barlow-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--police-display",
  display: "swap",
});

export const policeTexte = localFont({
  src: [
    { path: "../app/fonts/dm-sans-latin-wght-normal.woff2", weight: "100 1000", style: "normal" },
    { path: "../app/fonts/dm-sans-latin-wght-italic.woff2", weight: "100 1000", style: "italic" },
  ],
  variable: "--police-texte",
  display: "swap",
});
