#!/usr/bin/env python3
"""Exporte le contenu du site Strikingly www.spiceevents.fr.

Le site est construit avec Strikingly : chaque page HTML embarque ses données
complètes (sections, textes, images, boutons) dans `$S.stores`, et chaque
article de blog dans `$S.blogPostData`. Ce script :

  1. lit le sitemap pour lister toutes les URL publiques ;
  2. télécharge chaque page (cache local, avec relances) ;
  3. extrait les données JSON et les enregistre dans `site-actuel/donnees/` ;
  4. génère une fiche Markdown lisible par page et par article ;
  5. dresse l'inventaire des images (avec l'URL de l'original pleine résolution) ;
  6. avec --images, télécharge les originaux dans `site-actuel/images/fichiers/`.

Usage :
    python3 outils/export_strikingly.py [--cache DOSSIER] [--images]
"""

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from markdownify import markdownify

SITE = "https://www.spiceevents.fr"
CDN_ORIGINAL = "https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/{key}.{fmt}"
# Certains originaux sont refusés par le CDN : on passe alors par une transformation (≤ 2048 px en pratique).
CDN_FALLBACK = "https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,h_4000,w_4000,q_90/{key}.{fmt}"
# Vidéo d'exemple que Strikingly place par défaut dans les blocs « Media ».
PLACEHOLDER_VIDEOS = {"https://vimeo.com/18150336", "http://vimeo.com/18150336"}

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site-actuel"


# --------------------------------------------------------------------------- #
# Téléchargement
# --------------------------------------------------------------------------- #

def fetch(url, dest=None, tries=6):
    """Télécharge `url` (relances sur les erreurs réseau passagères)."""
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (export spiceevents)"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if dest:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
            return data
        except urllib.error.HTTPError as e:
            if e.code in (403, 404, 410):
                raise
            last = e
        except Exception as e:  # DNS, reset, timeout…
            last = e
        time.sleep(min(2 ** attempt, 16))
    raise RuntimeError(f"échec {url}: {last}")


def cached(url, cache):
    path = urllib.parse.urlparse(url).path.strip("/") or "index"
    dest = cache / f"{path}.html"
    if dest.exists() and dest.stat().st_size > 0:
        return dest.read_text()
    return fetch(url, dest).decode("utf-8")


def sitemap_urls(cache):
    xml = fetch(f"{SITE}/sitemap.xml", cache / "sitemap.xml").decode("utf-8")
    urls = re.findall(r"<loc>([^<]+)</loc>", xml)
    # Les pages de catégories du blog ne contiennent que des listes d'articles.
    return [u for u in urls if "/blog/categories" not in u]


def embedded(html, name):
    m = re.search(r"\$S\." + name + r"\s*=\s*", html)
    if not m:
        return None
    return json.JSONDecoder().raw_decode(html[m.end():])[0]


# --------------------------------------------------------------------------- #
# Images
# --------------------------------------------------------------------------- #

class Images:
    def __init__(self):
        self.items = {}  # clé -> dict

    def add(self, comp, where):
        """Enregistre une image Strikingly et renvoie l'URL de l'original."""
        key, fmt = comp.get("storageKey"), comp.get("format")
        url = comp.get("url") or ""
        if not key and (url in ("", "!") or url.startswith(("/images/", "/assets/"))):
            return None  # vide, ou image décorative fournie par le thème Strikingly
        fallback = None
        if key and fmt:
            original = CDN_ORIGINAL.format(key=key, fmt=fmt)
            fallback = CDN_FALLBACK.format(key=key, fmt=fmt)
            ident = key
        else:
            original = normalize_url(url)
            ident = original
        item = self.items.setdefault(ident, {
            "original": original,
            "affichee": normalize_url(url) if url not in ("", "!") else original,
            "secours": fallback,
            "largeur": comp.get("w") or "",
            "hauteur": comp.get("h") or "",
            "poids_octets": comp.get("s") or "",
            "fichier": local_name(ident, fmt or Path(urllib.parse.urlparse(original).path).suffix.lstrip(".")),
            "utilisee_dans": [],
        })
        if where not in item["utilisee_dans"]:
            item["utilisee_dans"].append(where)
        return item["original"]

    def add_url(self, url, where):
        url = normalize_url(url)
        m = re.search(r"/image/upload/(?:[^/]*,[^/]*/)?(\d+/[^/.]+)\.(\w+)$", url)
        if m:
            return self.add({"storageKey": m.group(1), "format": m.group(2), "url": url}, where)
        return self.add({"url": url}, where)


