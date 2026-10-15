import type { Locale } from "@/i18n/routing";
import type { CleImage } from "@/lib/images.generated";

/** Un contenu écrit dans les deux langues. */
export type Bilingue<T> = Record<Locale, T>;

export type Seo = { titre: string; description: string };

export type Etape = { titre: string; texte: string };
export type QuestionReponse = { question: string; reponse: string };
export type Avis = { auteurs: string; role?: string; texte: string };
export type Carte = { titre: string; texte: string; image?: CleImage; href?: string };
