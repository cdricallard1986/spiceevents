#!/usr/bin/env python3
"""Migre les articles du blog Strikingly vers le journal du nouveau site (MDX).

Entrées : site-actuel/donnees/blog/*.json (données brutes Strikingly), le manifeste
des images (site-actuel/images/manifeste.csv) et les images web déjà optimisées
(site-actuel/images/fichiers/). Les articles retirés (`ARTICLES_RETIRES` de
lib/seo/redirections.ts) sont ignorés ; les autres gardent leur slug.

Sorties :
- contenu/journal/<slug>.mdx : en-tête (titre, description, date, catégorie,
  couverture…) puis le corps en Markdown, images en <PhotoArticle … />.
- public/journal/<slug>/couverture.jpg et <n>.jpg : copies des images.

Le texte des articles n'est pas réécrit (c'est la plume de Cédric) : seulement la
mise en forme (liens recollés, vraies listes, titres) et quelques fautes de
frappe évidentes (CORRECTIONS). Reproductible : le script efface puis régénère
tout. Usage : python3 outils/convertir_journal.py
"""
import csv
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup, NavigableString
from markdownify import markdownify
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DONNEES = ROOT / "site-actuel" / "donnees" / "blog"
FICHIERS = ROOT / "site-actuel" / "images" / "fichiers"
MANIFESTE = ROOT / "site-actuel" / "images" / "manifeste.csv"
REDIRECTIONS = ROOT / "lib" / "seo" / "redirections.ts"
TEXTES_ALT = ROOT / "outils" / "journal_textes_alternatifs.json"
SORTIE = ROOT / "contenu" / "journal"
PUBLIC = ROOT / "public" / "journal"

SITE = "https://www.spiceevents.fr"
LONGUEUR_DESCRIPTION = 160

CATEGORIES = ("Conseils mariage", "Musique & ambiance", "Technique", "Animations", "Mariages réalisés")

# Catégorie de chaque article conservé (choisie à la lecture ; l'ancien site
# n'avait que « Accompagnement et Conseils », « Mariages » ou rien).
CATEGORIE = {
    # Conseils mariage : préparation, lieu, déco, thématique, saison.
    "comment-faire-durer-la-magie-du-jour-j": "Conseils mariage",
    "les-plus-beaux-lieux-pour-un-mariage-hivernal": "Conseils mariage",
    "mariage-pluvieux-mariage-heureux": "Conseils mariage",
    "nos-astuces-pour-trouver-le-lieu-de-mariage-ideal": "Conseils mariage",
    "nos-idees-de-decoration-pour-vos-tables-de-mariage": "Conseils mariage",
    "organiser-son-mariage-mode-d-emploi": "Conseils mariage",
    "osez-la-thematique-noire-pour-votre-mariage": "Conseils mariage",
    "quelle-thematique-choisir-pour-son-mariage": "Conseils mariage",
    "s-offrir-un-mariage-100-responsable-et-soucieux-de-l-environnement": "Conseils mariage",
    "se-marier-en-hiver": "Conseils mariage",
    "pourquoi-l-accompagnement-en-amont-est-aussi-important-que-le-jour-j": "Conseils mariage",
    "de-visiteurs-a-exposants-l-envers-du-decor-d-un-salon-du-mariage": "Conseils mariage",
    "quels-sont-les-indispensables-pour-un-evenement-reussi": "Conseils mariage",
    # Musique & ambiance : le DJ, la piste, le rythme de la soirée.
    "comment-bien-choisir-son-dj-les-criteres-a-connaitre": "Musique & ambiance",
    "comment-choisir-l-ambiance-musicale-de-votre-mariage": "Musique & ambiance",
    "comment-un-dj-lit-il-une-piste-de-danse": "Musique & ambiance",
    "le-role-du-dj-dans-le-timing-de-votre-evenement-bien-au-dela-de-la-musique": "Musique & ambiance",
    "les-plus-belles-chansons-pour-ouvrir-le-bal": "Musique & ambiance",
    "pourquoi-engager-un-dj-professionnel-pour-votre-evenement": "Musique & ambiance",
    "pourquoi-les-moments-forts-ne-sont-pas-forcement-les-plus-bruyants": "Musique & ambiance",
    "pourquoi-un-bon-dj-travaille-en-amont-avec-tous-les-prestataires-de-votre": "Musique & ambiance",
    "une-ambiance-intergenerationnelle": "Musique & ambiance",
    # Technique : son, lumière, matériel, plan B.
    "comment-un-bon-eclairage-fait-paraitre-un-lieu-plus-haut-de-gamme": "Technique",
    "l-apres-evenement-ce-que-vos-invites-retiennent-de-votre-soiree-grace-a-une": "Technique",
    "pourquoi-choisir-un-prestataire-technique-pour-son-mariage": "Technique",
    "pourquoi-investir-dans-du-materiel-fiable-est-plus-responsable-pour": "Technique",
    "pourquoi-la-coherence-visuelle-a-son-importance": "Technique",
    "pourquoi-la-qualite-du-materiel-de-sonorisation-change-toute-l-experience-de": "Technique",
    "pourquoi-la-technique-est-invisible-quand-elle-est-bien-faite": "Technique",
    "pourquoi-le-plan-b-meteo-doit-etre-pense-d-un-point-de-vue-technique": "Technique",
    # Animations : les options proposées.
    "guirlandes-lumineuses": "Animations",
    "livre-d-or-audio": "Animations",
    "quelles-animations-tendances-a-organiser-pour-son-mariage": "Animations",
    "trop-d-animations-le-piege": "Animations",
    # Mariages réalisés : reportages.
    "mariage-c-n-au-chateau-de-sauveboeuf": "Mariages réalisés",
    "mariage-de-s-r-au-chateau-d-hardricourt": "Mariages réalisés",
    "mariage-l-m-pres-de-massiac": "Mariages réalisés",
}

