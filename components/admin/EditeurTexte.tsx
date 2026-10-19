"use client";

import type { EditorProps } from "@tiptap/pm/view";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { documentDepuisEditeur } from "@/lib/journal/admin";
import { contenuPourEditeur, extensionsArticle, preparerHtmlColle } from "@/lib/journal/editeur";
import type { DemandeEnvoi, OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { estTypeImage } from "@/lib/photos/envoi";
import { FenetreLien } from "./FenetreLien";
import { FenetrePhoto, type PhotoAInserer } from "./FenetrePhoto";
import { useToasts } from "./Toasts";

/**
 * Corps d'un article : l'éditeur visuel (Tiptap), réglé pour ne produire que
 * le format du document (lib/journal/editeur.ts), avec sa barre d'outils
 * collante. Chargé à la demande (`next/dynamic`) par la page de l'éditeur :
 * rien de Tiptap n'arrive sur les autres pages.
 *
 * Collage : le texte de Word, Google Docs ou d'une page web est gardé, dans
 * les formes connues ; une photo collée ou glissée comme fichier est envoyée
 * au stockage (texte alternatif demandé d'abord) ; une image d'un autre site
 * ou en `data:` est écartée, avec un message.
 */

type Props = {
  /** Document d'ouverture (lu une fois : l'éditeur garde ensuite son propre état). */
  contenuInitial: unknown;
  /** À chaque modification : le document dans sa forme enregistrée. */
  onChange: (document: unknown) => void;
  creerUrlEnvoi: DemandeEnvoi;
  outils: OutilsEnvoiArticle;
  /** Erreur du serveur sur le contenu. */
  erreur?: string;
  idErreur?: string;
};

type Fenetre = { type: "lien" } | { type: "photo"; fichier?: File } | { type: "legende" } | null;

function fichierImage(liste: FileList | null | undefined): File | null {
  return Array.from(liste ?? []).find((f) => estTypeImage(f.type)) ?? null;
}

export default function EditeurTexte({ contenuInitial, onChange, creerUrlEnvoi, outils, erreur, idErreur }: Props) {
  const { afficher } = useToasts();
  const [fenetre, setFenetre] = useState<Fenetre>(null);
  // Les réglages de l'éditeur sont lus une fois : les rappels passent par des références.
  const rappels = useRef({ onChange, afficher });
  useEffect(() => {
    rappels.current = { onChange, afficher };
  });
  /** Où insérer la photo (sélection au moment de l'ouverture de la fenêtre, ou point de dépôt). */
  const insertion = useRef<{ from: number; to: number } | null>(null);

  // Réglages créés une fois : `useEditor` les compare à chaque rendu (un nouvel objet relancerait `setOptions`).
  const [reglages] = useState(() => ({
    extensions: extensionsArticle(),
    content: contenuPourEditeur(contenuInitial),
    // Rendu côté client seulement (pas d'écart d'hydratation).
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-nuit min-h-[50svh] px-4 py-6 outline-none sm:px-8 sm:py-8",
        "aria-label": "Corps de l'article",
        // Message d'erreur du serveur sous l'éditeur (absent : ignoré).
        ...(idErreur ? { "aria-describedby": idErreur } : {}),
      },
      transformPastedHTML(html) {
        const r = preparerHtmlColle(html);
        if (r.imagesRefusees > 0) {
          rappels.current.afficher(
            `${r.imagesRefusees} image${r.imagesRefusees > 1 ? "s collées n'ont" : " collée n'a"} pas été reprise${r.imagesRefusees > 1 ? "s" : ""} (autre site ou image intégrée) : ajoutez-${r.imagesRefusees > 1 ? "les" : "la"} avec le bouton « Photo ».`,
            "info",
          );
        }
        return r.html;
      },
      handlePaste(view, event) {
        // Une photo copiée seule (capture d'écran, « Copier l'image ») : on l'envoie au stockage.
        const fichier = fichierImage(event.clipboardData?.files);
        const texte = event.clipboardData?.getData("text/plain").trim() ?? "";
        if (!fichier || texte) return false;
        event.preventDefault();
        insertion.current = { from: view.state.selection.from, to: view.state.selection.to };
        setFenetre({ type: "photo", fichier });
        return true;
      },
      handleDrop(view, event, _slice, deplacement) {
        if (deplacement) return false;
        const fichier = fichierImage(event.dataTransfer?.files);
        if (!fichier) return false;
        event.preventDefault();
        const point = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = point?.pos ?? view.state.selection.from;
        insertion.current = { from: pos, to: pos };
        setFenetre({ type: "photo", fichier });
        return true;
      },
    } satisfies EditorProps,
  }));

  const editor = useEditor({
    ...reglages,
    onUpdate({ editor: e }) {
      rappels.current.onChange(documentDepuisEditeur(e.getJSON()));
    },
  });

  function ouvrir(f: Exclude<Fenetre, null>) {
    if (!editor) return;
    if (f.type === "photo") insertion.current = { from: editor.state.selection.from, to: editor.state.selection.to };
    setFenetre(f);
  }

  function insererPhoto(p: PhotoAInserer) {
    if (!editor) return;
    const ou = insertion.current ?? { from: editor.state.selection.from, to: editor.state.selection.to };
    const taille = editor.state.doc.content.size;
    const borne = (n: number) => Math.max(0, Math.min(n, taille));
    editor
      .chain()
      .focus()
      .insertContentAt({ from: borne(ou.from), to: borne(ou.to) }, { type: "image", attrs: { src: p.chemin, width: p.largeur, height: p.hauteur, alt: p.alt, title: p.legende || null } })
      .run();
    insertion.current = null;
  }

  return (
    <div className="border border-ligne bg-nuit-2">
      {editor ? <BarreOutils editor={editor} onLien={() => ouvrir({ type: "lien" })} onPhoto={() => ouvrir({ type: "photo" })} onLegende={() => ouvrir({ type: "legende" })} /> : <BarreVide />}
      <div
        className={[
          "mx-auto max-w-[44rem]",
          "[&_.ProseMirror]:outline-none",
          // Texte d'invite d'un article vide.
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-sable/60 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          // Photos : comme sur le site (largeur du texte, photo en hauteur limitée à l'écran), légende dessous.
          "[&_figure]:my-10 [&_figure_img]:max-h-[85svh] [&_figure_img]:object-contain [&_figcaption]:mt-3 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-sable",
          "[&_hr]:my-10 [&_hr]:border-ligne",
          // Bloc sélectionné (photo, séparateur) : contour doré.
          "[&_.ProseMirror-selectednode]:outline [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-4 [&_.ProseMirror-selectednode]:outline-or",
        ].join(" ")}
      >
        <EditorContent editor={editor} />
        {!editor && <p className="px-4 py-6 text-sable sm:px-8">Chargement de l&apos;éditeur…</p>}
      </div>
      {erreur && (
        <p id={idErreur} className="border-t border-erreur px-4 py-3 text-sm text-erreur sm:px-8">
          {erreur}
        </p>
      )}

      {editor && fenetre?.type === "lien" && <FenetreLien editor={editor} onFermer={() => setFenetre(null)} />}
      {editor && (fenetre?.type === "photo" || fenetre?.type === "legende") && (
        <FenetrePhoto
          mode={fenetre.type === "photo" ? "ajout" : "modification"}
          fichierInitial={fenetre.type === "photo" ? fenetre.fichier : undefined}
          photoActuelle={fenetre.type === "legende" ? photoSelectionnee(editor) : undefined}
          creerUrlEnvoi={creerUrlEnvoi}
          outils={outils}
          onInserer={(p) => {
            insererPhoto(p);
            setFenetre(null);
          }}
          onModifier={(alt, legende) => {
            editor.chain().focus().updateAttributes("image", { alt, title: legende || null }).run();
            setFenetre(null);
          }}
          onFermer={() => {
            insertion.current = null;
            setFenetre(null);
            editor.commands.focus();
          }}
        />
      )}
    </div>
  );
}

