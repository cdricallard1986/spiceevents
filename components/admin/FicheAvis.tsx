"use client";

import { useId, type ReactNode } from "react";
import { titulaire } from "@/lib/avis/admin";
import {
  CATEGORIES,
  EMPLACEMENTS,
  LIBELLES_CATEGORIE,
  LIBELLES_SOURCE,
  LIMITES_AVIS,
  PREFIXE_OPTION,
  SOURCES,
  estEmplacementConnu,
  libelleEmplacement,
  longueur,
  type Categorie,
  type Source,
} from "@/lib/avis/constantes";
import type { ChampAvis, ErreursAvis, FormulaireAvis } from "@/lib/avis/schema";
import type { Avis } from "@/lib/avis/types";
import { CLASSES_AIDE, CLASSES_CHAMP, CLASSES_CHAMP_ERREUR, CLASSES_LIBELLE } from "./champs";

type Props = {
  valeur: FormulaireAvis;
  modifier: (maj: Partial<FormulaireAvis>) => void;
  erreurs: ErreursAvis;
  /** Tous les avis : pour indiquer qui occupe un emplacement unique. */
  liste: readonly Avis[];
  /** L'avis ouvert (absent en création). */
  avis?: Avis;
};

/**
 * Champs d'un avis (modales d'édition et de création). Contrôlés par
 * `useModalAutosave` : ils restent toujours éditables, même pendant un
 * enregistrement. Erreurs : bordure rouge + message sous le champ.
 */