# Anciennes pages absentes de lib/seo/redirections.ts : elles avaient déjà disparu
# de l'ancien site (liens morts) mais restent citées dans les articles. Destination
# la plus proche, ou None pour retirer le lien (le texte est gardé).
PAGES_DISPARUES = {
    "/contact": "/contact",
    "/mariages": "/mariages",
    "/evenementiel": "/evenementiel",
    "/nos-dj-d-exception": "/mariages",
    "/mariage-exception-paris": "/mariages",
    "/le-photobooth": "/animations/photobooth",
    "/le-bar-a-vinyles": "/animations/bar-a-vinyles",
    "/animations-mariage-celebration": "/animations",
    "/options-mariage-eclairage-son": "/animations",
    "/options-soiree-privee": "/evenementiel",
    "/notre-materiel": "/a-propos",
    "/on-vous-rappelle": "/contact",
    "/vos-thematiques-au-choix": None,
    "/amis-partenaires": None,
    "/des-evenements-plus-green": None,
}

# Adresses abîmées dans l'éditeur Strikingly (collées deux fois, lettres en trop).
ADRESSES_ABIMEES = {
    "https://www.spiceevents.fr/booking-djhttps://www.spiceevents.fr/booking-dj": "https://www.spiceevents.fr/booking-dj",
    "https://www.spiceevents.fr/performances-techniques-son-and-lumieresVV": "https://www.spiceevents.fr/performances-techniques-son-and-lumieres",
    "https://www.spiceevents.fr/performances-techniques-son-and-lumiereshttps://www.spiceevents.fr/performances-techniques-son-and-lumieres": "https://www.spiceevents.fr/performances-techniques-son-and-lumieres",
}

# Fautes de frappe évidentes (texte exact → correction), appliquées au Markdown.
CORRECTIONS = [
    ("flyhts cases", "flight cases"),
    ("personalisé", "personnalisé"),
]

# --------------------------------------------------------------------------- #
# Tables de redirection (relues dans le fichier TypeScript, source unique)
# --------------------------------------------------------------------------- #


