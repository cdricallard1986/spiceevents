-- 0010_tests_sql.sql
-- Suite de tests des COMPORTEMENTS SQL, exécutée contre la vraie base
-- (onglet « Comportements SQL » de /admin/tests, et job « Audits base » de la
-- CI à chaque commit).
--
-- POURQUOI : Vitest ne voit rien de ce qui vit en base. Un trigger supprimé,
-- une contrainte réécrite trop large, une cascade oubliée passent tous les
-- tests unitaires (ils ne connaissent que le code TypeScript) et l'audit des
-- droits (il ne regarde que qui a le droit, pas ce que la base accepte). Cette
-- suite vérifie ce que la base ACCEPTE et REFUSE : contraintes des articles,
-- avis, photos et demandes, triggers `articles_slug_fige`, `touch_updated_at`
-- et `audit_trigger`, cascade des galeries, `est_admin()`.
--
-- MÉCANIQUE (celle du CRM, migration 0054) : chaque cas écrit dans les vraies
-- tables, observe, puis ANNULE. Le bloc `begin … exception` de plpgsql pose un
-- point de sauvegarde implicite : lever `ZZ001` fait reculer les écritures
-- (lignes, ligne du journal d'audit, table temporaire, réglages
-- `set_config(…, true)`), tandis que les VARIABLES plpgsql, elles, ne sont pas
-- transactionnelles et gardent l'observation. La base ressort donc inchangée.
-- Un refus attendu est rattrapé au plus près (bloc interne) et identifié par le
-- NOM de la contrainte qui l'a produit : un refus venu d'ailleurs (autre
-- contrainte, droits) ne passe pas pour le bon. Toute erreur INATTENDUE est
-- rattrapée par le bloc du cas et rapportée comme un échec, avec son message,
-- plutôt que de faire tomber la suite entière.
--
-- Chaque refus est accompagné d'un CONTRÔLE NÉGATIF (une valeur valide,
-- acceptée) : sans lui, une table qui refuserait tout passerait le cas.
-- Les slugs et chemins de test portent un suffixe aléatoire : aucun conflit
-- possible avec une vraie ligne.
--
-- SÉCURITÉ : SECURITY INVOKER, volontairement : la fonction écrit (même
-- annulé), elle s'exécute donc avec les droits et sous la RLS de l'appelant,
-- jamais avec ceux de son propriétaire. Appelée par :
-- - la session de Cédric (route gardée /admin/tests/sql, `exigerAdmin()`) :
--   les écritures passent par les policies `est_admin()` ; un autre compte
--   connecté verrait ses écritures refusées et la suite en échec ;
-- - la clé service_role (CI) : `auth.uid()` est alors nul, le cas
--   `est_admin()` de l'appelant est marqué « non applicable ».
-- `anon` n'a pas le droit de l'exécuter (PostgREST publie toute fonction
-- exécutable). `search_path` vide : tous les noms sont qualifiés.
--
-- Demandes de contact : la session admin n'a, par conception, aucun droit
-- d'écriture sur `demandes_contact` (seul le formulaire du site les crée, avec
-- la clé service_role). Sous cette session, les deux cas portent donc sur une
-- copie exacte de la structure (`like … including defaults including
-- constraints` : mêmes contraintes, mêmes noms, mêmes valeurs par défaut), dans
-- une table temporaire annulée avec le reste ; avec la clé service_role (CI),
-- sur la vraie table.
--
-- SENSIBILITÉ : une suite incapable d'échouer ne vaut rien. Chaque cas compare
-- une observation précise (nom de contrainte, valeur, nombre de lignes) à
-- l'attendu. Vérifié sur une copie locale du schéma (0001 → 0010, rôles
-- Supabase simulés) : 17/17 sous la session admin comme avec service_role,
-- base inchangée, et CHAQUE cas passe au rouge quand on réintroduit sa
-- régression (contrainte retirée ou élargie, trigger retiré ou qui fige tout,
-- cascade retirée, défaut changé, est_admin() toujours vrai). Un compte connecté
-- non administrateur voit 14 cas sur 17 en échec (ses écritures sont refusées).
-- À refaire sur la vraie base, dans une transaction annulée, par exemple :
--   begin;
--   drop trigger articles_touch_updated_at on public.articles;
--   select * from public.tests_sql() where not ok;   -- doit lister le cas
--   rollback;