def normalize_url(url):
    if url.startswith("//"):
        return "https:" + url
    return url


def local_name(ident, fmt):
    base = re.sub(r"[^A-Za-z0-9_-]+", "_", ident.split("upload/")[-1]).strip("_")
    return f"{base}.{fmt}" if fmt and not base.endswith(fmt) else base


# --------------------------------------------------------------------------- #
# Rendu Markdown
# --------------------------------------------------------------------------- #

def md(html):
    text = markdownify(html or "", heading_style="ATX", bullets="-", strip=["span"])
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def link_of(comp):
    link = comp.get("link") or {}
    if isinstance(link, dict) and link.get("url"):
        return link["url"]
    return comp.get("url") or comp.get("link_url") or ""


SKIP = {"SlideSettings", "LayoutVariants", "Spacer", "Icon", "Blog.Header"}

# Ordre de lecture d'une section : fond, titres/textes, visuels, listes, boutons, formulaire.
ORDER = {"Background": 0, "RichText": 1, "Text": 1, "Image": 2, "Media": 2, "Video": 2, "Gallery": 3,
         "Slider": 3, "Repeatable": 3, "BlockComponent": 3, "Button": 4, "CustomForm": 5}


def ordered(components):
    """Composants d'un bloc dans l'ordre de lecture (text1 avant text2, etc.)."""
    def key(item):
        name, comp = item
        t = comp.get("type") if isinstance(comp, dict) else None
        num = re.search(r"(\d+)$", name)
        return (ORDER.get(t, 3), re.sub(r"\d+$", "", name), int(num.group(1)) if num else 0)
    return [c for _, c in sorted(components.items(), key=key)]


def shift_headings(text, levels=2):
    """Décale les titres internes pour qu'ils restent sous le titre de section."""
    return re.sub(r"^(#{1,6}) ", lambda m: "#" * min(6, len(m.group(1)) + levels) + " ", text, flags=re.M)


def render(comp, ctx, out, depth=0):
    """Ajoute à `out` les lignes Markdown d'un composant Strikingly."""
    if isinstance(comp, list):
        for c in comp:
            render(c, ctx, out, depth)
        return
    if not isinstance(comp, dict):
        return
    t = comp.get("type")

    if t in SKIP:
        return
    if t in ("RichText", "Blog.Text", "Text"):
        text = md(comp.get("value"))
        if text:
            out.append(shift_headings(text))
        return
    if t == "Image":
        original = ctx["images"].add(comp, ctx["where"])
        if original:
            alt = (comp.get("caption") or comp.get("description") or "").strip()
            out.append(f"![{alt}]({original})")
            if comp.get("link_url"):
                out.append(f"↳ lien de l'image : {comp['link_url']}")
        return
    if t == "Background":
        if comp.get("storageKey") and comp.get("useImage", True):
            original = ctx["images"].add(comp, ctx["where"] + " (fond)")
            out.append(f"_Image de fond :_ ![fond]({original})")
        if comp.get("videoUrl"):
            out.append(f"_Vidéo de fond :_ {comp['videoUrl']}")
        return
    if t == "Button":
        label = (comp.get("text") or "").strip()
        if label:
            out.append(f"**[Bouton] {label}** → {link_of(comp) or '(pas de lien)'}")
        return
    if t == "Video":
        url = comp.get("url") or ""
        if url and url not in PLACEHOLDER_VIDEOS:
            out.append(f"_Vidéo :_ {url}")
        return
    if t == "Media":
        current = comp.get("current") or "image"
        render(comp.get(current), ctx, out, depth)
        return
    if t == "Gallery":
        srcs = comp.get("sources") or []
        if srcs:
            out.append(f"_Galerie ({len(srcs)} images) :_")
            for s in srcs:
                original = ctx["images"].add(s, ctx["where"] + " (galerie)")
                cap = (s.get("caption") or s.get("title") or "").strip()
                out.append(f"- ![{cap}]({original})")
        return
    if t in ("Repeatable", "Slider"):
        label = "Diapositive" if t == "Slider" else "Élément"
        items = comp.get("list") or []
        for i, item in enumerate(items, 1):
            sub = []
            render(item.get("components") or {}, ctx, sub, depth + 1)
            if sub:
                out.append(f"**— {label} {i} —**")
                out.extend(sub)
        return
    if t == "CustomForm":
        out.append(render_form(comp))
        return
    if t == "EmailForm":
        out.append("_Formulaire (ancien modèle Strikingly)_")
    if t == "Blog.Section":
        render(comp.get("component"), ctx, out, depth)
        return
    if t == "Blog.Title":
        render(comp.get("title") or comp.get("value"), ctx, out, depth)
        return

    # Conteneurs génériques (BlockComponent, RepeatableItem, Slide, objets…)
    for key in ("components", "items", "list", "blocks", "sources"):
        if key in comp:
            render(ordered(comp[key]) if isinstance(comp[key], dict) else comp[key], ctx, out, depth)
    for key, val in comp.items():
        if key in ("components", "items", "list", "blocks", "sources"):
            continue
        if isinstance(val, dict) and val.get("type"):
            render(val, ctx, out, depth)


