# Refonte de spiceevents.fr — plan

_15 octobre 2026_

## Objectifs (fixés par Cédric)

1. **Quitter Strikingly** : meilleur référencement Google, plus d'abonnement.
2. **Un site plus beau**, pensé pour que **plus de mariés prennent contact**.
3. **Bilingue français / anglais**.
4. Modifications du site faites par Claude (pas d'éditeur visuel à prévoir).
5. Contenu : garder uniquement ce qui sert (recommandations ci-dessous).

## Diagnostic du site actuel

Constaté sur l'export (`site-actuel/`) et le code HTML servi par Strikingly :

| Problème | Effet |
|---|---|
| Pages HTML de ~700 Ko, chargées de scripts Strikingly | Lenteur sur mobile, pénalisée par Google |
| Jusqu'à **20 balises `<h1>` par page** (Mariages : 20, Événementiel : 15) | Google ne sait pas quel est le sujet de la page |
| **Aucune balise `<meta name="description">`** (seulement Open Graph) | Google invente l'extrait affiché dans les résultats |
| Titres de page génériques (« Mariage », « Booking DJ »), **aucune zone géographique** | Aucune chance sur « DJ mariage + ville / région » |
| Suivi d'audience **Universal Analytics** (`UA-…`), arrêté par Google en juillet 2023 | Aucune statistique de visite depuis 3 ans |
| Sitemap qui liste 2 pages supprimées (`/pourquoi-nous-choisir`, `/test`) | Contenu dupliqué de l'accueil |
| Sections dupliquées « version mobile » masquées, restes de modèle (« Lorem ipsum », « Add subtitle », « How to Build a Website… ») dans les données | Contenu parasite, maintenance confuse |
| Fautes de frappe (« technninques », « organnisé », « Coordinnation », « sponnsoring », « gurilandes »…) | Image moins soignée |
| Les **Wedding Awards Mariages.net 2022, 2024 et 2025** ne sont pas mis en avant | Meilleur argument de confiance inexploité |
| Pas de mentions légales ni de politique de confidentialité | Obligation légale (LCEN, RGPD) |

## Architecture proposée

Cible principale : **les couples qui préparent leur mariage**. L'événementiel privé/entreprise reste présent, en second plan.
Le français est servi à la racine (`/…`), l'anglais sous `/en/…` avec des adresses traduites.

| Page FR | Page EN | Contenu repris de | Remarques |
|---|---|---|---|
| `/` Accueil | `/en` | accueil, mariages | Accroche mariage, preuves (awards, 20 ans, 350+), déroulé de la journée, avis, CTA |
| `/mariages` | `/en/weddings` | mariages, accompagnement, booking-dj | **Page pivot** : DJ, déroulé (cérémonie → soirée), méthode en 4 étapes, FAQ mariage, avis |
| `/animations` | `/en/entertainment` | animations-tendances | Vue d'ensemble des options |
| `/animations/<option>` (8 pages) | `/en/entertainment/<option>` | photobooth, bar-a-vinyles, livre-d-or-audio, ouverture-de-bal-spectaculaire, guirlandes-lumineuses, mur-d-eau-and-vegetal, sonorisation-ceremonie-laique, sonorisation-deportee | Un gabarit commun, contenu nettoyé ; bon pour la longue traîne (« livre d'or audio mariage ») |
| `/evenementiel` | `/en/events` | evenementiel | Soirées privées, anniversaires, entreprises |
| `/a-propos` | `/en/about` | cedric-allard, accompagnement (valeurs), performances-techniques-son-and-lumieres | Cédric, la méthode, le partenariat technique MX Événement |
| `/avis` | `/en/reviews` | temoignages | **Avis réels uniquement**, lien vers Mariages.net |
| `/galerie` | `/en/gallery` | galerie-photo-mariage, galerie-photo-evenementiel | Sélection resserrée des meilleures photos |
| `/faq` | `/en/faq` | faq | Questions regroupées par thème, balisage FAQ pour Google |
| `/contact` | `/en/contact` | contactez-nous | Formulaire unique et court (prénoms, date, lieu, invités, contact, message) |
| `/journal` (blog) | — | blog | 37 articles conservés, en français seulement |
| `/recrutement` | — | on-recrute | Lien discret dans le pied de page, si le recrutement est toujours d'actualité |
| `/mentions-legales`, `/confidentialite` | `/en/legal`, `/en/privacy` | — | Nouvelles, obligatoires |

**Supprimées** (avec redirection 301 vers la page la plus proche, pour ne rien perdre en référencement) : `/booking-dj` → `/mariages`, `/accompagnement` → `/mariages#methode`, `/performances-techniques-son-and-lumieres` → `/a-propos#technique`, `/cedric-allard` → `/a-propos`, `/temoignages` → `/avis`, `/galerie-photo-*` → `/galerie`, `/contactez-nous` → `/contact`, `/blog/*` → `/journal/*`, `/pourquoi-nous-choisir` et `/test` → `/`. Chaque ancienne adresse d'option (`/photobooth`…) → `/animations/<option>`.

### Blog : articles retirés (14)

Actualités datées ou hors sujet, sans valeur pour un couple en 2026 ; chacun redirigé (301) vers la page la plus proche :
nouvel arrivage L-Acoustics (×2), régie Pioneer blanche, enceinte Maui5go, 10 ans de la Jungle, Amnesty International 2019, soirée blanche à Lagny, anniversaire de 30 ans, « un anniversaire de talent », ouverture de bal 2019 (doublon de la page), « Les robes tendances pour 2026 » (écrit en 2021), « Tendances mariage 2025 » (périmé), magicien (images mortes, prestation non proposée), EVJF.

Conservés : les 18 articles récents (déc. 2025 → avr. 2026), les conseils mariage intemporels de 2021-2022 et les 3 reportages de mariages (Sauveboeuf, Hardricourt, Massiac), regroupés dans une catégorie « Mariages réalisés ».

## Choix techniques

Stack de Cédric (skill `creer-plateforme`), adaptée à un **site vitrine sans comptes utilisateurs** :

- **Next.js 15 (App Router) · TypeScript · Tailwind 4 · React 19**, hébergé sur **Vercel**.
- **Toutes les pages générées à l'avance (statique)** : chargement quasi instantané, idéal pour Google.
- **Bilingue avec `next-intl`** : adresses traduites, balises `hreflang`, sélecteur de langue, détection de la langue du navigateur uniquement à la première visite.
- **Contenu dans le dépôt** : textes des pages en fichiers TypeScript typés (`contenu/fr`, `contenu/en`), articles de blog en MDX. Pas de CMS.
- **Images** : `next/image` (AVIF/WebP, tailles adaptées à l'écran), à partir de `site-actuel/images/fichiers/`.
- **Référencement** : titre et description uniques par page avec la zone d'intervention, un seul `<h1>`, `sitemap.xml` bilingue, `robots.txt`, données structurées (entreprise locale, FAQ, articles, fil d'Ariane), image de partage par page, toutes les redirections 301.
- **Formulaire de contact** : Server Action + validation Zod + protection anti-spam (champ piège + limite par IP) ; email à Cédric via **Resend** + accusé de réception au couple ; **demande enregistrée dans Supabase** (aucune demande perdue si l'email échoue).
- **Mesure d'audience** sans bandeau cookies : Vercel Web Analytics (ou Plausible). Google Search Console vérifiée par DNS.
- **Sécurité** (skill) : en-têtes HTTP depuis `lib/securite/entetes.ts` testé (CSP fermée, `frame-ancestors 'none'`, HSTS en prod…), `poweredByHeader: false`, échappement des champs du formulaire dans les emails.
- **Pill « Nouvelle version disponible »** (skill, obligatoire) : route `/api/version` + empreinte de build.
- **Qualité** : Vitest (validation du formulaire, table des redirections, correspondance FR/EN des adresses, en-têtes), CI GitHub (lint, types, tests, build, `npm audit --omit=dev --audit-level=high`), Dependabot (`target-branch: dev`).

### Écarts assumés par rapport au skill `creer-plateforme`

Pas d'authentification sur un site vitrine, donc **sans objet** : rôles/RLS multi-rôles, modales auto-enregistrées, DevToolbar, badge de version, impersonation, page `/tests` super_admin, réglages de sessions et de mots de passe. La seule table Supabase (`demandes_contact`) a la RLS activée **sans aucune policy** : seul le serveur (`service_role`) y écrit et y lit.

## Étapes

1. **Choix de la piste graphique** (maquettes) et réponses de Cédric aux questions ouvertes.
2. Socle Next.js : structure, bilinguisme, design system (couleurs, typographies, composants), en-têtes de sécurité, CI.
3. Gabarits et pages : accueil, mariages, animations (+ 8 options), événementiel, à propos, avis, galerie, FAQ, contact, mentions légales.
4. Réécriture des textes FR (corrections, une seule promesse claire par page, mots-clés locaux) puis **traduction EN**.
5. Journal : migration des 37 articles en MDX, catégories.
6. Formulaire : Supabase + Resend + anti-spam ; tests.
7. Référencement : métadonnées, `hreflang`, données structurées, sitemap, redirections 301 (testées une à une).
8. Recette : Lighthouse (objectif ≥ 95 partout), test sur mobile, relecture par Cédric sur l'adresse de pré-production Vercel.
9. **Mise en ligne** : bascule du DNS chez OVH vers Vercel (**sans toucher aux enregistrements MX** pour ne pas couper les emails `@spiceevents.fr`), envoi du sitemap à Google Search Console, suivi des erreurs 404 pendant un mois, puis résiliation de Strikingly.

## Décisions de Cédric (15 octobre 2026)

- Piste graphique **B — Nuit de fête** (fond nuit, ivoire, accent doré ; Bodoni Moda + Manrope).
- Zone mise en avant : **Île-de-France** (Paris dans les textes anglais).
- Les avis des pages Événementiel et Accompagnement sont **réels** : tous conservés (44 avis).
- Demandes de contact : **email à Cédric + accusé de réception + enregistrement en base Supabase**.
- Journal en français seulement ; page recrutement conservée (lien dans le pied de page, FR).
- Formulaire (16 octobre) : adresse affichée `cedric@spiceevents.fr`, expéditeur des emails `contact@spiceevents.fr`, aucun délai chiffré (« dans les meilleurs délais »), téléphone obligatoire.
- Contenu (16 octobre) : la formulation « Cédric mixe lui-même ou vous présente un DJ de l'équipe » est validée. Les limiteurs sonores n'empêchent pas d'intervenir, mais Cédric déconseille ces lieux. Le mapping vidéo, les lettres géantes, le feu d'artifice de jour, le magicien et la fanfare ne sont plus proposés : on renvoie vers des partenaires de confiance. Les formules Or, Platine et Diamant sont remplacées par une formule unique avec une option premium. Le recrutement de DJ généralistes est toujours ouvert.

## Questions encore ouvertes

- Mentions légales : forme juridique, adresse du siège, SIRET.
- Note et nombre d'avis sur Mariages.net et Google (affichage éventuel).
- Création du projet Supabase et du compte Resend (domaine d'envoi `spiceevents.fr`).
