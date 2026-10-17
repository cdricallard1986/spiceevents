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

# Fautes de frappe et d'accord évidentes (texte exact → correction), appliquées au
# Markdown. Le script signale toute correction qui ne trouve plus son texte.
CORRECTIONS = [
    ("flyhts cases", "flight cases"),
    ("de façon clair vos", "de façon claire vos"),
    ("se rendant presque invisible.", "se rendant presque invisibles."),
    ("et à durée jusque 5h", "et a duré jusqu’à 5h"),
    ("qui à su émerveiller", "qui a su émerveiller"),
    ("grâce au projections", "grâce aux projections"),
    ("Cette fois ci", "Cette fois-ci"),
    ("des guirlandes lumineuse. Ces guirlandes décoratives confère une atmosphère chaleureuse et romantiques",
     "des guirlandes lumineuses. Ces guirlandes décoratives confèrent une atmosphère chaleureuse et romantique"),
    ("une paire d'enceinte ", "une paire d'enceintes "),
    ("Nous en avons profités", "Nous en avons profité"),
    ("nous nous ferront", "nous nous ferons"),
    ("vous pouvez comptez sur", "vous pouvez compter sur"),
    ("Il offriront", "Ils offriront"),
    ("les styles aussi différent", "les styles aussi diffèrent"),
    ("vous laissez tenter", "vous laisser tenter"),
    ("notre borde DJ", "notre borne DJ"),
    ("l’un, voir LE plus", "l’un, voire LE plus"),
    ("vers qui vous tournez", "vers qui vous tourner"),
    ("toute le reste", "tout le reste"),
    ("que lieu de votre mariage", "que le lieu de votre mariage"),
    ("Evidemment dans", "Évidemment dans"),
    ("Évidement,", "Évidemment,"),
    ("Faites vous rêver comme", "Faites-vous rêver comme"),
    ("Alors vous mariez dans", "Alors vous marier dans"),
    ("déjà charmé par ce lieu", "déjà charmés par ce lieu"),
    ("Tous aussi charmants", "Tout aussi charmants"),
    ("lieux d’exceptions", "lieux d’exception"),
    ("faire leur preuve", "faire leurs preuves"),
    ("lui même ces enceintes", "lui-même ses enceintes"),
    ("A Thousands Years", "A Thousand Years"),
    ("opter pour cette chanson", "optez pour cette chanson"),
    ("empruntez lui", "empruntez-lui"),
    ("préférents", "préfèrent"),
    ("beaucoup aimerait", "beaucoup aimeraient"),
    ("tendance et original aussi", "tendance et originale aussi"),
    ("praticularité", "particularité"),
    ("quelques touche de", "quelques touches de"),
    ("notree page", "notre page"),
    ("chaque élément à son importance", "chaque élément a son importance"),
    ("fournit par", "fourni par"),
    ("et confier cette tâche", "et confiez cette tâche"),
    ("Un aspet", "Un aspect"),
    ("laissez leur la piste", "laissez-leur la piste"),
    ("quatres thématiques", "quatre thématiques"),
    ("lorsqu’un mouche", "lorsqu’une mouche"),
    ("au tonalité chaude", "aux tonalités chaudes"),
    ("la mise de scène", "la mise en scène"),
    ("qui bougent de partout’”", "qui bougent de partout”"),
    ("vous êtes sûr de devenir", "vous êtes sûrs de devenir"),
    ("que nous cessons d’améliorer", "que nous ne cessons d’améliorer"),
    ("vingt ans d’expériences", "vingt ans d’expérience"),
    ("Conscient de son importance", "Conscients de son importance"),
    ("de LD System,", "de LD Systems,"),
    ("animations mis en place", "animations mises en place"),
    ("à la poubelles", "à la poubelle"),
    ("plus époustouflant les uns", "plus époustouflants les uns"),
    ("nostalgie et fun assuré", "nostalgie et fun assurés"),
    ("ne pasengendrer", "ne pas engendrer"),
    ("il y a eu tout une logistique", "il y a eu toute une logistique"),
    ("soi-mêmes", "soi-même"),
    ("personalisé", "personnalisé"),
    ("ou d’un se mesure", "ou d’un événement se mesure"),  # mot oublié dans l'original
]

