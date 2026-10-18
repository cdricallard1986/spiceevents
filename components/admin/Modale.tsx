"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const FOCALISABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const LARGEURS = { etroite: "max-w-md", normale: "max-w-2xl", large: "max-w-4xl" } as const;

type Props = {
  ouverte: boolean;
  /** Échap, clic sur le fond ou bouton ×. Pour une modale auto-enregistrée : `fermer()` du hook d'abord. */
  onFermer: () => void;
  titre: string;
  /** À côté du titre (pill de statut d'enregistrement…). */
  aside?: ReactNode;
  children: ReactNode;
  /** Boutons du bas (alignés à droite). */
  pied?: ReactNode;
  largeur?: keyof typeof LARGEURS;
  /** `alertdialog` pour une confirmation. */
  role?: "dialog" | "alertdialog";
  /** Élément à focaliser à l'ouverture (par défaut : le premier champ ou bouton). */
  focusInitial?: RefObject<HTMLElement | null>;
  /** Id d'un texte qui décrit la modale (`aria-describedby`). */
  descriptionId?: string;
};

/**
 * Modale accessible : titre annoncé, focus placé à l'ouverture puis rendu à
 * l'élément d'origine à la fermeture, Tab qui tourne dans la modale, Échap et
 * clic sur le fond pour fermer, page derrière figée. Sur téléphone, elle
 * occupe tout l'écran.
 */
export function Modale({
  ouverte,
  onFermer,
  titre,
  aside,
  children,
  pied,
  largeur = "normale",
  role = "dialog",
  focusInitial,
  descriptionId,
}: Props) {
  const idTitre = useId();
  const panneau = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const fermerRef = useRef(onFermer);
  useEffect(() => {
    fermerRef.current = onFermer;
  });

  useEffect(() => {
    if (!ouverte) return;
    const origine = document.activeElement as HTMLElement | null;
    // Le premier champ du contenu plutôt que le bouton × de l'en-tête.
    const cible =
      focusInitial?.current ??
      contenu.current?.querySelector<HTMLElement>(FOCALISABLES) ??
      panneau.current?.querySelector<HTMLElement>(FOCALISABLES) ??
      panneau.current;
    cible?.focus();
    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = debordement;
      origine?.focus?.();
    };
  }, [ouverte, focusInitial]);

  if (!ouverte || typeof document === "undefined") return null;

  function surTouche(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      // Une confirmation ouverte par-dessus une modale ne ferme que la confirmation.
      e.stopPropagation();
      fermerRef.current();
      return;
    }
    if (e.key !== "Tab" || !panneau.current) return;
    const elements = [...panneau.current.querySelectorAll<HTMLElement>(FOCALISABLES)];
    if (elements.length === 0) {
      e.preventDefault();
      return;
    }
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (e.shiftKey && (document.activeElement === premier || document.activeElement === panneau.current)) {
      e.preventDefault();
      dernier.focus();
    } else if (!e.shiftKey && document.activeElement === dernier) {
      e.preventDefault();
      premier.focus();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-nuit/80 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fermerRef.current();
      }}
    >
      <div
        ref={panneau}
        role={role}
        aria-modal="true"
        aria-labelledby={idTitre}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={surTouche}
        className={`flex max-h-dvh w-full flex-col border-ligne bg-nuit-2 shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)] sm:border ${LARGEURS[largeur]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ligne px-5 py-4 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <h2 id={idTitre} className="font-display text-2xl leading-tight">
              {titre}
            </h2>
            {aside}
          </div>
          <button
            type="button"
            onClick={() => fermerRef.current()}
            aria-label="Fermer"
            className="-mr-2 flex size-10 shrink-0 items-center justify-center text-2xl leading-none text-sable hover:text-or"
          >
            ×
          </button>
        </div>
        <div ref={contenu} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {pied && <div className="flex flex-wrap justify-end gap-3 border-t border-ligne px-5 py-4 sm:px-6">{pied}</div>}
      </div>
    </div>,
    document.body,
  );
}
