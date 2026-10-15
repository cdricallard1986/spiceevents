# Spice Events — refonte du site

Dépôt de travail pour la refonte de [www.spiceevents.fr](https://www.spiceevents.fr) (actuellement sur Strikingly).

- [`site-actuel/`](site-actuel/README.md) : tout le contenu du site en ligne (pages, articles de blog, inventaire des images), exporté automatiquement.
- `outils/export_strikingly.py` : script d'export, à relancer pour rafraîchir `site-actuel/`.

```bash
pip install markdownify pillow
python3 outils/export_strikingly.py            # textes, structure, inventaire des images
python3 outils/export_strikingly.py --images   # + images en version web (originaux gardés dans .cache/)
```