def render_form(comp):
    form = comp.get("customForm") or {}
    props = (((form.get("schema") or {}).get("properties") or {}).get("customized") or {}).get("properties") or {}
    order = (((form.get("editUi") or {}).get("customized") or {}).get("ui:order")) or list(props.keys())
    lines = [f"_Formulaire « {comp.get('form_name_label') or 'sans nom'} » :_"]
    for k in order:
        f = props.get(k)
        if not f:
            continue
        req = " (obligatoire)" if f.get("isRequired") else ""
        choices = f.get("enum") or ((f.get("items") or {}).get("enum")) or []
        extra = f" — choix : {', '.join(map(str, choices))}" if choices else ""
        lines.append(f"- {f.get('title') or k} [{f.get('fieldType')}]{req}{extra}")
    submit = form.get("submitButton") or comp.get("submit_button") or {}
    if isinstance(submit, dict) and submit.get("text"):
        lines.append(f"- Bouton d'envoi : {submit['text']}")
    return "\n".join(lines)


def render_page(page, images):
    path = page.get("path") or "/"
    lines = [f"# {page.get('title')}", ""]
    lines += [
        f"- **URL** : {SITE}{'' if path == '/accueil' else path}",
        f"- **Titre SEO** : {page.get('pageTitle') or '—'}",
        f"- **Description SEO** : {page.get('description') or '—'}",
        "",
    ]
    for n, sec in enumerate(page.get("sections") or [], 1):
        comps = sec.get("components") or {}
        settings = comps.get("slideSettings") or {}
        name = settings.get("name") or sec.get("template_name")
        hidden = " — ⚠️ SECTION MASQUÉE" if settings.get("hidden_section") else ""
        lines.append(f"## Section {n} : {name}{hidden}")
        lines.append(f"<sub>modèle Strikingly : `{sec.get('template_name')}`</sub>")
        lines.append("")
        out = []
        ctx = {"images": images, "where": f"{path} §{n}"}
        render(ordered(comps), ctx, out)
        lines.append("\n\n".join(out) if out else "_(section vide)_")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def render_post(data, url, images):
    meta = data.get("blogPostMeta") or {}
    content = data.get("content") or {}
    header = content.get("header") or {}
    social = meta.get("socialMediaConfig") or {}
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    ctx = {"images": images, "where": f"/blog/{slug}"}
    title = md((header.get("title") or {}).get("value")).strip("* ") or social.get("title") or slug
    subtitle = md((header.get("subTitle") or {}).get("value"))
    cover = social.get("image")
    if cover:
        cover = images.add_url(cover, ctx["where"] + " (couverture)")
    cats = ", ".join((c.get("name") if isinstance(c, dict) else str(c)) for c in meta.get("categories") or []) or "—"
    lines = [
        "---",
        f"titre: {json.dumps(title, ensure_ascii=False)}",
        f"url: {url}",
        f"publie_le: {meta.get('publishedAt') or ''}",
        f"cree_le: {meta.get('createdAt') or ''}",
        f"categories: {json.dumps(cats, ensure_ascii=False)}",
        f"couverture: {cover or ''}",
        f"description: {json.dumps((social.get('description') or '').strip(), ensure_ascii=False)}",
        "---",
        "",
        f"# {title}",
        "",
    ]
    if subtitle:
        lines += [f"_{subtitle.strip('*_ ')}_", ""]
    out = []
    render(content.get("sections") or [], ctx, out)
    lines.append("\n\n".join(out))
    return "\n".join(lines).strip() + "\n"


# --------------------------------------------------------------------------- #
# Programme principal
# --------------------------------------------------------------------------- #

