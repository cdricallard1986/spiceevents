#!/usr/bin/env python3
"""Génère contenu/avis.generated.json à partir des avis de l'ancien site (export Strikingly).

NB : les rôles professionnels et noms complets des avis « événement » ont ensuite été
renseignés à la main dans le JSON (d'après les pages Événementiel et Accompagnement).

Usage : python3 outils/extraire_avis.py — lancé une fois ; le fichier produit est ensuite la référence.
"""
import json
import re
from pathlib import Path

from markdownify import markdownify

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "site-actuel" / "donnees" / "pages"


def texte(html):
    t = markdownify(html or "", strip=["a", "span", "strong", "em", "b", "i"]).replace("\\", "")
    return re.sub(r"\s+", " ", t).strip(' #*"“”«»')


def elements(page):
    data = json.loads((PAGES / f"{page}.json").read_text())
    out = []

    def walk(o):
        if isinstance(o, dict):
            if o.get("type") in ("Repeatable", "Slider"):
                for it in o.get("list", []):
                    c = it.get("components", {})
                    textes = [texte(v.get("value")) for k, v in sorted(c.items())
                              if isinstance(v, dict) and v.get("type") == "RichText"]
                    out.append([t for t in textes if t])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(data)
    return out


def main():
    # Rôles professionnels, visibles sur les pages Événementiel et Accompagnement.
    roles = {}
    for page in ("evenementiel", "accompagnement"):
        for it in elements(page):
            if len(it) >= 3 and len(it[0]) < 40 and len(it[1]) < 60:
                roles[it[0].rstrip(".")] = it[1]
    avis, vus = [], set()
    for it in elements("temoignages"):
        if len(it) < 2:
            continue
        corps, auteur = it[0], it[1].lstrip("—– ").strip()
        cle = (auteur.split()[0], corps[:60])
        if cle in vus:
            continue
        vus.add(cle)
        role = next((r for nom, r in roles.items() if nom.split()[0] == auteur.split()[0] and r and "mari" not in r.lower()), None)
        pro = role is not None
        avis.append({"auteurs": auteur, "role": role, "categorie": "evenement" if pro else "mariage", "texte": corps})
    sortie = ROOT / "contenu" / "avis.generated.json"
    sortie.write_text(json.dumps(avis, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(avis)} avis ({sum(a['categorie'] == 'mariage' for a in avis)} mariages)")


if __name__ == "__main__":
    main()