def table_ts(nom):
    """Lit un `export const NOM: Record<string, string> = { "a": "b", … };`."""
    texte = REDIRECTIONS.read_text()
    bloc = re.search(rf"export const {nom}[^=]*=\s*\{{(.*?)\n\}};", texte, re.S)
    if not bloc:
        raise SystemExit(f"Table {nom} introuvable dans {REDIRECTIONS}")
    return dict(re.findall(r'"([^"]+)":\s*"([^"]*)"', bloc.group(1)))


ANCIENNES_PAGES = table_ts("ANCIENNES_PAGES")
ANCIENNES_OPTIONS = table_ts("ANCIENNES_OPTIONS")
ARTICLES_RETIRES = table_ts("ARTICLES_RETIRES")

# Rapport de fin d'exécution : liens retirés, adresses inconnues, images manquantes.
RAPPORT = {"liens_retires": [], "liens_inconnus": [], "images_manquantes": [], "alt_manquants": []}


def nouvelle_adresse(href, slugs, slug_article):
    """Adresse dans le nouveau site, ou None si le lien doit être retiré."""
    href = ADRESSES_ABIMEES.get(href.strip(), href.strip())
    m = re.match(r"^https?://(?:www\.)?spiceevents\.fr(/[^?#]*)?([?#].*)?$", href)
    if not m:
        if re.match(r"^https?://[a-z0-9.-]+\.[a-z]{2,}(/|$)", href, re.I) and "strikingly.com" not in href:
            return href  # lien externe valide
        RAPPORT["liens_retires"].append((slug_article, href))
        return None
    chemin = (m.group(1) or "/").rstrip("/") or "/"
    if chemin.startswith("/blog/"):
        cible = chemin[len("/blog/"):]
        if cible in ARTICLES_RETIRES:
            return ARTICLES_RETIRES[cible]
        if cible in slugs:
            return f"/journal/{cible}"
        RAPPORT["liens_retires"].append((slug_article, href))
        return None
    if chemin == "/":
        return "/"
    if chemin in ANCIENNES_PAGES:
        return ANCIENNES_PAGES[chemin]
    if chemin in ANCIENNES_OPTIONS:
        return f"/animations/{ANCIENNES_OPTIONS[chemin]}"
    if chemin in PAGES_DISPARUES:
        cible = PAGES_DISPARUES[chemin]
        if cible is None:
            RAPPORT["liens_retires"].append((slug_article, href))
        return cible
    RAPPORT["liens_inconnus"].append((slug_article, href))
    return None


# --------------------------------------------------------------------------- #
# Images
# --------------------------------------------------------------------------- #


def lire_manifeste():
    """Clé de stockage Strikingly (« 22139555/127095_238885 ») → fichier web."""
    index = {}
    with MANIFESTE.open() as f:
        for ligne in csv.DictReader(f):
            m = re.search(r"/image/upload/(?:[^/]*,[^/]*/)?(\d+/[^/.]+)\.\w+$", ligne["url_original"])
            if m and ligne["fichier_web"]:
                index[m.group(1)] = ligne["fichier_web"]
    return index


def cle_depuis_url(url):
    m = re.search(r"/image/upload/(?:[^/]*,[^/]*/)?(\d+/[^/.]+)\.\w+$", url or "")
    return m.group(1) if m else None


def copier_image(fichier, slug, nom):
    """Copie l'image web dans public/journal/<slug>/ et renvoie (chemin public, l, h)."""
    source = FICHIERS / fichier
    ext = source.suffix.lower()
    dossier = PUBLIC / slug
    dossier.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, dossier / f"{nom}{ext}")
    with Image.open(source) as im:
        largeur, hauteur = im.size
    return f"/journal/{slug}/{nom}{ext}", largeur, hauteur


# --------------------------------------------------------------------------- #
# HTML Strikingly → Markdown
# --------------------------------------------------------------------------- #

ESPACES = {"\xa0": " ", " ": " ", " ": " ", "​": "", "﻿": ""}