def slug_of(url):
    return urllib.parse.urlparse(url).path.strip("/") or "accueil"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cache", default=str(ROOT / ".cache" / "html"), help="dossier de cache des pages HTML")
    ap.add_argument("--images", action="store_true", help="télécharger aussi les images originales")
    args = ap.parse_args()
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)

    images = Images()
    urls = sitemap_urls(cache)
    print(f"{len(urls)} URL dans le sitemap")

    site_written = False
    pages_index, posts_index = [], []
    for url in urls:
        slug = slug_of(url)
        try:
            html = cached(url, cache)
        except Exception as e:
            print(f"  ✗ {url} : {e}", file=sys.stderr)
            continue

        if slug.startswith("blog/"):
            data = embedded(html, "blogPostData")
            if not data:
                print(f"  ✗ pas de données d'article : {url}", file=sys.stderr)
                continue
            name = slug.split("/", 1)[1]
            write_json(OUT / "donnees" / "blog" / f"{name}.json",
                       {k: data[k] for k in ("blogPostMeta", "content", "settings") if k in data})
            text = render_post(data, url, images)
            (OUT / "blog").mkdir(parents=True, exist_ok=True)
            (OUT / "blog" / f"{name}.md").write_text(text)
            meta = data.get("blogPostMeta") or {}
            title = re.search(r'^titre: "(.*)"$', text, re.M)
            posts_index.append((meta.get("publishedAt") or "", name, title.group(1) if title else name))
            continue

        stores = embedded(html, "stores")
        if not stores:
            print(f"  ✗ pas de données de page : {url}", file=sys.stderr)
            continue
        page_data = stores["pageData"]
        if not site_written:
            nav = embedded(html, "nav")
            write_json(OUT / "donnees" / "site.json", {
                "pages": [{k: p.get(k) for k in ("title", "path", "pageTitle", "description")} for p in page_data["pages"]],
                "navigation": nav,
                "menu": page_data.get("menu"),
                "footer": page_data.get("footer"),
                "polices": {k: page_data.get(k) for k in ("titleFont", "bodyFont", "headingFont", "buttonFont", "navItemFont")},
                "theme": page_data.get("theme"),
                "mentions_conditions": page_data.get("termsText"),
            })
            render_site_chrome(page_data, images)
            site_written = True

        target = "/accueil" if slug == "accueil" else "/" + slug
        candidates = [p for p in page_data["pages"] if p.get("path") == target]
        if not candidates:
            # Page supprimée mais encore listée dans le sitemap : Strikingly sert l'accueil.
            print(f"  – ignorée (page supprimée, encore dans le sitemap) : {target}", file=sys.stderr)
            continue
        page = candidates[0]
        name = target.strip("/")
        write_json(OUT / "donnees" / "pages" / f"{name}.json", page)
        (OUT / "pages").mkdir(parents=True, exist_ok=True)
        (OUT / "pages" / f"{name}.md").write_text(render_page(page, images))
        pages_index.append((name, page.get("title"), len(page.get("sections") or [])))
        print(f"  ✓ {target}")

    write_manifest(images)
    write_index(pages_index, posts_index, images)
    print(f"{len(pages_index)} pages, {len(posts_index)} articles, {len(images.items)} images")

    if args.images:
        download_images(images, cache.parent)


def render_site_chrome(page_data, images):
    """Menu latéral et pied de page communs à toutes les pages."""
    lines = ["# Éléments communs (menu et pied de page)", ""]
    for label, block in (("Menu / barre latérale", page_data.get("menu")), ("Pied de page", page_data.get("footer"))):
        lines += [f"## {label}", ""]
        out = []
        render(ordered((block or {}).get("components") or {}), {"images": images, "where": label}, out)
        lines += ["\n\n".join(out), ""]
    terms = page_data.get("termsText")
    if terms:
        lines += ["## Conditions / mentions (texte Strikingly)", "", md(terms), ""]
    (OUT / "pages").mkdir(parents=True, exist_ok=True)
    (OUT / "pages" / "_commun.md").write_text("\n".join(lines).strip() + "\n")


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n")


def write_manifest(images):
    path = OUT / "images" / "manifeste.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["fichier_web", "url_original", "largeur", "hauteur", "poids_original", "poids_web",
                    "utilisee_dans"])
        for it in sorted(images.items.values(), key=lambda x: x["fichier"]):
            w.writerow([it.get("fichier_web", ""), it["original"], it["largeur"], it["hauteur"], it["poids_octets"],
                        it.get("poids_web", ""), " | ".join(it["utilisee_dans"])])