# Mise en forme ponctuelle (expression régulière → remplacement) : intertitre resté
# dans un paragraphe, renvois « voir l'article » transformés en liens, lien erroné.
# Photos dont Spice Events n'a pas les droits (Cédric, 16/10/2026) : jamais copiées.
IMAGES_EXCLUES = {
    "5439810_59909_3182.jpg",  # salle au bord d'un lac (site tiers)
    "5439810_707839_283804.jpg",  # chalet, filigrane MonsieurChalets.com
    "5439810_780284_859043.jpg",  # salle de réception (site tiers)
    "22139555_396638_436380.jpg",  # concert, © Val d'Europe agglomération / Hélène Petel
}
# Couverture de remplacement quand celle d'origine est exclue.
COUVERTURES_REMPLACEES = {
    "comment-un-bon-eclairage-fait-paraitre-un-lieu-plus-haut-de-gamme": "22139555_153446_421607.jpg",
}

MISE_EN_FORME = [
    (r"dispositif technique\. L’approche Spice Events Chez Spice Events,",
     "dispositif technique.\n\n## L’approche Spice Events\n\nChez Spice Events,"),
    (r"(voir l’article : |voir article : )(Pourquoi la technique est invisible quand elle est bien faite \?)",
     r"\1[\2](/journal/pourquoi-la-technique-est-invisible-quand-elle-est-bien-faite)"),
    (r'voir article "(Comment un DJ lit une piste de danse \?)"',
     r'voir article : [Comment un DJ lit-il une piste de danse ?](/journal/comment-un-dj-lit-il-une-piste-de-danse)'),
    (r"\[Guirlandes lumineuses\]\(/animations/ouverture-de-bal\)", "[Guirlandes lumineuses](/animations/guirlandes-lumineuses)"),
    # Prestations que Spice Events ne propose plus (Cédric, 16/10/2026) : plus de lien
    # vers /animations, et plus de promesse de mapping ni des anciennes formules.
    (r"\[(pianiste|fanfare|troupe de samba|saxophoniste|disco party|magicien|des lettres lumineuses|Le mapping vidéo)\]\(/animations\)",
     r"\1"),
    (r" \[\(pour les couples prenant les formules Or, Platine ou Diamant\)\]\(/mariages\)", ""),
    (r"\[lettres lumineuses\]\(/animations\)", "lettres lumineuses"),
    # La borne solaire Pikip ne fait plus partie du parc depuis 2025 : paragraphe retiré.
    (r"Pour les soucieux de l’environnement comme nous, il y a la Pikip Solar Speakers[^\n]*\n\n", ""),
    (r"la sonorisation du dîner ainsi que de la cérémonie et un mapping vidéo\.",
     "la sonorisation du dîner ainsi que de la cérémonie et une mise en lumière du lieu."),
    (r"optez pour le \[mapping\]\(/a-propos\)\. Cette projection 3D, s’adapte aux dimensions de votre lieu pour lui donner vie et émerveiller vos invités\.",
     "optez pour la [mise en lumière](/a-propos) : jeux de couleurs et projections de motifs donnent vie à votre lieu et émerveillent vos invités."),
    (r"\[nos lettres géantes lumineuses\]\(/animations\)", "des lettres géantes lumineuses"),
    (r"nous pouvons également parler du \[mapping\]\(/journal/mariage-de-s-r-au-chateau-d-hardricourt\), ces éclairages sur bâtiment qui vous offrent un show lumineux spectaculaire\.",
     "pensez aussi à la mise en lumière de votre lieu : une façade ou un jardin révélés à la nuit tombée offrent un show lumineux spectaculaire."),
    (r"rideaux étoilés, mapping sur bâtiment…", "rideaux étoilés…"),
    (r"rideaux étoilés ou même \[mapping\]\(/a-propos\) \(projections sur bâtiment\)",
     "rideaux étoilés ou mise en lumière de la façade"),
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


class Faible(str):
    """Destination approximative (ancienne page disparue) : ce lien cède la place à un
    lien voisin plus précis (« [jolies](…)[guirlandes lumineuses](…) »)."""


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
        elif cible != chemin:
            return Faible(cible)
        return cible
    RAPPORT["liens_inconnus"].append((slug_article, href))
    return None


# --------------------------------------------------------------------------- #
# Images
# --------------------------------------------------------------------------- #


def lire_manifeste():
    """Index des fichiers web : par clé de stockage Strikingly (« 22139555/127095_238885 »),
    par URL d'origine et par identifiant de photo Unsplash."""
    index = {}
    with MANIFESTE.open() as f:
        for ligne in csv.DictReader(f):
            fichier, url = ligne["fichier_web"], ligne["url_original"]
            if not fichier:
                continue  # image morte (non téléchargée lors de l'export)
            index[url] = fichier
            for cle in (cle_depuis_url(url), photo_unsplash(url)):
                if cle:
                    index[cle] = fichier
    return index


def cle_depuis_url(url):
    m = re.search(r"/image/upload/(?:[^/]*,[^/]*/)?(\d+/[^/.]+)\.\w+$", url or "")
    return m.group(1) if m else None


def photo_unsplash(url):
    m = re.search(r"unsplash\S*?/(photo-[0-9a-f]+-[0-9a-f]+)", url or "")
    return m.group(1) if m else None


def trouver_image(manifeste, cle=None, url=None):
    """Fichier web d'une image (clé de stockage ou URL), ou None si elle est introuvable."""
    url = ("https:" + url) if url and url.startswith("//") else url
    for candidat in (cle, url, cle_depuis_url(url), photo_unsplash(url)):
        if candidat and candidat in manifeste:
            return manifeste[candidat]
    return None


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


INLINE = ("strong", "b", "em", "i", "a")
BLOCS = ("p", "h1", "h2", "h3", "h4", "li")
MOT_FIN = re.compile(r"(\w+)$")
MOT_DEBUT = re.compile(r"^(\w+)")


def sortir_br(soupe):
    """Remonte chaque <br> hors des balises en ligne (<strong>a<br>b</strong> →
    <strong>a</strong><br><strong>b</strong>) pour pouvoir couper le paragraphe."""
    for br in soupe.find_all("br"):
        while br.parent is not None and br.parent.name in INLINE:
            parent = br.parent
            suite = soupe.new_tag(parent.name, attrs=dict(parent.attrs))
            for frere in list(br.next_siblings):
                suite.append(frere.extract())
            parent.insert_after(br.extract())
            br.insert_after(suite)


def couper_aux_br(soupe):
    """Un <br> dans un paragraphe ou un titre sépare deux blocs."""
    for bloc in soupe.find_all(BLOCS[:-1]):
        if not bloc.find("br", recursive=False):
            continue
        morceaux, courant = [], soupe.new_tag(bloc.name)
        for enfant in list(bloc.contents):
            if getattr(enfant, "name", None) == "br":
                morceaux.append(courant)
                courant = soupe.new_tag(bloc.name)
            else:
                courant.append(enfant.extract())
        morceaux.append(courant)
        for m in morceaux:
            bloc.insert_before(m)
        bloc.decompose()


def meme_balise(a, b):
    return getattr(a, "name", None) == getattr(b, "name", None) and a.name in INLINE and a.attrs == b.attrs


def fusionner_voisins(soupe):
    """<strong>a</strong><strong>b</strong> → <strong>ab</strong> (idem liens de même adresse),
    y compris quand seuls des espaces les séparent."""
    change = True
    while change:
        change = False
        for el in soupe.find_all(INLINE):
            suivant = el.next_sibling
            espace = None
            if isinstance(suivant, NavigableString) and not suivant.strip() and meme_balise(el, suivant.next_sibling):
                espace, suivant = suivant, suivant.next_sibling
            if suivant is not None and meme_balise(el, suivant):
                if espace is not None:
                    el.append(NavigableString(str(espace)))
                    espace.extract()
                for enfant in list(suivant.contents):
                    el.append(enfant.extract())
                suivant.decompose()
                change = True
                break


def retirer_liens_faibles(soupe):
    """Un lien approximatif collé à un lien précis est retiré (texte conservé)."""
    for a in soupe.find_all("a", attrs={"data-faible": "1"}):
        voisins = []
        for frere in (a.previous_sibling, a.next_sibling):
            if isinstance(frere, NavigableString) and not frere.strip():
                frere = frere.previous_sibling if frere is a.previous_sibling else frere.next_sibling
            voisins.append(frere)
        if any(getattr(v, "name", None) == "a" and not v.get("data-faible") for v in voisins):
            a.unwrap()
    for a in soupe.find_all("a"):
        a.attrs.pop("data-faible", None)
    soupe.smooth()


def etendre_aux_mots(soupe):
    """Gras ou lien commencé/terminé au milieu d'un mot (« U<strong>ne</strong> »,
    « <a>événements professio</a>nnels ») → étendu au mot entier. Un gras de une ou
    deux lettres collé à un mot (lettrine accidentelle) est simplement retiré."""
    change = True
    while change:
        change = False
        for el in soupe.find_all(INLINE):
            texte = el.get_text()
            if el.name != "a" and len(texte.strip()) <= 2 and texte.strip():
                avant, apres = el.previous_sibling, el.next_sibling
                colle = (isinstance(avant, NavigableString) and MOT_FIN.search(str(avant))) or (
                    isinstance(apres, NavigableString) and MOT_DEBUT.search(str(apres))
                )
                if colle:
                    el.unwrap()
                    change = True
                    break
            avant = el.previous_sibling
            if isinstance(avant, NavigableString) and texte[:1].isalnum():
                m = MOT_FIN.search(str(avant))
                if m:
                    avant.replace_with(NavigableString(str(avant)[: m.start()]))
                    el.insert(0, NavigableString(m.group(1)))
                    change = True
            apres = el.next_sibling
            if isinstance(apres, NavigableString) and texte[-1:].isalnum():
                m = MOT_DEBUT.search(str(apres))
                if m:
                    apres.replace_with(NavigableString(str(apres)[m.end():]))
                    el.append(NavigableString(m.group(1)))
                    change = True
        if change:
            soupe.smooth()


def espaces_hors_balises(soupe):
    """« <strong> Spice Events </strong> » → « <strong>Spice Events</strong> » entouré d'espaces."""
    for el in soupe.find_all(INLINE):
        textes = el.find_all(string=True)
        if textes and str(textes[0])[:1].isspace():
            textes[0].replace_with(NavigableString(str(textes[0]).lstrip()))
            el.insert_before(NavigableString(" "))
        textes = el.find_all(string=True)
        if textes and str(textes[-1])[-1:].isspace():
            textes[-1].replace_with(NavigableString(str(textes[-1]).rstrip()))
            el.insert_after(NavigableString(" "))


def texte_gras(bloc):
    """Texte du bloc s'il est entièrement en gras (titre déguisé ; une ponctuation finale
    hors du gras est tolérée), sinon None."""
    gras = []
    for t in bloc.find_all(string=True):
        if t.find_parent(["strong", "b"]):
            gras.append(str(t))
        elif re.sub(r"[\s.,;:]", "", str(t)):
            return None
        elif not str(t).strip():
            gras.append(" ")
    texte = re.sub(r"\s+", " ", "".join(gras)).strip()
    return texte or None


def nettoyer_html(html, slugs, slug_article):
    """Simplifie le HTML d'un bloc RichText avant conversion en Markdown."""
    html = html or ""
    for avant, apres in ESPACES.items():
        html = html.replace(avant, apres)
    soupe = BeautifulSoup(html, "html.parser")
    for balise in soupe.find_all(True):
        balise.attrs = {k: v for k, v in balise.attrs.items() if k == "href"}
    for balise in soupe.find_all(["span", "u", "font"]):
        balise.unwrap()
    soupe.smooth()
    # Liens : nouvelle adresse, ou retrait (texte conservé).
    for a in soupe.find_all("a"):
        cible = nouvelle_adresse(a.get("href", ""), slugs, slug_article)
        if cible is None:
            a.unwrap()
        else:
            a["href"] = str(cible)
            if isinstance(cible, Faible):
                a["data-faible"] = "1"
    soupe.smooth()
    # Liens réduits à une ponctuation ou à des espaces : retirés.
    for a in soupe.find_all("a"):
        if not re.sub(r"[\s.,;:!?…]", "", a.get_text()):
            a.unwrap()
    soupe.smooth()
    sortir_br(soupe)
    couper_aux_br(soupe)
    fusionner_voisins(soupe)
    retirer_liens_faibles(soupe)
    etendre_aux_mots(soupe)
    fusionner_voisins(soupe)
    espaces_hors_balises(soupe)
    soupe.smooth()
    for bloc in soupe.find_all(BLOCS):
        texte = re.sub(r"\s+", " ", bloc.get_text()).strip()
        if not texte:
            bloc.decompose()
            continue
        # Titres : les blocs longs mis en « titre » par erreur redeviennent des paragraphes ;
        # un paragraphe court entièrement en gras (sans point final) devient un intertitre.
        if bloc.name in ("h1", "h2", "h3", "h4"):
            bloc.name = "h2" if len(texte) <= 120 and not texte.endswith(".") else "p"
        elif bloc.name == "p" and bloc.find_parent("blockquote") is None and len(texte) <= 120:
            gras = texte_gras(bloc)
            # « **De la musique pour chaque instant.** » : courte phrase sans autre ponctuation.
            if gras and gras.endswith(".") and len(gras) <= 60 and not re.search(r"[.;:!?]", gras[:-1]):
                gras = gras[:-1]
            if gras and not gras.endswith((".", ":", "…", ",")):
                bloc.clear()
                bloc.append(NavigableString(gras))
                bloc.name = "h2"
            elif gras:
                # Phrase entièrement en gras, morcelée par les liens : un seul gras.
                for el in bloc.find_all(["strong", "b"]):
                    el.unwrap()
                gras_unique = soupe.new_tag("strong")
                for enfant in list(bloc.contents):
                    gras_unique.append(enfant.extract())
                bloc.append(gras_unique)
                soupe.smooth()
                espaces_hors_balises(bloc)
        if bloc.name == "h2":
            for el in bloc.find_all(["strong", "b", "a"]):
                el.unwrap()
        # Fausse puce « ° » en début de paragraphe → élément de liste.
        if bloc.name == "p" and re.match(r"^[°•]", texte):
            premier = bloc.find(string=re.compile(r"[°•]"))
            premier.replace_with(NavigableString(re.sub(r"^\s*[°•]\s*", "", str(premier))))
            bloc.name = "li"
    # Chaque élément dans sa liste ; les listes voisines sont réunies dans le Markdown.
    for li in soupe.find_all("li"):
        if li.parent is None or li.parent.name not in ("ul", "ol"):
            li.wrap(soupe.new_tag("ul"))
    return str(soupe)


def vers_markdown(html):
    texte = markdownify(html, heading_style="ATX", bullets="-", escape_misc=False)
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
    texte = re.sub(r"\*\*([ \t]*)\*\*", r"\1", texte)  # **Spice** **Events** → **Spice Events**
    # Ponctuation finale sortie du gras et des liens : « **Spice Events,** » → « **Spice Events**, ».
    texte = re.sub(r"(?<![*\w])\*\*([^*\n]+?)([ \t]*)([,;:.]+)\*\*(?!\*)", r"**\1**\2\3", texte)
    texte = re.sub(r"\[([^\]\n]+?)([,;:]+)\]\(([^)\s]+)\)", r"[\1](\3)\2", texte)
    return texte


def paragraphes(texte):
    return [p.strip() for p in re.split(r"\n\s*\n", texte) if p.strip()]


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


CORRECTIONS_APPLIQUEES = set()


def corriger(texte):
    for avant, apres in CORRECTIONS:
        if avant in texte:
            CORRECTIONS_APPLIQUEES.add(avant)
            texte = texte.replace(avant, apres)
    for motif, remplacement in MISE_EN_FORME:
        texte, n = re.subn(motif, remplacement, texte)
        if n:
            CORRECTIONS_APPLIQUEES.add(motif)
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
    image_partage = meta["socialMediaConfig"].get("image")
    fichier = trouver_image(manifeste, url=image_partage) or trouver_image(
        manifeste, cle=(entete.get("backgroundImage") or {}).get("storageKey")
    )
    if fichier in IMAGES_EXCLUES:
        fichier = COUVERTURES_REMPLACEES.get(slug)
    if not fichier:
        raise SystemExit(f"{slug} : couverture introuvable ou exclue ({image_partage})")
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
            fichier = trouver_image(manifeste, cle=comp.get("storageKey"), url=comp.get("url"))
            if not fichier:
                RAPPORT["images_manquantes"].append((slug, comp.get("storageKey") or comp.get("url")))
                continue
            if fichier in IMAGES_EXCLUES:
                continue
            n += 1
            src, largeur, hauteur = copier_image(fichier, slug, str(n))
            alt = alt_de(fichier, alts, slug).replace('"', "&quot;")
            blocs.append(f'<PhotoArticle src="{src}" width={{{largeur}}} height={{{hauteur}}} alt="{alt}" />')

    # Le titre de l'article répété en intertitre au début du corps : retiré.
    if blocs and blocs[0].lstrip("# ").strip() == titre.strip():
        blocs = blocs[1:]
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
    inutiles = [a for a, _ in CORRECTIONS if a not in CORRECTIONS_APPLIQUEES]
    inutiles += [m for m, _ in MISE_EN_FORME if m not in CORRECTIONS_APPLIQUEES]
    if inutiles:
        print("Corrections sans effet (texte introuvable) : " + " | ".join(inutiles))
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