def texte_brut(html):
    return BeautifulSoup(html or "", "html.parser").get_text(" ").strip()


def nettoyer_html(html, slugs, slug_article):
    """Simplifie le HTML d'un bloc RichText avant conversion en Markdown."""
    soupe = BeautifulSoup(html or "", "html.parser")
    for balise in soupe.find_all(True):
        balise.attrs = {k: v for k, v in balise.attrs.items() if k == "href"}
    for balise in soupe.find_all(["span", "u", "font"]):
        balise.unwrap()
    # Liens : nouvelle adresse, ou retrait (texte conservé).
    for a in soupe.find_all("a"):
        cible = nouvelle_adresse(a.get("href", ""), slugs, slug_article)
        if cible is None:
            a.unwrap()
        else:
            a["href"] = cible
    # Titres : les blocs longs mis en « titre » par erreur redeviennent des paragraphes.
    for titre in soupe.find_all(["h1", "h2", "h3", "h4"]):
        longueur = len(titre.get_text(" ").strip())
        if longueur == 0:
            titre.decompose()
        elif longueur > 120:
            titre.name = "p"
        else:
            titre.name = "h2"
    # Un <br> à l'intérieur d'un paragraphe sépare deux paragraphes.
    for bloc in soupe.find_all(["p", "h2", "blockquote"]):
        for br in bloc.find_all("br"):
            br.replace_with(NavigableString("\n\n"))
    return str(soupe)


def vers_markdown(html):
    texte = markdownify(html, heading_style="ATX", bullets="-", escape_underscores=False, escape_asterisks=False)
    for avant, apres in ESPACES.items():
        texte = texte.replace(avant, apres)
    return texte


def recoller_liens(texte):
    """[m](u)[ariages](u) → [mariages](u) ; lien sur un bout de mot → mot entier."""
    lien = r"\[([^\]]*)\]\(([^)\s]+)\)"
    precedent = None
    while precedent != texte:
        precedent = texte
        # Deux liens identiques côte à côte (éventuellement séparés d'espaces).
        texte = re.sub(lien + r"([ ]*)\[([^\]]*)\]\(\2\)", r"[\1\3\4](\2)", texte)
        # Lien qui ne contient que de la ponctuation ou des espaces : retiré.
        texte = re.sub(r"\[([\s.,;:!?*]*)\]\(([^)\s]+)\)", r"\1", texte)
        # Lien commencé ou terminé au milieu d'un mot : étendu au mot entier.
        texte = re.sub(r"(\w+)" + lien, r"[\1\2](\3)", texte)
        texte = re.sub(lien + r"(\w+)", r"[\1\3](\2)", texte)
    # Espaces de bord déplacés hors du texte du lien.
    texte = re.sub(r"\[(\s+)([^\]]*?)\]\(", r"\1[\2](", texte)
    texte = re.sub(r"\[([^\]]*?)(\s+)\]\(([^)\s]+)\)", r"[\1](\3)\2", texte)
    return texte


def nettoyer_gras(texte):
    texte = texte.replace("****", "")
    texte = re.sub(r"\*\*(\s*)\*\*", r"\1", texte)  # **Spice** **Events** → **Spice Events**
    texte = re.sub(r"\*\*\s+([^*\n]+?)\s*\*\*", r" **\1**", texte)  # espaces dans le gras
    return texte


def paragraphes(texte):
    return [p.strip() for p in re.split(r"\n\s*\n", texte) if p.strip()]


GRAS_SEUL = re.compile(r"^(?:\*\*|__)([^*]+?)(?:\*\*|__)\s*:?$")
PUCE = re.compile(r"^(?:\*\*)?[°•·](?:\*\*)?\s*")