export function FicheAvis({ valeur, modifier, erreurs, liste, avis }: Props) {
  const id = useId();
  const champ = (nom: ChampAvis) => `${id}-${nom}`;
  const publie = avis?.publie ?? false;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Champ id={champ("auteurs")} libelle="Auteurs" erreur={erreurs.auteurs} max={LIMITES_AVIS.auteurs} valeur={valeur.auteurs} className="sm:col-span-2">
          {(attributs) => (
            <input {...attributs} type="text" value={valeur.auteurs} onChange={(e) => modifier({ auteurs: e.target.value })} placeholder="Pierre & Nina" />
          )}
        </Champ>

        <Champ id={champ("categorie")} libelle="Catégorie" erreur={erreurs.categorie}>
          {(attributs) => (
            <select {...attributs} value={valeur.categorie} onChange={(e) => modifier({ categorie: e.target.value as Categorie })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {LIBELLES_CATEGORIE[c]}
                </option>
              ))}
            </select>
          )}
        </Champ>

        <Champ id={champ("source")} libelle="Source" erreur={erreurs.source}>
          {(attributs) => (
            <select {...attributs} value={valeur.source} onChange={(e) => modifier({ source: e.target.value as Source })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_SOURCE[s]}
                </option>
              ))}
            </select>
          )}
        </Champ>

        <Champ id={champ("date_avis")} libelle="Date de l'avis" erreur={erreurs.date_avis} aide="Facultative.">
          {(attributs) => <input {...attributs} type="date" value={valeur.date_avis} onChange={(e) => modifier({ date_avis: e.target.value })} />}
        </Champ>

        <Champ
          id={champ("lien_source")}
          libelle="Lien vers l'avis d'origine"
          erreur={erreurs.lien_source}
          max={LIMITES_AVIS.lien}
          valeur={valeur.lien_source}
          aide="Facultatif, https:// seulement (Mariages.net, Google…). Pas encore affiché sur le site."
        >
          {(attributs) => (
            <input
              {...attributs}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={valeur.lien_source}
              onChange={(e) => modifier({ lien_source: e.target.value })}
              placeholder="https://www.mariages.net/…"
            />
          )}
        </Champ>
      </div>

      <Groupe titre="Rôle" aide="Pour un avis professionnel : la fonction de l'auteur (« Responsable communication »). Vide pour les mariés.">
        <Champ id={champ("role_fr")} libelle="Rôle — français" erreur={erreurs.role_fr} max={LIMITES_AVIS.role} valeur={valeur.role_fr}>
          {(attributs) => <input {...attributs} type="text" value={valeur.role_fr} onChange={(e) => modifier({ role_fr: e.target.value })} />}
        </Champ>
        <Champ id={champ("role_en")} libelle="Rôle — anglais" erreur={erreurs.role_en} max={LIMITES_AVIS.role} valeur={valeur.role_en} aide="Vide = le rôle français.">
          {(attributs) => <input {...attributs} type="text" lang="en" value={valeur.role_en} onChange={(e) => modifier({ role_en: e.target.value })} />}
        </Champ>
      </Groupe>

      <Groupe titre="Texte de l'avis" aide="Le texte complet, affiché sur la page Avis.">
        <Champ id={champ("texte_fr")} libelle="Texte — français" erreur={erreurs.texte_fr} max={LIMITES_AVIS.texte} valeur={valeur.texte_fr}>
          {(attributs) => <textarea {...attributs} rows={7} value={valeur.texte_fr} onChange={(e) => modifier({ texte_fr: e.target.value })} />}
        </Champ>
        <Champ
          id={champ("texte_en")}
          libelle="Texte — anglais"
          erreur={erreurs.texte_en}
          max={LIMITES_AVIS.texte}
          valeur={valeur.texte_en}
          aide="Vide = le site anglais affiche le texte français."
        >
          {(attributs) => <textarea {...attributs} rows={7} lang="en" value={valeur.texte_en} onChange={(e) => modifier({ texte_en: e.target.value })} />}
        </Champ>
      </Groupe>

      <Groupe
        titre="Citation mise en avant"
        aide="L'extrait affiché dans les grands avis et les grilles (accueil, Mariages, pages d'animation). Vide = début de l'avis."
      >
        <Champ
          id={champ("citation_fr")}
          libelle="Citation — français"
          erreur={erreurs.citation_fr}
          max={LIMITES_AVIS.citation}
          valeur={valeur.citation_fr}
          aide="Vide = début de l'avis."
        >
          {(attributs) => <textarea {...attributs} rows={3} value={valeur.citation_fr} onChange={(e) => modifier({ citation_fr: e.target.value })} />}
        </Champ>
        <Champ
          id={champ("citation_en")}
          libelle="Citation — anglais"
          erreur={erreurs.citation_en}
          max={LIMITES_AVIS.citation}
          valeur={valeur.citation_en}
          aide="Vide = début de l'avis anglais (sans texte anglais : la citation française)."
        >
          {(attributs) => <textarea {...attributs} rows={3} lang="en" value={valeur.citation_en} onChange={(e) => modifier({ citation_en: e.target.value })} />}
        </Champ>
      </Groupe>

      <Emplacements valeur={valeur} modifier={modifier} erreur={erreurs.emplacements} liste={liste} avis={avis} publie={publie} idErreur={champ("emplacements")} />
    </div>
  );
}