def write_index(pages, posts, images):
    lines = [
        "# Contenu du site actuel — www.spiceevents.fr",
        "",
        "Export automatique du site Strikingly (`outils/export_strikingly.py`).",
        "Chaque fiche reprend, section par section, les textes, images, boutons et liens tels qu'ils sont en ligne.",
        "Les sections masquées sur le site sont signalées par ⚠️.",
        "",
        "- `pages/` : une fiche par page (+ `_commun.md` pour le menu et le pied de page)",
        "- `blog/` : un fichier par article (date, catégorie, image de couverture en en-tête)",
        "- `images/fichiers/` : les images en version web (côté long ≤ 2400 px)",
        "- `images/manifeste.csv` : correspondance fichier web ↔ URL de l'original pleine résolution ↔ pages",
        "- `donnees/` : données brutes Strikingly (JSON), pour référence",
        "",
        f"## Pages ({len(pages)})",
        "",
        "| Page | Fichier | Sections |",
        "|---|---|---|",
    ]
    for name, title, n in pages:
        lines.append(f"| {title} | [pages/{name}.md](pages/{name}.md) | {n} |")
    lines += ["", f"## Articles de blog ({len(posts)})", "", "| Date | Article |", "|---|---|"]
    for date, name, title in sorted(posts, reverse=True):
        lines.append(f"| {date[:10]} | [{title}](blog/{name}.md) |")
    total = sum(int(i["poids_octets"] or 0) for i in images.items.values())
    lines += ["", "## Images", "",
              f"{len(images.items)} images référencées (≈ {total / 1e6:.0f} Mo en originaux) — voir `images/manifeste.csv`."]
    (OUT / "README.md").write_text("\n".join(lines) + "\n")


def download_images(images, cache):
    """Télécharge les originaux (cache local) puis écrit des versions web dans le dépôt.

    Les originaux pèsent ~650 Mo : ils restent dans le cache (non versionné) et
    restent accessibles via leur URL dans le manifeste. Le dépôt reçoit des
    copies redimensionnées (côté long ≤ WEB_MAX px) et recompressées.
    """
    from concurrent.futures import ThreadPoolExecutor

    originals = cache / "images-originales"
    web = OUT / "images" / "fichiers"
    originals.mkdir(parents=True, exist_ok=True)
    web.mkdir(parents=True, exist_ok=True)

    def one(it):
        src = originals / it["fichier"]
        if not (src.exists() and src.stat().st_size > 0):
            last = None
            for url in dict.fromkeys(u for u in (it["original"], it.get("secours"), it["affichee"]) if u):
                try:
                    fetch(url, src, tries=4)
                    break
                except Exception as e:
                    last = e
            else:
                return it, f"téléchargement : {last}"
        try:
            optimize(src, web, it)
        except Exception as e:
            return it, f"optimisation : {e}"
        return it, None

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(one, images.items.values()))
    fails = [(it, err) for it, err in results if err]
    for it, err in fails:
        print(f"  ✗ image {it['fichier']} : {err}", file=sys.stderr)
    print(f"images : {len(results) - len(fails)} ok, {len(fails)} en échec")
    write_manifest(images)


WEB_MAX = 2400


def optimize(src, folder, it):
    from PIL import Image, ImageOps

    with Image.open(src) as im:
        fmt = (im.format or "").upper()
        it["largeur"], it["hauteur"] = im.size
        it["poids_octets"] = src.stat().st_size
        stem = Path(it["fichier"]).stem if Path(it["fichier"]).suffix.lower() in IMG_EXT else it["fichier"]
        if fmt in ("GIF", "ICO"):
            dest = folder / f"{stem}.{fmt.lower()}"
            dest.write_bytes(src.read_bytes())
        else:
            im = ImageOps.exif_transpose(im)
            has_alpha = im.mode in ("RGBA", "LA", "P") and im.convert("RGBA").getextrema()[3][0] < 255
            if max(im.size) > WEB_MAX:
                im.thumbnail((WEB_MAX, WEB_MAX), Image.LANCZOS)
            if has_alpha:
                dest = folder / f"{stem}.png"
                im.convert("RGBA").save(dest, "PNG", optimize=True)
            else:
                dest = folder / f"{stem}.jpg"
                im.convert("RGB").save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        it["fichier_web"] = dest.name
        it["poids_web"] = dest.stat().st_size


IMG_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".svg"}


if __name__ == "__main__":
    main()
