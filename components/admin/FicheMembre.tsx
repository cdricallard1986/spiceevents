"use client";

import { useId, type ReactNode } from "react";
import { GROUPES, LIBELLES_GROUPE, LIMITES_EQUIPE as L } from "@/lib/equipe/constantes";
import { initiales } from "@/lib/equipe/affichage";
import type { ChampMembre, ErreursMembre, FormulaireMembre } from "@/lib/equipe/schema";
import type { GroupeEquipe } from "@/lib/equipe/types";
import type { DemandeEnvoi, OutilsEnvoiArticle } from "@/lib/journal/navigateur";
import { Champ } from "./Champ";
import { CLASSES_AIDE } from "./champs";
import { PhotoMembre } from "./PhotoMembre";

type Props = {
  valeur: FormulaireMembre;
  modifier: (maj: Partial<FormulaireMembre>) => void;
  erreurs: ErreursMembre;
  creerUrlEnvoi: DemandeEnvoi;
  outils: OutilsEnvoiArticle;
};

/**
 * Champs d’un DJ ou d’un musicien (modales d’édition et de création), dans
 * l’ordre de la carte de la page Nos DJ. Contrôlés par `useModalAutosave` :
 * toujours éditables, même pendant un enregistrement.
 */
export function FicheMembre({ valeur, modifier, erreurs, creerUrlEnvoi, outils }: Props) {
  const id = useId();
  const champ = (nom: ChampMembre) => `${id}-${nom}`;

  /** Un champ texte d’une ligne. */
  const ligne = (nom: ChampMembre, libelle: string, max: number, options: { aide?: string; placeholder?: string; anglais?: boolean; className?: string } = {}) => (
    <Champ id={champ(nom)} libelle={libelle} erreur={erreurs[nom]} max={max} valeur={String(valeur[nom] ?? "")} aide={options.aide} className={options.className}>
      {(attributs) => (
        <input
          {...attributs}
          type="text"
          lang={options.anglais ? "en" : undefined}
          value={String(valeur[nom] ?? "")}
          onChange={(e) => modifier({ [nom]: e.target.value } as Partial<FormulaireMembre>)}
          placeholder={options.placeholder}
        />
      )}
    </Champ>
  );

  /** Un texte de plusieurs lignes. */
  const texte = (nom: ChampMembre, libelle: string, max: number, rows: number, options: { aide?: string; anglais?: boolean } = {}) => (
    <Champ id={champ(nom)} libelle={libelle} erreur={erreurs[nom]} max={max} valeur={String(valeur[nom] ?? "")} aide={options.aide}>
      {(attributs) => (
        <textarea
          {...attributs}
          rows={rows}
          lang={options.anglais ? "en" : undefined}
          value={String(valeur[nom] ?? "")}
          onChange={(e) => modifier({ [nom]: e.target.value } as Partial<FormulaireMembre>)}
        />
      )}
    </Champ>
  );

  return (
    <div className="flex flex-col gap-8">
      <PhotoMembre
        valeur={valeur}
        onChange={modifier}
        monogramme={initiales(valeur.nom) || "?"}
        erreur={erreurs.photo_chemin}
        idErreur={champ("photo_chemin")}
        creerUrlEnvoi={creerUrlEnvoi}
        outils={outils}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {ligne("nom", "Nom", L.nom, { placeholder: "Kevin R.", aide: "Prénom et initiale du nom de famille, ou nom de scène." })}
        {ligne("alias", "Autre nom", L.alias, { placeholder: "Aurélien", aide: "Facultatif : le prénom d’un nom de scène, affiché sous le nom." })}
        <Champ id={champ("groupe")} libelle="Section de la page" erreur={erreurs.groupe}>
          {(attributs) => (
            <select {...attributs} value={valeur.groupe} onChange={(e) => modifier({ groupe: e.target.value as GroupeEquipe })}>
              {GROUPES.map((g) => (
                <option key={g} value={g}>
                  {LIBELLES_GROUPE[g]}
                </option>
              ))}
            </select>
          )}
        </Champ>
      </div>

      <Groupe titre="Rôle" aide="Au-dessus du nom, en orange (« DJ », « DJ, avec guitariste », « Saxophoniste »).">
        {ligne("role_fr", "Rôle — français", L.role)}
        {ligne("role_en", "Rôle — anglais", L.role, { anglais: true, aide: "Vide = le rôle français." })}
      </Groupe>

      <Groupe titre="Accroche" aide="La phrase en gras, en tête de la présentation.">
        {ligne("accroche_fr", "Accroche — français", L.accroche)}
        {ligne("accroche_en", "Accroche — anglais", L.accroche, { anglais: true, aide: "Vide = l’accroche française." })}
      </Groupe>

      <Groupe titre="Présentation" aide="Une ligne vide sépare deux paragraphes.">
        {texte("presentation_fr", "Présentation — français", L.presentation, 8)}
        {texte("presentation_en", "Présentation — anglais", L.presentation, 8, { anglais: true, aide: "Vide = la présentation française." })}
      </Groupe>

      <Groupe titre="Styles" aide={`Les étiquettes en bas de la carte, séparées par des virgules (${L.styles} au maximum).`}>
        {ligne("styles_fr", "Styles — français", L.style * L.styles, { placeholder: "Électro, Funk, French Touch" })}
        {ligne("styles_en", "Styles — anglais", L.style * L.styles, { anglais: true, placeholder: "Electro, Funk, French Touch", aide: "Vide = les styles français." })}
      </Groupe>

      <Groupe titre="Avis de mariés" aide="Facultatif : une citation qui le nomme, avec son auteur (« Roman, mariage de juillet 2026 »).">
        {texte("avis_texte_fr", "Avis — français", L.avisTexte, 3)}
        {texte("avis_texte_en", "Avis — anglais", L.avisTexte, 3, { anglais: true, aide: "Vide = l’avis français." })}
        {ligne("avis_auteur_fr", "Auteur de l’avis — français", L.avisAuteur)}
        {ligne("avis_auteur_en", "Auteur de l’avis — anglais", L.avisAuteur, { anglais: true, aide: "Vide = l’auteur en français." })}
      </Groupe>

      <Groupe titre="Lieux et clubs" aide="Facultatif : une liste de clubs ou de lieux, en petit sous la présentation.">
        {texte("lieux_fr", "Lieux — français", L.lieux, 2)}
        {texte("lieux_en", "Lieux — anglais", L.lieux, 2, { anglais: true, aide: "Vide = la liste française." })}
      </Groupe>

      <fieldset className="border-t border-ligne pt-6">
        <legend className="pr-3 text-lg font-semibold text-ivoire">Lien</legend>
        <p className={`${CLASSES_AIDE} -mt-1 mb-5`}>Facultatif : sa page Mixcloud, Facebook, SoundCloud… (https:// seulement), ouverte dans un nouvel onglet.</p>
        <div className="grid gap-6 lg:grid-cols-2">
          <Champ id={champ("lien_url")} libelle="Adresse du lien" erreur={erreurs.lien_url} max={L.lien} valeur={valeur.lien_url} className="lg:col-span-2">
            {(attributs) => (
              <input
                {...attributs}
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={valeur.lien_url}
                onChange={(e) => modifier({ lien_url: e.target.value })}
                placeholder="https://www.mixcloud.com/…"
              />
            )}
          </Champ>
          {ligne("lien_libelle_fr", "Texte du lien — français", L.lienLibelle, { placeholder: "Sa page Mixcloud" })}
          {ligne("lien_libelle_en", "Texte du lien — anglais", L.lienLibelle, { anglais: true, placeholder: "His Mixcloud page", aide: "Vide = le texte français." })}
        </div>
      </fieldset>
    </div>
  );
}

/** Deux champs côte à côte (français / anglais) sous un intertitre. */
function Groupe({ titre, aide, children }: { titre: string; aide?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-ligne pt-6">
      <legend className="pr-3 text-lg font-semibold text-ivoire">{titre}</legend>
      {aide && <p className={`${CLASSES_AIDE} -mt-1 mb-5`}>{aide}</p>}
      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </fieldset>
  );
}
