import type { Locale } from "@/i18n/routing";
import { SITE } from "@/contenu/site";
import type { QuestionReponse } from "@/contenu/types";

/**
 * Données structurées schema.org (JSON-LD) lues par Google.
 * Pas de note agrégée : Google ignore les avis hébergés par l'entreprise elle-même.
 */

type Objet = Record<string, unknown>;

export function entreprise(locale: Locale): Objet {
  return {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "@id": `${SITE.url}/#entreprise`,
    name: SITE.nom,
    url: SITE.url,
    telephone: SITE.telephone,
    email: SITE.email,
    image: `${SITE.url}/images/hero-premiere-danse.jpg`,
    description:
      locale === "fr"
        ? "DJ de mariage, sonorisation, éclairage et animations pour les mariages et les événements en Île-de-France."
        : "Wedding DJ, sound, lighting and entertainment for weddings and events in Paris and Île-de-France.",
    areaServed: [
      { "@type": "AdministrativeArea", name: "Île-de-France" },
      { "@type": "City", name: "Paris" },
    ],
    founder: { "@type": "Person", name: SITE.fondateur },
    award: SITE.weddingAwards.map((a) => `Wedding Awards Mariages.net ${a}`),
    sameAs: [SITE.reseaux.instagram, SITE.reseaux.facebook, SITE.reseaux.youtube],
    knowsLanguage: ["fr", "en"],
  };
}

export function pageFaq(questions: QuestionReponse[]): Objet {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.reponse },
    })),
  };
}

export function filAriane(etapes: { nom: string; url: string }[]): Objet {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: etapes.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.nom,
      item: e.url.startsWith("http") ? e.url : `${SITE.url}${e.url}`,
    })),
  };
}

export function article(a: { titre: string; description: string; date: string; url: string; image?: string }): Objet {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.titre,
    description: a.description,
    datePublished: a.date,
    inLanguage: "fr",
    url: `${SITE.url}${a.url}`,
    ...(a.image ? { image: `${SITE.url}${a.image}` } : {}),
    author: { "@type": "Person", name: SITE.fondateur },
    publisher: { "@id": `${SITE.url}/#entreprise` },
  };
}

/** JSON sûr à placer dans une balise <script> (aucune fermeture de balise possible). */
export function serialiser(objet: Objet): string {
  return JSON.stringify(objet).replace(/</g, "\\u003c");
}
