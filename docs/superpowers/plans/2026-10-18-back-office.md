# Back office de spiceevents.fr — plan

_18 octobre 2026_

## Objectif

Cédric gère lui-même, sans passer par Claude : les **avis des mariés**, les **articles du journal**,
les **photos des galeries** et les **demandes de contact**. Le back office regroupe aussi la page
**`/admin/tests`** (comportements SQL, audit des droits en base, tests unitaires, configuration) et la page **`/admin/emails`**
(envoi réel des emails du formulaire à une adresse de test).

## Décisions de Cédric (18 octobre)

- **Un seul compte** (le sien) : auth « à plat », sans table de rôles.
- **Dans le site**, sous `/admin` (pas d'application séparée) : publier met à jour la page publique
  en quelques secondes.
- **Éditeur visuel** pour les articles (titres, gras, listes, liens, photos dans le texte).
- En plus : **demandes de contact** et **photos des galeries**. Pas de tableau de bord chiffré ni de
  traduction automatique pour l'instant.

## Architecture

- **Supabase devient la source des avis, articles, photos de galerie et demandes.** Le reste des
  textes du site reste dans le code (pages TypeScript), modifié par Claude.
- **Les pages publiques restent statiques.** Les lectures passent par `unstable_cache` avec une
  étiquette par domaine (`avis`, `articles`, `galeries`) ; chaque action du back office appelle
  `revalidateTag()` → la page est régénérée à la visite suivante. Filet : revalidation horaire.
- **Lecture publique** avec la clé publishable (RLS : `select` des seules lignes publiées) ; **écriture**
  par la session de Cédric (RLS : `est_admin()`). La clé `service_role` reste réservée au formulaire
  de contact et aux tâches serveur.
- **Défense en profondeur sur l'auth à plat** : inscriptions **désactivées** dans Supabase, et
  `est_admin()` vérifie en plus l'appartenance à la table `administrateurs` (une ligne : Cédric). Un
  compte créé par erreur n'aurait donc aucun droit.
- **Middleware** : `/admin/*` → vérification de session (`getUser()`), sinon
  `/admin/connexion?raison=…` ; tout le reste → middleware `next-intl` actuel.
- `/admin` est hors i18n (français seul), `noindex`, interdit dans `robots.txt`.
- **dev et main partagent la base** (règle de Cédric). Toutes les migrations ajoutent sans rien
  retirer : la production continue de lire ses fichiers tant que le nouveau code n'est pas sur `main`.
  Une fois en production, **le back office s'utilise sur l'adresse de production** (c'est elle qui se
  régénère).

## Schéma (migrations `0002` → `0006`)

| Table | Rôle | RLS |
|---|---|---|
| `administrateurs` | `user_id` de Cédric | aucune policy (lue par `est_admin()`, SECURITY DEFINER) |
| `audit_log` + `audit_trigger()` | historique des modifications | lecture admin |
| `tentatives_connexion` | limite des connexions, empreintes HMAC | aucune policy |
| `avis` | auteurs, rôle, texte FR/EN, citation courte FR/EN, catégorie, source (site, Mariages.net, Google), date, lien, `publie`, `ordre`, `emplacements[]` (accueil, mariages, option:…) | anon : `publie` ; admin : tout |
| `photos` | chemin (fichier du site ou Storage), largeur, hauteur, texte alternatif FR/EN, crédit | anon : tout ; admin : tout |
| `galeries_photos` | galerie (`galerie_mariages`, `galerie_evenements`, `option:<slug>`), photo, ordre | anon : tout ; admin : tout |
| `articles` | slug (figé après publication), titre, sous-titre, description, catégorie, date, couverture, contenu (JSON de l'éditeur), statut `brouillon`/`publie` | anon : `publie` ; admin : tout |
| `demandes_contact` (+) | `statut` (nouvelle, rappelée, devis envoyé, signée, perdue), `note_interne` | inchangé (service_role) ; admin : lecture + ces deux colonnes |

Bucket Storage **`medias`** : lecture publique (photos du site), écriture admin seulement, envoi
direct navigateur → Storage par URL signée (règle des 4,5 Mo de Vercel).

## Étapes

Chaque étape : tests + `tsc` + build, bump de version, push sur `dev`, vérification sur l'aperçu
Vercel, puis `main` sur accord de Cédric.

0. **Fondations** — clients `@supabase/ssr`, middleware combiné, connexion (mot de passe, limite de
   tentatives, 1,5 s minimum, message de raison), déconnexion `scope: "local"`, mise en page admin
   (menu repliable, badge de version, toasts, `ConfirmDialog`, hook `useModalAutosave` + pill de
   statut), DevToolbar (dev seulement), migrations `administrateurs` / `audit_log` /
   `tentatives_connexion`, test qui refuse tout `signOut()` sans argument.
1. **Tests & emails** — `/admin/tests` : rapport Vitest régénéré au `prebuild`, servi par une route
   protégée ; audit RLS réel (clé publishable : refus sur les tables privées, seules les lignes
   publiées visibles ; session admin : accès). `/admin/emails` : envoi des emails du formulaire (FR et
   EN, notification + accusé) à l'adresse de Cédric, objet préfixé `[TEST]`.
2. **Avis** — table + import des 43 avis et de leurs traductions (mêmes choix d'avis sur chaque
   page qu'aujourd'hui) ; pages publiques branchées sur la base ; liste filtrable, modale
   auto-enregistrée, création, publication / suppression confirmées, ordre.
3. **Demandes de contact** — liste (nouvelles en tête, demandes dont l'email n'est pas parti
   signalées), fiche en modale avec statut et note auto-enregistrés, liens appeler / écrire.
4. **Photos des galeries** — bucket `medias`, envoi direct, import des galeries actuelles (fichiers
   du site, sans les déplacer), ajout / retrait / ordre / texte alternatif ; CSP et `next/image`
   ouverts au domaine Supabase.
5. **Journal** — conversion des 37 articles MDX vers le format de l'éditeur (script testé), import ;
   rendu public par un composant pur et testé ; éditeur visuel (Tiptap) auto-enregistré, brouillon
   créé à l'ouverture, aperçu, publication confirmée, slug figé après publication ; plan du site lu
   en base ; nouvelles adresses d'articles générées à la demande.
6. **Sauvegardes** — dump quotidien (GitHub Actions) vers un dépôt privé `spiceevents-backups`,
   fichiers du bucket `medias` compris ; une restauration d'essai.
7. **Bascule** — sur accord : `main`, puis retrait des anciennes sources (fichiers JSON des avis, MDX).
   Routine de veille de sécurité hebdomadaire.

## Page Tests (`/admin/tests`)

_19 octobre — même mécanique que la page Tests du CRM, au style du back office._

- **Quatre onglets**, chacun avec une **pastille de verdict** visible sans l'ouvrir (`✓`, `✗ n`,
  `…` en cours, `!` n'a pas pu s'exécuter) ; onglet ouvert gardé dans l'adresse (`?onglet=droits`),
  flèches du clavier :
  1. **Comportements SQL** — `tests_sql()` (migration `0010`) : contraintes des articles, avis,
     photos et demandes, triggers `articles_slug_fige` / `touch_updated_at` / `audit_trigger`,
     cascade des galeries, `est_admin()`. Chaque cas écrit dans les vraies tables puis lève `ZZ001`
     pour tout annuler ; chaque refus a son contrôle négatif. Route gardée `/admin/tests/sql`.
  2. **Audit des droits** — l'audit RLS (visiteur + session), Server Action `lancerAuditRls`.
  3. **Tests unitaires** — rapport Vitest régénéré au `prebuild`, version et date du build.
  4. **Configuration** — présence des secrets, valeurs non secrètes.
- Les deux suites « live » partent **automatiquement à l'ouverture**, en parallèle, même onglet
  fermé (c'est ce qui renseigne les pastilles) ; un bouton **Relancer** reste.
- **À chaque commit**, job **« Audits base »** de la CI (`npm run audits:base`,
  `tests/audits-base.integration.ts`, hors `npx vitest run` et hors prebuild) : audit côté visiteur
  (clé publishable, toujours) et `tests_sql()` avec la clé service_role si le secret GitHub
  `supabase_service_role_key` existe (sinon avertissement, sans bloquer). Rien n'est écrit
  durablement. ⚠️ Appliquer une migration de test **avant** de pousser le code qui l'appelle, sinon
  le job est rouge (« la suite n'a pas pu s'exécuter »).

## À faire par Cédric

- Supabase → **Authentication → Sign In / Providers** : désactiver **Allow new users to sign up** ;
  mots de passe : 12 caractères minimum, minuscules + majuscules + chiffres + symboles, **Leaked
  password protection**, **Secure password change**, **Secure email change**, liens email ≤ 1 h ;
  **Sessions → Inactivity timeout** : 7 jours.
- Supabase → **Authentication → Users → Add user** : son compte (email + mot de passe), puis me le dire
  pour que je l'inscrive dans `administrateurs`.
- Étape 6 : créer le dépôt privé `spiceevents-backups` et les deux secrets (indiqués le moment venu).

## Écarts assumés au skill `creer-plateforme`

- **Pas de shadcn/ui** : le site a déjà ses composants et sa charte « Nuit de fête » ; l'admin les
  réutilise (cohérence graphique).
- **Pas d'usurpation d'identité ni de tableau de bord KPI** : un seul compte, et Cédric n'a pas
  demandé de chiffres.
- **DevToolbar** réduit : il n'y a qu'un profil ; il bascule entre « Cédric connecté » et « visiteur ».
- **Statut d'une demande de contact** : modifiable sans confirmation (simple suivi commercial, sans
  effet externe).