function photoSelectionnee(editor: Editor): { alt: string; legende: string; src: string } | undefined {
  const attrs = editor.getAttributes("image");
  if (!attrs.src) return undefined;
  return { alt: String(attrs.alt ?? ""), legende: String(attrs.title ?? ""), src: String(attrs.src) };
}

// --- Barre d'outils ------------------------------------------------------------------

const CLASSES_BARRE =
  "sticky top-16 z-20 flex items-center gap-1 overflow-x-auto overscroll-x-contain border-b border-ligne bg-nuit-2/95 px-2 py-2 backdrop-blur-md lg:top-0 [scrollbar-width:thin]";

function BarreVide() {
  return <div aria-hidden="true" className={`${CLASSES_BARRE} h-[3.75rem]`} />;
}

function BarreOutils({ editor, onLien, onPhoto, onLegende }: { editor: Editor; onLien: () => void; onPhoto: () => void; onLegende: () => void }) {
  const etat = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      gras: e.isActive("bold"),
      italique: e.isActive("italic"),
      puces: e.isActive("bulletList"),
      numeros: e.isActive("orderedList"),
      citation: e.isActive("blockquote"),
      lien: e.isActive("link"),
      photo: e.isActive("image"),
      peutGras: e.can().toggleBold(),
      peutItalique: e.can().toggleItalic(),
      annuler: e.can().undo(),
      retablir: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Mise en forme du texte" aria-orientation="horizontal" className={CLASSES_BARRE}>
      <Outil libelle="Intertitre" actif={etat.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <span className="font-display text-lg leading-none">T</span>
        <span className="text-xs">Intertitre</span>
      </Outil>
      <Outil libelle="Sous-intertitre" actif={etat.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <span className="text-sm font-semibold leading-none">T</span>
        <span className="text-xs">Sous-intertitre</span>
      </Outil>
      <Separation />
      <Outil libelle="Gras" raccourci="Ctrl+B" actif={etat.gras} desactive={!etat.peutGras} onClick={() => c().toggleBold().run()}>
        <span className="text-base font-bold">G</span>
      </Outil>
      <Outil libelle="Italique" raccourci="Ctrl+I" actif={etat.italique} desactive={!etat.peutItalique} onClick={() => c().toggleItalic().run()}>
        <span className="font-display text-lg italic">I</span>
      </Outil>
      <Separation />
      <Outil libelle="Liste à puces" actif={etat.puces} onClick={() => c().toggleBulletList().run()}>
        <IconeOutil d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </Outil>
      <Outil libelle="Liste numérotée" actif={etat.numeros} onClick={() => c().toggleOrderedList().run()}>
        <IconeOutil d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.8 13.5a1.4 1.4 0 0 1 2.5.9c0 .9-2.5 2-2.5 3.1h2.6" />
      </Outil>
      <Outil libelle="Citation" actif={etat.citation} onClick={() => c().toggleBlockquote().run()}>
        <IconeOutil d="M7 7H4v5h3v-1.5a3 3 0 0 1-2 2.8M16 7h-3v5h3v-1.5a3 3 0 0 1-2 2.8M4 12v2a4 4 0 0 0 3 3.8M13 12v2a4 4 0 0 0 3 3.8" />
      </Outil>
      <Outil libelle="Séparateur" onClick={() => c().setHorizontalRule().run()}>
        <IconeOutil d="M4 12h16" />
      </Outil>
      <Separation />
      <Outil libelle={etat.lien ? "Modifier le lien" : "Lien"} actif={etat.lien} onClick={onLien}>
        <IconeOutil d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </Outil>
      <Outil libelle="Retirer le lien" desactive={!etat.lien} onClick={() => c().extendMarkRange("link").unsetLink().run()}>
        <IconeOutil d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1M4 4l16 16" />
      </Outil>
      <Outil libelle="Photo" onClick={onPhoto}>
        <IconeOutil d="M4 6h16v12H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 9.5h.01" />
        <span className="text-xs">Photo</span>
      </Outil>
      {etat.photo && (
        <Outil libelle="Texte de la photo (texte alternatif et légende)" onClick={onLegende}>
          <span className="text-xs">Texte de la photo</span>
        </Outil>
      )}
      <Separation />
      <Outil libelle="Annuler" raccourci="Ctrl+Z" desactive={!etat.annuler} onClick={() => c().undo().run()}>
        <IconeOutil d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </Outil>
      <Outil libelle="Rétablir" raccourci="Ctrl+Maj+Z" desactive={!etat.retablir} onClick={() => c().redo().run()}>
        <IconeOutil d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
      </Outil>
    </div>
  );
}

function Separation() {
  return <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-ligne" />;
}

/** Bouton de la barre : 44 px de haut au moins (doigt), `aria-pressed` pour ce qui s'active et se désactive. */
function Outil({
  libelle,
  raccourci,
  actif,
  desactive = false,
  onClick,
  children,
}: {
  libelle: string;
  raccourci?: string;
  actif?: boolean;
  desactive?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Garde la sélection du texte au clic de souris (le clavier, lui, passe par Tab).
      onMouseDown={(e) => e.preventDefault()}
      disabled={desactive}
      aria-pressed={actif === undefined ? undefined : actif}
      aria-label={libelle}
      title={raccourci ? `${libelle} (${raccourci})` : libelle}
      className={`flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 border px-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        actif ? "border-or bg-or text-nuit" : "border-transparent text-ivoire hover:border-ligne hover:text-or"
      }`}
    >
      {children}
    </button>
  );
}

function IconeOutil({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
