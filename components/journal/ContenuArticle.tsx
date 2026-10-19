import type { ReactNode } from "react";
import { srcImage } from "@/lib/journal/constantes";
import type { Bloc, DocumentArticle, ElementListe, Marque, NoeudEnLigne } from "@/lib/journal/document";
import { LienArticle } from "./LienArticle";
import { PhotoArticle } from "./PhotoArticle";

/**
 * Corps d'un article : le document de l'éditeur (déjà validé par
 * `validerDocument`) rendu en React, sans aucune chaîne HTML injectée. Mêmes
 * balises qu'au temps des fichiers MDX (p, h2, h3, ul, ol, li, blockquote,
 * strong, em, a, figure) sous la classe `prose-nuit` de la page ; photos par
 * `PhotoArticle`, liens par `LienArticle`. Composant serveur pur : même
 * document, même rendu.
 *
 * Comme le rendu MDX, un retour à la ligne sépare les blocs (le HTML produit
 * reste comparable octet pour octet). Les paragraphes vides de l'éditeur
 * (lignes laissées blanches) ne sont pas rendus.
 */
export function ContenuArticle({ document }: { document: DocumentArticle }) {
  return <>{entreLignes(blocs(document.content))}</>;
}

/** Un « \n » entre deux blocs ; `autour` : aussi avant le premier et après le dernier (listes, citations). */
function entreLignes(elements: ReactNode[], autour = false): ReactNode[] {
  const sortie: ReactNode[] = autour ? ["\n"] : [];
  elements.forEach((e, i) => {
    if (i > 0) sortie.push("\n");
    sortie.push(e);
  });
  if (autour && elements.length) sortie.push("\n");
  return sortie;
}

function estVide(b: Bloc): boolean {
  return b.type === "paragraph" && !b.content?.length;
}

function blocs(liste: Bloc[]): ReactNode[] {
  return liste.filter((b) => !estVide(b)).map((b, i) => <BlocArticle key={i} bloc={b} />);
}

function BlocArticle({ bloc: b }: { bloc: Bloc }): ReactNode {
  switch (b.type) {
    case "paragraph":
      return <p>{enLigne(b.content ?? [])}</p>;
    case "heading":
      return b.attrs.level === 2 ? <h2>{enLigne(b.content ?? [])}</h2> : <h3>{enLigne(b.content ?? [])}</h3>;
    case "bulletList":
      return <ul>{entreLignes(b.content.map((li, i) => <ElementDeListe key={i} element={li} />), true)}</ul>;
    case "orderedList": {
      const debut = b.attrs?.start ?? 1;
      return (
        <ol start={debut !== 1 ? debut : undefined}>
          {entreLignes(b.content.map((li, i) => <ElementDeListe key={i} element={li} />), true)}
        </ol>
      );
    }
    case "blockquote":
      return <blockquote>{entreLignes(blocs(b.content), true)}</blockquote>;
    case "horizontalRule":
      return <hr />;
    case "image":
      return <PhotoArticle src={srcImage(b.attrs.src)} width={b.attrs.width} height={b.attrs.height} alt={b.attrs.alt} legende={b.attrs.title ?? undefined} />;
  }
}

/** Liste « serrée » (un seul paragraphe par élément) : le texte directement dans le `<li>`, comme en Markdown. */
function ElementDeListe({ element }: { element: ElementListe }) {
  const [premier, ...suite] = element.content;
  if (suite.length === 0) return <li>{enLigne(premier.content ?? [])}</li>;
  return <li>{entreLignes(blocs(element.content), true)}</li>;
}

// --- Texte en ligne --------------------------------------------------------------

/**
 * Le JSON de l'éditeur porte les marques à plat, nœud par nœud (« gras »,
 * « gras + lien »…) : il faut choisir l'imbrication des balises. La marque
 * qui couvre le plus de nœuds consécutifs est ouverte en premier (un passage
 * en gras qui contient deux liens donne `<strong>… <a>…</a> … <a>…</a></strong>`) ;
 * à égalité : lien, puis italique, puis gras.
 */
const RANG: Record<Marque["type"], number> = { link: 0, italic: 1, bold: 2 };

function memeMarque(a: Marque, b: Marque): boolean {
  return a.type === b.type && (a.type !== "link" || (b.type === "link" && a.attrs.href === b.attrs.href));
}

function porte(n: NoeudEnLigne, m: Marque): boolean {
  return (n.marks ?? []).some((x) => memeMarque(x, m));
}

function enLigne(noeuds: NoeudEnLigne[], ouvertes: Marque[] = []): ReactNode[] {
  const sortie: ReactNode[] = [];
  let i = 0;
  while (i < noeuds.length) {
    const n = noeuds[i];
    const nouvelles = (n.marks ?? []).filter((m) => !ouvertes.some((o) => memeMarque(o, m)));
    if (nouvelles.length === 0) {
      sortie.push(n.type === "text" ? n.text : <br key={i} />);
      i++;
      continue;
    }
    // Longueur de la suite de nœuds qui portent chaque nouvelle marque, à partir d'ici.
    const etendue = (m: Marque) => {
      let j = i;
      while (j < noeuds.length && porte(noeuds[j], m)) j++;
      return j - i;
    };
    const [choisie] = nouvelles
      .map((m) => ({ m, n: etendue(m) }))
      .sort((a, b) => b.n - a.n || RANG[a.m.type] - RANG[b.m.type]);
    const interieur = enLigne(noeuds.slice(i, i + choisie.n), [...ouvertes, choisie.m]);
    sortie.push(balise(choisie.m, interieur, i));
    i += choisie.n;
  }
  return sortie;
}

function balise(m: Marque, enfants: ReactNode[], cle: number): ReactNode {
  if (m.type === "bold") return <strong key={cle}>{enfants}</strong>;
  if (m.type === "italic") return <em key={cle}>{enfants}</em>;
  return (
    <LienArticle key={cle} href={m.attrs.href}>
      {enfants}
    </LienArticle>
  );
}