def mettre_en_forme(blocs):
    """Paragraphes Markdown → corps propre (titres, listes, paragraphes vides)."""
    sortie = []
    for p in blocs:
        if not re.sub(r"[\s*_\\]", "", p):
            continue  # paragraphe vide ou fait seulement de balises de gras
        if p.startswith("<PhotoArticle") or p.startswith("#") or p.startswith(">"):
            sortie.append(p)
            continue
        # Fausse puce « ° » → vraie liste.
        if PUCE.match(p):
            sortie.append("- " + PUCE.sub("", p, count=1).strip())
            continue
        # Paragraphe entièrement en gras et court → intertitre.
        m = GRAS_SEUL.match(p)
        if m and len(m.group(1)) <= 120 and "](" not in m.group(1):
            sortie.append("## " + m.group(1).strip().rstrip(":").strip())
            continue
        # Titre gras dont une partie est un lien ([**…**](u) **…**).
        if len(p) <= 140 and re.fullmatch(r"(\s*(\*\*[^*]+\*\*|\[\*\*[^*\]]+\*\*\]\([^)]+\)))+\s*", p):
            sortie.append("## " + re.sub(r"\*\*", "", p).strip())
            continue
        sortie.append(p)
    # Titre markdownify (h2) éventuellement en gras : « ## **Titre** » → « ## Titre ».
    sortie = [re.sub(r"^(#+)\s*\*\*(.+?)\*\*\s*$", r"\1 \2", p) for p in sortie]
    # Listes : les éléments consécutifs sont regroupés en une liste compacte.
    texte = ""
    for i, p in enumerate(sortie):
        if i and p.startswith("- ") and sortie[i - 1].startswith("- "):
            texte += "\n" + p
        else:
            texte += ("\n\n" if texte else "") + p
    return texte


def echapper_mdx(ligne):
    """Le MDX interprète { } et < : on les échappe dans le texte des articles."""
    if ligne.startswith("<PhotoArticle"):
        return ligne
    return ligne.replace("{", "\\{").replace("}", "\\}").replace("<", "&lt;")


def corriger(texte):
    for avant, apres in CORRECTIONS:
        texte = texte.replace(avant, apres)
    texte = re.sub(r"[ \t]{2,}", " ", texte)
    texte = re.sub(r"[ \t]+\n", "\n", texte)
    texte = re.sub(r" +([,.])(?=\s|$)", r"\1", texte)  # espace avant virgule/point
    return texte


def description(corps):
    """Premières phrases du corps, sans Markdown, au plus 160 caractères."""
    for p in paragraphes(corps):
        if p.startswith(("<", "#", "-", ">")):
            continue
        brut = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", p)
        brut = re.sub(r"[*_\\]", "", brut)
        brut = re.sub(r"\s+", " ", brut).strip()
        if len(brut) < 40:
            continue
        if len(brut) <= LONGUEUR_DESCRIPTION:
            return brut
        phrases = re.split(r"(?<=[.!?…])\s+", brut)
        resume = ""
        for ph in phrases:
            if len(resume) + len(ph) + 1 > LONGUEUR_DESCRIPTION:
                break
            resume = f"{resume} {ph}".strip()
        if len(resume) >= 70:
            return resume
        coupe = brut[: LONGUEUR_DESCRIPTION - 1].rsplit(" ", 1)[0].rstrip(",;:–- ")
        return coupe + "…"
    return ""


# --------------------------------------------------------------------------- #
# Article
# --------------------------------------------------------------------------- #


def date_paris(horodatage):
    return datetime.fromisoformat(horodatage).astimezone(ZoneInfo("Europe/Paris")).date().isoformat()


