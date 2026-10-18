# Brief commun — refonte spiceevents.fr

Dépôt : `/home/user/spiceevents`. Site vitrine Next.js 15 (App Router) + next-intl, bilingue FR (racine) / EN (`/en`), charte « Nuit de fête » (fond nuit, ivoire, accent doré ; Bodoni Moda + Manrope).

## À lire avant d'écrire du code
- `docs/superpowers/plans/2026-10-15-refonte-site.md` (architecture, pages, décisions)
- **Page de référence** : `app/[locale]/page.tsx` + son contenu `contenu/pages/accueil.ts` (modèle : un fichier de contenu par page, typé, `Bilingue<T>` FR + EN côte à côte)
- Composants à réutiliser : `components/common/*` (Section, EnTetePage, Etapes, Faq, Avis, AppelContact, BandeauPreuves, CarteOption, Accent), `components/ui/*` (Photo, Bouton)
- Données : `contenu/site.ts`, `lib/avis/` (avis lus en base, repli sur `contenu/avis.generated.json`), `contenu/options.ts`, `contenu/types.ts`
- Routage : `i18n/routing.ts` (chemins internes FR → adresses EN), `i18n/navigation.ts` (`Link`), `lib/seo/metadonnees.ts`
- Contenu de l'ancien site : `site-actuel/pages/*.md` (fiches lisibles), `site-actuel/blog/*.md`, données brutes `site-actuel/donnees/`

## Règles
- **Cohérence graphique** : avant tout élément visuel, regarder comment c'est fait dans l'accueil et les composants existants, et reproduire (mêmes classes, espacements, typographies, boutons). Pas de nouveau style si un équivalent existe.
- Code, noms et commentaires **en français** (camelCase / PascalCase), comme l'existant. Densité de commentaires comparable.
- Chaque page : `generateMetadata` via `metadonnees()` (titre + description **uniques**, mots-clés locaux « Île-de-France / Paris » quand c'est pertinent), `setRequestLocale(locale)`, **un seul `<h1>`** (fourni par `EnTetePage`), `generateStaticParams` pour les routes dynamiques (slugs traduits par langue).
- **Aucun fait inventé** : pas de chiffre, prix, avis, client, distinction ou promesse qui ne figure pas dans l'ancien site ou `contenu/site.ts`. Un fait manquant indispensable → texte `[À COMPLÉTER : …]` + le signaler dans le compte rendu.
- Réécrire les textes de l'ancien site : corriger les fautes, raccourcir, une promesse claire par section, ton chaleureux et premium, vouvoiement. Anglais britannique naturel (pas de traduction mot à mot).
- Images : uniquement des fichiers de `site-actuel/images/fichiers/`. Les ajouter dans **votre propre fichier** `contenu/images/<groupe>.json` (même format que `contenu/images/commun.json`, clés uniques préfixées par votre groupe), puis lancer `python3 outils/preparer_images.py`. Planches-contact pour choisir : `/tmp/claude-0/-home-user-spiceevents/8973064e-7b12-5e8f-a1b0-62519ca7c7da/scratchpad/sheet0.jpg` … `sheet3.jpg` (numéro → fichier dans `sheet_index.json` du même dossier) ; le manifeste `site-actuel/images/manifeste.csv` indique où chaque image était utilisée. Regarder une image avant de l'utiliser.
- **Ne pas modifier** (demander dans le compte rendu si besoin) : `messages/*.json`, `components/layout/*`, `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `next.config.ts`, `i18n/*`, `lib/seo/*`, `contenu/images/commun.json`, `contenu/avis.generated.json`, `package.json`.
- Vérifications autorisées : `npx tsc --noEmit`, `npx eslint <vos fichiers>`, `npx vitest run <vos tests>`. **Ne pas lancer** `next build`, `next dev` ni `next start` (d'autres agents travaillent en parallèle dans le même dossier). **Ne pas faire de commit ni de push.**
- Compte rendu final : fichiers créés/modifiés, choix faits, ce qui n'a pas pu être vérifié, questions pour Cédric.
