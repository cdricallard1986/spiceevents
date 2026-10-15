#!/usr/bin/env python3
"""Copie les photos choisies dans public/images/ et génère lib/images.generated.ts.

Sources : contenu/images/*.json (un fichier par groupe de pages ; clé → fichier de
site-actuel/images/fichiers + alt FR/EN). Les clés doivent être uniques entre fichiers.
Usage : python3 outils/preparer_images.py
"""
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "contenu" / "images"
ORIGINES = ROOT / "site-actuel" / "images" / "fichiers"
CIBLE = ROOT / "public" / "images"
SORTIE = ROOT / "lib" / "images.generated.ts"


def main():
    donnees = {}
    for f in sorted(SOURCES.glob("*.json")):
        for cle, info in json.loads(f.read_text())["images"].items():
            if cle in donnees:
                raise SystemExit(f"Clé d'image en double : {cle} ({f.name})")
            donnees[cle] = info
    CIBLE.mkdir(parents=True, exist_ok=True)
    lignes = [
        "// Fichier généré par outils/preparer_images.py — ne pas modifier à la main.",
        "export const IMAGES = {",
    ]
    for cle in sorted(donnees):
        info = donnees[cle]
        src = ORIGINES / info["fichier"]
        ext = src.suffix.lower()
        dest = CIBLE / f"{cle}{ext}"
        shutil.copyfile(src, dest)
        with Image.open(dest) as im:
            l, h = im.size
        alt = info["alt"]
        lignes.append(
            f'  {json.dumps(cle)}: {{ src: "/images/{cle}{ext}", width: {l}, height: {h}, '
            f'alt: {{ fr: {json.dumps(alt["fr"], ensure_ascii=False)}, en: {json.dumps(alt["en"], ensure_ascii=False)} }} }},'
        )
    lignes += ["} as const;", "", "export type CleImage = keyof typeof IMAGES;", ""]
    SORTIE.write_text("\n".join(lignes))
    # Supprime les copies d'images retirées de la source.
    gardees = {f"{c}{(ORIGINES / donnees[c]['fichier']).suffix.lower()}" for c in donnees}
    for f in CIBLE.iterdir():
        if f.is_file() and f.name not in gardees:
            f.unlink()
    print(f"{len(donnees)} images prêtes dans public/images/")


if __name__ == "__main__":
    main()