def convertir(chemin, slugs, manifeste, alts):
    donnees = json.loads(chemin.read_text())
    slug = chemin.stem
    meta = donnees["blogPostMeta"]
    contenu = donnees["content"]
    entete = contenu.get("header") or {}
    titre = texte_brut((entete.get("title") or {}).get("value")) or meta["socialMediaConfig"]["title"]
    sous_titre = texte_brut((entete.get("subTitle") or {}).get("value"))

    # Couverture : image de partage de l'ancien article.
    cle = cle_depuis_url(meta["socialMediaConfig"].get("image")) or (entete.get("backgroundImage") or {}).get("storageKey")
    fichier = manifeste.get(cle)
    if not fichier:
        raise SystemExit(f"{slug} : couverture introuvable ({cle})")
    couverture, _, _ = copier_image(fichier, slug, "couverture")
    couverture_alt = alt_de(fichier, alts, slug)

    blocs, n = [], 0
    for section in contenu.get("sections") or []:
        comp = section.get("component") or {}
        if comp.get("type") in ("RichText", "Blog.Quote"):
            md = vers_markdown(nettoyer_html(comp.get("value"), slugs, slug))
            if comp["type"] == "Blog.Quote":
                lignes = [l for l in paragraphes(md.replace(">", ""))]
                blocs.append("\n>\n".join("> " + l.strip() for l in lignes))
            else:
                blocs.extend(paragraphes(md))
        elif comp.get("type") == "Image":
            fichier = manifeste.get(comp.get("storageKey") or "") or manifeste.get(cle_depuis_url(comp.get("url")) or "")
            if not fichier:
                RAPPORT["images_manquantes"].append((slug, comp.get("storageKey") or comp.get("url")))
                continue
            n += 1
            src, largeur, hauteur = copier_image(fichier, slug, str(n))
            alt = alt_de(fichier, alts, slug).replace('"', "&quot;")
            blocs.append(f'<PhotoArticle src="{src}" width={{{largeur}}} height={{{hauteur}}} alt="{alt}" />')

    corps = "\n\n".join(blocs)
    corps = recoller_liens(nettoyer_gras(corps))
    corps = mettre_en_forme(paragraphes(corps))
    corps = corriger(corps)
    corps = "\n".join(echapper_mdx(l) for l in corps.split("\n"))
    categorie = CATEGORIE[slug]
    assert categorie in CATEGORIES, categorie

    resume = description(corps)
    assert 0 < len(resume) <= LONGUEUR_DESCRIPTION, (slug, resume)
    entete_yaml = {
        "titre": corriger(titre),
        **({"sousTitre": corriger(sous_titre)} if sous_titre else {}),
        "description": resume,
        "date": date_paris(meta["publishedAt"]),
        "categorie": categorie,
        "couverture": couverture,
        "couvertureAlt": couverture_alt,
    }
    lignes = ["---"] + [f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in entete_yaml.items()] + ["---", ""]
    (SORTIE / f"{slug}.mdx").write_text("\n".join(lignes) + corps.strip() + "\n")
    return entete_yaml


def alt_de(fichier, alts, slug):
    alt = alts.get(fichier)
    if not alt:
        RAPPORT["alt_manquants"].append((slug, fichier))
        return "Photo Spice Events"
    return alt


def main():
    manifeste = lire_manifeste()
    alts = json.loads(TEXTES_ALT.read_text())["alt"] if TEXTES_ALT.exists() else {}
    sources = sorted(p for p in DONNEES.glob("*.json") if p.stem not in ARTICLES_RETIRES)
    slugs = {p.stem for p in sources}
    manquants = slugs - set(CATEGORIE)
    if manquants:
        raise SystemExit(f"Catégorie à choisir pour : {', '.join(sorted(manquants))}")

    for dossier in (SORTIE, PUBLIC):
        if dossier.exists():
            shutil.rmtree(dossier)
        dossier.mkdir(parents=True)
    articles = [convertir(p, slugs, manifeste, alts) for p in sources]

    print(f"{len(articles)} articles écrits dans {SORTIE.relative_to(ROOT)}/")
    for cat in CATEGORIES:
        print(f"  {cat} : {sum(a['categorie'] == cat for a in articles)}")
    for cle, titre in (
        ("liens_retires", "Liens retirés (page disparue ou adresse invalide)"),
        ("liens_inconnus", "Liens vers une adresse inconnue (retirés, à vérifier)"),
        ("images_manquantes", "Images introuvables (omises)"),
        ("alt_manquants", "Textes alternatifs manquants"),
    ):
        if RAPPORT[cle]:
            print(f"\n{titre} :")
            for slug, valeur in RAPPORT[cle]:
                print(f"  - {slug} : {valeur}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
