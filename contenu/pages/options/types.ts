import type { CleImage } from "@/lib/images";
import type { Bilingue, Etape, Seo } from "../../types";

/** Encadré à puces (ce qui est inclus, les options, les usages…). */
export type ListeOption = { titre: string; intro?: string; points: string[] };

/** Textes d'une page d'option, dans une langue. Les titres acceptent *l'accent doré*. */
export type TextesOption = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  presentation: { surtitre: string; titre: string; paragraphes: string[] };
  listes?: ListeOption[];
  /** Mise en garde affichée sous la présentation (contraintes du lieu…). */
  avertissement?: string;
  etapes?: { surtitre: string; titre: string; liste: Etape[] };
  appel: { titre: string; texte: string };
};

/** Contenu complet d'une page `/animations/<option>` (fichier `contenu/pages/options/<slug-fr>.ts`). */
export type ContenuOption = {
  /** Photo d'en-tête : grande et paysage (elle couvre tout l'écran). */
  image: CleImage;
  /** 3 à 6 photos réelles de l'option. */
  galerie: CleImage[];
  /**
   * Avis de mariés qui parle de l'option. `depuis` : début de la phrase à citer, par langue
   * (sert aussi à distinguer deux avis des mêmes auteurs). Si la phrase est introuvable
   * dans une langue (traduction absente), l'avis n'est pas affiché dans cette langue.
   */
  avis?: { auteurs: string; depuis?: Partial<Bilingue<string>>; image: CleImage };
  textes: Bilingue<TextesOption>;
};