create or replace function public.tests_sql()
returns table (nom text, ok boolean, detail text)
language plpgsql
security invoker
set search_path = ''
as $fn$
#variable_conflict use_column
declare
  a uuid; p uuid;
  obs text; err text; c text; n int;
  -- Suffixe aléatoire des slugs et chemins de test (hexadécimal : accepté par toutes les contraintes).
  sfx constant text := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  -- Un utilisateur connecté qui n'est pas administrateur.
  inconnu constant text := '00000000-0000-0000-0000-000000000001';
  -- Demandes de contact : vraie table si l'appelant peut y écrire, sinon copie temporaire.
  cible text;
  ou text;
begin
  -- ══ Journal (articles) ═════════════════════════════════════════════════

  -- ── 1. Un brouillon incomplet s'enregistre ────────────────────────────
  -- L'éditeur crée l'article dès son ouverture, sans titre ni rien d'autre.
  begin
    insert into public.articles (slug) values ('tests-sql-' || sfx || '-brouillon')
      returning statut into obs;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Journal : un brouillon incomplet s''enregistre'::text,
    coalesce(err is null and obs = 'brouillon', false),
    coalesce('erreur : ' || err,
      'article sans titre ni description créé, statut « ' || obs || ' » (attendu : brouillon)');

  -- ── 2. Publier un article incomplet est refusé, un article complet passe ─
  begin
    insert into public.articles (slug, titre, categorie, date_publication)
      values ('tests-sql-' || sfx || '-incomplet', 'Article de test', 'Technique', current_date)
      returning id into a;
    begin
      update public.articles set statut = 'publie', publie_le = now() where id = a;
      obs := case when found then 'publié' else 'aucune ligne modifiée' end;
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    -- Contrôle négatif : une fois description et couverture renseignées, la publication passe.
    begin
      update public.articles
        set description = 'Description de test.', couverture = '/journal/tests-sql.jpg',
            couverture_alt = 'Photo de test', statut = 'publie', publie_le = now()
        where id = a;
      obs := obs || ' / ' || case when found then 'publié' else 'aucune ligne modifiée' end;
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Journal : publier sans description ni couverture est refusé'::text,
    coalesce(err is null and obs = 'refusé (articles_publie_complet) / publié', false),
    coalesce('erreur : ' || err,
      'sans description ni couverture, puis complet : ' || obs
      || ' (attendu : refusé (articles_publie_complet) / publié)');

  -- ── 3. L'adresse d'un article publié est figée ────────────────────────
  -- Y compris s'il est repassé en brouillon : il a été publié, Google le connaît.
  begin
    insert into public.articles (slug, titre, description, categorie, date_publication,
                                 couverture, couverture_alt, statut, publie_le)
      values ('tests-sql-' || sfx || '-publie', 'Article de test', 'Description de test.', 'Technique',
              current_date, '/journal/tests-sql.jpg', 'Photo de test', 'publie', now())
      returning id into a;
    begin
      update public.articles set slug = 'tests-sql-' || sfx || '-renomme' where id = a;
      obs := case when found then 'modifiée' else 'aucune ligne modifiée' end;
    exception when check_violation then
      obs := case when sqlerrm like '%déjà publié%' then 'refusée' else 'refusée par autre chose : ' || sqlerrm end;
    end;
    update public.articles set statut = 'brouillon' where id = a;
    begin
      update public.articles set slug = 'tests-sql-' || sfx || '-renomme' where id = a;
      obs := obs || ' / ' || case when found then 'modifiée' else 'aucune ligne modifiée' end;
    exception when check_violation then
      obs := obs || ' / ' || case when sqlerrm like '%déjà publié%' then 'refusée' else 'refusée par autre chose : ' || sqlerrm end;
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Journal : l''adresse d''un article publié ne change plus'::text,
    coalesce(err is null and obs = 'refusée / refusée', false),
    coalesce('erreur : ' || err,
      'changement de slug publié, puis repassé en brouillon : ' || obs
      || ' (attendu : refusée / refusée, par articles_slug_fige)');

  -- ── 4. … mais celle d'un brouillon jamais publié reste libre ──────────
  -- Contrôle négatif du cas 3 : un trigger qui figerait tout le passerait.
  begin
    insert into public.articles (slug) values ('tests-sql-' || sfx || '-libre') returning id into a;
    update public.articles set slug = 'tests-sql-' || sfx || '-libre-renomme' where id = a;
    obs := (select x.slug from public.articles x where x.id = a);
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Journal : un brouillon jamais publié peut changer d''adresse'::text,
    coalesce(err is null and obs = 'tests-sql-' || sfx || '-libre-renomme', false),
    coalesce('erreur : ' || err,
      case when obs = 'tests-sql-' || sfx || '-libre-renomme' then 'slug modifié'
           else 'slug resté « ' || coalesce(obs, 'introuvable') || ' » (attendu : modifié)' end);

  -- ── 5. touch_updated_at ───────────────────────────────────────────────
  -- La date est posée dans le passé à la création : seule la mise à jour par
  -- le trigger peut l'amener à `now()` (heure de la transaction).
  begin
    insert into public.articles (slug, updated_at)
      values ('tests-sql-' || sfx || '-date', '2000-01-01T00:00:00Z') returning id into a;
    update public.articles set titre = 'Titre modifié' where id = a;
    obs := (select case when x.updated_at = now() then 'maintenant' else x.updated_at::text end
              from public.articles x where x.id = a);
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Journal : une modification met à jour updated_at'::text,
    coalesce(err is null and obs = 'maintenant', false),
    coalesce('erreur : ' || err,
      'updated_at après modification : ' || coalesce(obs, 'introuvable')
      || ' (attendu : maintenant, par touch_updated_at)');

  -- ── 6. audit_trigger ──────────────────────────────────────────────────
  begin
    insert into public.articles (slug) values ('tests-sql-' || sfx || '-audit') returning id into a;
    select count(*)::int, max(l.auteur::text) into n, c
      from public.audit_log l
     where l.table_nom = 'articles' and l.operation = 'INSERT'
       and l.ligne_id = a::text and l.apres ->> 'slug' = 'tests-sql-' || sfx || '-audit';
    obs := n || ' ligne' || case when n > 1 then 's' else '' end
        || ', auteur ' || case when c is not distinct from auth.uid()::text then 'conforme' else coalesce(c, 'vide') end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Journal d''audit : la création d''un article est tracée'::text,
    coalesce(err is null and obs = '1 ligne, auteur conforme', false),
    coalesce('erreur : ' || err,
      'audit_log après création : ' || obs || ' (attendu : 1 ligne, auteur = l''appelant)');

  -- ══ Avis ═══════════════════════════════════════════════════════════════

  -- ── 7. Emplacements ───────────────────────────────────────────────────
  begin
    begin
      insert into public.avis (auteurs, categorie, texte_fr, emplacements)
        values ('Tests SQL', 'mariage', 'Avis de test.', array['accueil', 'page-inconnue']);
      obs := 'accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    begin
      insert into public.avis (auteurs, categorie, texte_fr, emplacements)
        values ('Tests SQL', 'mariage', 'Avis de test.', array['accueil', 'option:tests-sql']);
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Avis : un emplacement inconnu est refusé'::text,
    coalesce(err is null and obs = 'refusé (avis_emplacements_check) / accepté', false),
    coalesce('erreur : ' || err,
      'emplacement inconnu, puis accueil + option : ' || obs
      || ' (attendu : refusé (avis_emplacements_check) / accepté)');

  -- ── 8. Lien vers la source ────────────────────────────────────────────
  begin
    begin
      insert into public.avis (auteurs, categorie, texte_fr, lien_source)
        values ('Tests SQL', 'mariage', 'Avis de test.', 'http://exemple.fr/avis');
      obs := 'accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    begin
      insert into public.avis (auteurs, categorie, texte_fr, lien_source)
        values ('Tests SQL', 'mariage', 'Avis de test.', 'javascript:alert(1)');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    begin
      insert into public.avis (auteurs, categorie, texte_fr, lien_source)
        values ('Tests SQL', 'mariage', 'Avis de test.', 'https://www.exemple.fr/avis/tests-sql');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Avis : seul un lien https:// est accepté'::text,
    coalesce(err is null and obs = 'refusé (avis_lien_source_check) / refusé (avis_lien_source_check) / accepté', false),
    coalesce('erreur : ' || err,
      'http://, javascript:, https:// : ' || obs
      || ' (attendu : refusé / refusé / accepté, par avis_lien_source_check)');

  -- ── 9. Texte vide ─────────────────────────────────────────────────────
  begin
    begin
      insert into public.avis (auteurs, categorie, texte_fr) values ('Tests SQL', 'mariage', '');
      obs := 'accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    begin
      insert into public.avis (auteurs, categorie, texte_fr) values ('Tests SQL', 'mariage', 'Avis de test.');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Avis : un texte vide est refusé'::text,
    coalesce(err is null and obs = 'refusé (avis_texte_fr_check) / accepté', false),
    coalesce('erreur : ' || err,
      'texte vide, puis texte renseigné : ' || obs || ' (attendu : refusé (avis_texte_fr_check) / accepté)');

  -- ══ Photos et galeries ═════════════════════════════════════════════════

  -- ── 10. Chemin d'une photo du site ────────────────────────────────────
  -- La contrainte (0006) lie `chemin` à `origine` : portant sur deux colonnes,
  -- elle a reçu de Postgres le nom de table, `photos_check`.
  begin
    begin
      insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
        values ('site', 'galeries/tests-sql/' || sfx || '.jpg', 1, 1, 'Photo de test');
      obs := 'accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    begin
      insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
        values ('site', '/images/../tests-sql-' || sfx || '.jpg', 1, 1, 'Photo de test');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    begin
      insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
        values ('site', '/images/tests-sql-' || sfx || '.jpg', 1, 1, 'Photo de test');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Photos : un fichier du site doit être sous /images/'::text,
    coalesce(err is null and obs = 'refusé (photos_check) / refusé (photos_check) / accepté', false),
    coalesce('erreur : ' || err,
      'galeries/…, /images/../…, /images/… : ' || obs
      || ' (attendu : refusé / refusé / accepté, par photos_check)');

  -- ── 11. Chemin d'une photo du stockage ────────────────────────────────
  begin
    begin
      insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
        values ('stockage', '/images/tests-sql-' || sfx || '.jpg', 1, 1, 'Photo de test');
      obs := 'accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    begin
      insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
        values ('stockage', 'galeries/../tests-sql/' || sfx || '.jpg', 1, 1, 'Photo de test');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    begin
      insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
        values ('stockage', 'galeries/tests-sql/' || sfx || '.jpg', 1, 1, 'Photo de test');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Photos : un fichier du stockage doit être sous galeries/'::text,
    coalesce(err is null and obs = 'refusé (photos_check) / refusé (photos_check) / accepté', false),
    coalesce('erreur : ' || err,
      '/images/…, galeries/../…, galeries/… : ' || obs
      || ' (attendu : refusé / refusé / accepté, par photos_check)');

  -- ── 12. Une photo n'apparaît qu'une fois par galerie ──────────────────
  begin
    insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
      values ('stockage', 'galeries/tests-sql/' || sfx || '-doublon.jpg', 1, 1, 'Photo de test')
      returning id into p;
    insert into public.galeries_photos (galerie, photo_id) values ('option:tests-sql', p);
    begin
      insert into public.galeries_photos (galerie, photo_id) values ('option:tests-sql', p);
      obs := 'accepté';
    exception when unique_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    -- Contrôle négatif : la même photo dans une autre galerie.
    begin
      insert into public.galeries_photos (galerie, photo_id) values ('galerie_mariages', p);
      obs := obs || ' / accepté';
    exception when unique_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Galeries : une photo n''y figure qu''une fois'::text,
    coalesce(err is null and obs = 'refusé (galeries_photos_galerie_photo_id_key) / accepté', false),
    coalesce('erreur : ' || err,
      'doublon dans la galerie, puis autre galerie : ' || obs
      || ' (attendu : refusé (galeries_photos_galerie_photo_id_key) / accepté)');

  -- ── 13. Supprimer une photo la retire de ses galeries ─────────────────
  begin
    insert into public.photos (origine, chemin, largeur, hauteur, alt_fr)
      values ('stockage', 'galeries/tests-sql/' || sfx || '-cascade.jpg', 1, 1, 'Photo de test')
      returning id into p;
    insert into public.galeries_photos (galerie, photo_id) values ('option:tests-sql', p), ('galerie_evenements', p);
    obs := (select count(*) from public.galeries_photos g where g.photo_id = p)::text;
    delete from public.photos where id = p;
    obs := obs || ' puis ' || case when found then '' else '(photo non supprimée) ' end
        || (select count(*) from public.galeries_photos g where g.photo_id = p)::text;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Galeries : supprimer une photo la retire de ses galeries'::text,
    coalesce(err is null and obs = '2 puis 0', false),
    coalesce('erreur : ' || err,
      'liaisons avant / après suppression : ' || obs || ' (attendu : 2 puis 0, cascade)');

  -- ══ Demandes de contact ════════════════════════════════════════════════

  if pg_catalog.has_table_privilege('public.demandes_contact', 'INSERT') then
    cible := 'public.demandes_contact';
    ou := 'sur la table';
  else
    cible := 'pg_temp.tests_sql_demandes';
    ou := 'sur une copie de sa structure (la session admin n''écrit pas les demandes)';
  end if;

  -- ── 14. Statut inconnu ────────────────────────────────────────────────
  begin
    if cible <> 'public.demandes_contact' then
      create temp table tests_sql_demandes (like public.demandes_contact including defaults including constraints);
    end if;
    begin
      execute format(
        'insert into %s (langue, prenoms, nom, email, telephone, type_evenement, message, statut)
         values (%L, %L, %L, %L, %L, %L, %L, %L)',
        cible, 'fr', 'Tests', 'SQL', 'tests-sql@example.invalid', '+33600000000', 'autre', 'Demande de test.', 'archivee');
      obs := 'accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := 'refusé (' || c || ')';
    end;
    begin
      execute format(
        'insert into %s (langue, prenoms, nom, email, telephone, type_evenement, message, statut)
         values (%L, %L, %L, %L, %L, %L, %L, %L)',
        cible, 'fr', 'Tests', 'SQL', 'tests-sql@example.invalid', '+33600000000', 'autre', 'Demande de test.', 'signee');
      obs := obs || ' / accepté';
    exception when check_violation then
      get stacked diagnostics c = constraint_name;
      obs := obs || ' / refusé (' || c || ')';
    end;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Demandes : un statut inconnu est refusé'::text,
    coalesce(err is null and obs = 'refusé (demandes_contact_statut_check) / accepté', false),
    coalesce('erreur : ' || err,
      'statut « archivee », puis « signee » : ' || obs
      || ' (attendu : refusé (demandes_contact_statut_check) / accepté), ' || ou);

  -- ── 15. Statut par défaut ─────────────────────────────────────────────
  begin
    if cible <> 'public.demandes_contact' then
      create temp table tests_sql_demandes (like public.demandes_contact including defaults including constraints);
    end if;
    execute format(
      'insert into %s (langue, prenoms, nom, email, telephone, type_evenement, message)
       values (%L, %L, %L, %L, %L, %L, %L) returning statut',
      cible, 'fr', 'Tests', 'SQL', 'tests-sql@example.invalid', '+33600000000', 'autre', 'Demande de test.')
      into obs;
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Demandes : une nouvelle demande a le statut « nouvelle »'::text,
    coalesce(err is null and obs = 'nouvelle', false),
    coalesce('erreur : ' || err,
      'statut d''une demande créée sans statut : « ' || coalesce(obs, 'vide') || ' » (attendu : nouvelle), ' || ou);

  -- ══ Droits ═════════════════════════════════════════════════════════════

  -- ── 16. est_admin() pour l'appelant ───────────────────────────────────
  -- Sous la session de Cédric : vrai. Avec la clé service_role (CI), il n'y a
  -- pas d'utilisateur : le cas n'a pas d'objet.
  if auth.uid() is null then
    return query select
      'Droits : est_admin() vrai pour l''administrateur connecté'::text,
      true,
      'non applicable (appel serveur, sans utilisateur : clé service_role)'::text;
  else
    begin
      obs := coalesce(public.est_admin()::text, 'null');
    exception when others then
      obs := 'erreur : ' || sqlerrm;
    end;
    return query select
      'Droits : est_admin() vrai pour l''administrateur connecté'::text,
      coalesce(obs = 'true', false),
      'est_admin() renvoie ' || obs || ' (attendu : true)';
  end if;

  -- ── 17. … et faux pour un autre compte ────────────────────────────────
  -- Contrôle négatif du cas 16 : un est_admin() qui dirait toujours vrai le
  -- passerait. On se fait passer pour un compte quelconque le temps du bloc
  -- (`set_config(…, true)` est annulé avec lui).
  begin
    perform set_config('request.jwt.claims', '{"sub":"' || inconnu || '","role":"authenticated"}', true);
    perform set_config('request.jwt.claim.sub', inconnu, true);
    obs := coalesce(public.est_admin()::text, 'null');
    raise exception using errcode = 'ZZ001';
  exception
    when sqlstate 'ZZ001' then err := null;
    when others then err := sqlerrm; obs := null;
  end;
  return query select
    'Droits : est_admin() faux pour un compte non inscrit'::text,
    coalesce(err is null and obs = 'false', false),
    coalesce('erreur : ' || err, 'est_admin() renvoie ' || obs || ' (attendu : false)');
end;
$fn$;

comment on function public.tests_sql() is
  'Tests des comportements SQL (contraintes, triggers, cascade, est_admin) sur la vraie base, en ecritures annulees. Appelee par /admin/tests/sql et par la CI (npm run audits:base).';

-- Comme les autres fonctions exposées : PostgREST publie tout ce qui est
-- exécutable, `anon` n'a rien à y faire (retirer à anon seul ne suffit pas :
-- il hérite du droit de PUBLIC).
revoke execute on function public.tests_sql() from public, anon;
grant execute on function public.tests_sql() to authenticated, service_role;
