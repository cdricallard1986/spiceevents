"use client";

import type { Editor } from "@tiptap/react";
import { useId, useState, type FormEvent } from "react";
import { AIDE_LIEN, normaliserAdresseLien } from "@/lib/journal/admin";
import { classesBouton } from "@/components/ui/Bouton";
import { Champ } from "./Champ";
import { CLASSES_DANGER } from "./ConfirmDialog";
import { Modale } from "./Modale";

/**
 * Petite fenêtre « Lien » de l'éditeur : adresse vérifiée (https://, http://,
 * mailto:, tel: ou page du site `/…`), complétée quand c'est sans ambiguïté
 * (`www.…` → `https://www.…`). Sans texte sélectionné, le texte du lien est
 * demandé aussi. Sur un lien existant : modifier l'adresse ou retirer le lien.
 */
export function FenetreLien({ editor, onFermer }: { editor: Editor; onFermer: () => void }) {
  const id = useId();
  const [existant] = useState(() => (editor.isActive("link") ? String(editor.getAttributes("link").href ?? "") : ""));
  const [sansSelection] = useState(() => editor.state.selection.empty && !editor.isActive("link"));
  const [adresse, setAdresse] = useState(existant);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | undefined>();
  const [erreurTexte, setErreurTexte] = useState<string | undefined>();

  function valider(e?: FormEvent) {
    e?.preventDefault();
    const r = normaliserAdresseLien(adresse);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    if (sansSelection && !texte.trim()) {
      setErreurTexte("Indiquez le texte du lien (ce qui sera cliquable).");
      return;
    }
    if (sansSelection) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: texte.trim(), marks: [{ type: "link", attrs: { href: r.href } }] })
        .unsetMark("link")
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: r.href }).run();
    }
    onFermer();
  }

  function retirer() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onFermer();
  }

  return (
    <Modale
      ouverte
      onFermer={() => {
        onFermer();
        editor.commands.focus();
      }}
      titre={existant ? "Modifier le lien" : "Ajouter un lien"}
      largeur="etroite"
      pied={
        <>
          {existant && (
            <button type="button" onClick={retirer} className={`${CLASSES_DANGER} sm:mr-auto`}>
              Retirer le lien
            </button>
          )}
          <button type="submit" form={`${id}-formulaire`} className={classesBouton("primaire")}>
            {existant ? "Modifier" : "Ajouter le lien"}
          </button>
        </>
      }
    >
      <form id={`${id}-formulaire`} onSubmit={valider} className="flex flex-col gap-6" noValidate>
        {sansSelection && (
          <Champ id={`${id}-texte`} libelle="Texte du lien" erreur={erreurTexte}>
            {(attributs) => (
              <input
                {...attributs}
                type="text"
                value={texte}
                onChange={(e) => {
                  setTexte(e.target.value);
                  setErreurTexte(undefined);
                }}
                placeholder="nos mariages"
              />
            )}
          </Champ>
        )}
        <Champ id={`${id}-adresse`} libelle="Adresse" erreur={erreur} aide={AIDE_LIEN}>
          {(attributs) => (
            <input
              {...attributs}
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={adresse}
              onChange={(e) => {
                setAdresse(e.target.value);
                setErreur(undefined);
              }}
              placeholder="https://… ou /mariages"
            />
          )}
        </Champ>
      </form>
    </Modale>
  );
}