type Attributs = {
  id: string;
  className: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/** Un champ : libellé, contrôle, compteur de caractères, aide, erreur (bordure rouge). */
function Champ({
  id,
  libelle,
  erreur,
  aide,
  max,
  valeur,
  className = "",
  children,
}: {
  id: string;
  libelle: string;
  erreur?: string;
  aide?: string;
  /** Longueur maximale de la base : affiche un compteur. */
  max?: number;
  valeur?: string;
  className?: string;
  children: (attributs: Attributs) => ReactNode;
}) {
  const decrit = [erreur && `${id}-erreur`, aide && `${id}-aide`, max !== undefined && `${id}-compteur`].filter(Boolean).join(" ");
  const n = valeur === undefined ? 0 : longueur(valeur.trim());
  const depasse = max !== undefined && n > max;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={CLASSES_LIBELLE}>
          {libelle}
        </label>
        {max !== undefined && (
          <span id={`${id}-compteur`} className={`text-xs tabular-nums ${depasse ? "text-erreur" : "text-sable/70"}`}>
            {n.toLocaleString("fr-FR")} / {max.toLocaleString("fr-FR")}
            <span className="sr-only"> caractères</span>
          </span>
        )}
      </div>
      {children({
        id,
        className: erreur || depasse ? CLASSES_CHAMP_ERREUR : CLASSES_CHAMP,
        ...(erreur ? { "aria-invalid": true as const } : {}),
        ...(decrit ? { "aria-describedby": decrit } : {}),
      })}
      {aide && (
        <p id={`${id}-aide`} className={CLASSES_AIDE}>
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} className="text-sm text-erreur">
          {erreur}
        </p>
      )}
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

/** Cases à cocher des emplacements : accueil et page Mariages, puis une page par animation. */
function Emplacements({
  valeur,
  modifier,
  erreur,
  liste,
  avis,
  publie,
  idErreur,
}: {
  valeur: FormulaireAvis;
  modifier: (maj: Partial<FormulaireAvis>) => void;
  erreur?: string;
  liste: readonly Avis[];
  avis?: Avis;
  publie: boolean;
  idErreur: string;
}) {
  const coches = new Set(valeur.emplacements);
  // Emplacements enregistrés mais disparus du site (option retirée) : affichés pour pouvoir les décocher.
  const inconnus = valeur.emplacements.filter((e) => !estEmplacementConnu(e));
  const groupes = [
    { titre: "Accueil et page Mariages", emplacements: EMPLACEMENTS.filter((e) => !e.valeur.startsWith(PREFIXE_OPTION)) },
    { titre: "Pages des animations (grand avis)", emplacements: EMPLACEMENTS.filter((e) => e.valeur.startsWith(PREFIXE_OPTION)) },
  ];
  const uniqueCocheNonPublie = !publie && EMPLACEMENTS.some((e) => e.unique && coches.has(e.valeur));

  function basculer(emplacement: string, coche: boolean) {
    modifier({ emplacements: coche ? [...valeur.emplacements, emplacement] : valeur.emplacements.filter((e) => e !== emplacement) });
  }

  return (
    <fieldset className="border-t border-ligne pt-6" aria-describedby={erreur ? idErreur : undefined}>
      <legend className="pr-3 text-lg font-semibold text-ivoire">Où l&apos;avis apparaît</legend>
      <p className={`${CLASSES_AIDE} -mt-1 mb-5`}>
        La page Avis montre tous les avis publiés. Cochez en plus les pages où celui-ci est mis en avant. Un grand avis et une page
        d&apos;animation n&apos;en montrent qu&apos;un : le cocher ici le retire de l&apos;avis qui l&apos;avait.
      </p>
      <div className={`grid gap-6 lg:grid-cols-2 ${erreur ? "border border-erreur p-4" : ""}`}>
        {groupes.map((g) => (
          <div key={g.titre}>
            <p className={`${CLASSES_LIBELLE} mb-3`}>{g.titre}</p>
            <ul className="flex flex-col gap-3">
              {g.emplacements.map((e) => {
                const occupant = e.unique ? titulaire(liste, e.valeur, avis?.id) : undefined;
                return (
                  <li key={e.valeur}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={coches.has(e.valeur)}
                        onChange={(ev) => basculer(e.valeur, ev.target.checked)}
                        className="mt-1 size-4 shrink-0 accent-or"
                      />
                      <span>
                        <span className="text-ivoire">{e.libelle}</span>
                        {e.unique && (
                          <span className="block text-xs text-sable/80">
                            Un seul avis
                            {occupant && !coches.has(e.valeur) ? ` — actuellement : ${occupant.auteurs}${occupant.publie ? "" : " (non publié)"}` : ""}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
              {g.titre.startsWith("Accueil") &&
                inconnus.map((e) => (
                  <li key={e}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked onChange={() => basculer(e, false)} className="mt-1 size-4 shrink-0 accent-erreur" />
                      <span className="text-erreur">{libelleEmplacement(e)}</span>
                    </label>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      {uniqueCocheNonPublie && (
        <p className="mt-5 border-l-2 border-or bg-nuit-3 px-4 py-3 text-sm text-ivoire">
          Cet avis n&apos;est pas publié : tant qu&apos;il ne l&apos;est pas, les grands avis cochés ici ne s&apos;affichent nulle part.
        </p>
      )}
      {erreur && (
        <p id={idErreur} className="mt-3 text-sm text-erreur">
          {erreur}
        </p>
      )}
    </fieldset>
  );
}
