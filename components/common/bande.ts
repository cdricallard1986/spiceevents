/**
 * Bande à faire glisser sur téléphone, grille au-delà : les listes de cartes
 * (animations, moments de la journée) ne s’empilent plus sur des écrans
 * entiers. Sur téléphone, la carte suivante dépasse à droite pour inviter au
 * geste ; à partir de 640 px, la liste redevient une grille (colonnes et
 * espacements ajoutés par chaque liste : `sm:grid-cols-2 lg:grid-cols-4`…).
 *
 * `-mx-5 px-5` : la bande va d’un bord à l’autre de l’écran (marge du
 * conteneur : 1,25 rem) et s’aligne sur le contenu au repos.
 */
export const CLASSES_BANDE =
  "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scroll-padding-inline:1.25rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0";

/**
 * Carte d’une bande. `relative` : un texte `sr-only` (position absolue) dans la
 * carte reste dedans ; sinon il s’échappe de la bande et élargit la page.
 */
export const CLASSES_CARTE_BANDE = "relative w-[72vw] shrink-0 snap-start sm:w-auto";
