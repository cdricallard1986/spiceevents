-- Avis des clients, gérés depuis le back office (/admin/avis).
--
-- Lecture publique des seuls avis publiés (clé publishable) ; écriture réservée
-- à l'administrateur (est_admin()). Historique dans audit_log.

create table public.avis (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  auteurs text not null check (char_length(auteurs) between 1 and 120),
  role_fr text check (char_length(role_fr) <= 120),
  role_en text check (char_length(role_en) <= 120),
  categorie text not null check (categorie in ('mariage', 'evenement')),
  texte_fr text not null check (char_length(texte_fr) between 1 and 5000),
  -- Sans traduction, la version anglaise du site affiche le texte français.
  texte_en text check (char_length(texte_en) <= 5000),
  -- Extrait mis en avant (grands avis, grilles) ; à défaut, le début du texte.
  citation_fr text check (char_length(citation_fr) <= 600),
  citation_en text check (char_length(citation_en) <= 600),

  source text not null default 'site' check (source in ('site', 'mariages_net', 'google', 'autre')),
  date_avis date,
  lien_source text check (lien_source ~ '^https://[^\s]+$' and char_length(lien_source) <= 500),

  publie boolean not null default false,
  ordre integer not null default 0,
  -- Pages où l'avis apparaît : accueil_grand, accueil, mariages_grand, mariages, option:<slug>.
  emplacements text[] not null default '{}' check (
    array_to_string(emplacements, ',') ~ '^((accueil_grand|accueil|mariages_grand|mariages|option:[a-z0-9-]+)(,|$))*$'
  )
);

comment on table public.avis is 'Avis clients affichés sur le site. Lecture publique des avis publiés.';

create index avis_publie_ordre_idx on public.avis (publie, ordre);

create trigger avis_touch_updated_at
  before update on public.avis
  for each row execute function public.touch_updated_at();

create trigger avis_audit
  after insert or update or delete on public.avis
  for each row execute function public.audit_trigger();

alter table public.avis enable row level security;

revoke all on table public.avis from public, anon, authenticated;
grant select on table public.avis to anon, authenticated;
grant insert, update, delete on table public.avis to authenticated;

create policy avis_lecture_publiee on public.avis
  for select to anon, authenticated using (publie);

create policy avis_lecture_admin on public.avis
  for select to authenticated using ((select public.est_admin()));

create policy avis_ajout_admin on public.avis
  for insert to authenticated with check ((select public.est_admin()));

create policy avis_modification_admin on public.avis
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));

create policy avis_suppression_admin on public.avis
  for delete to authenticated using ((select public.est_admin()));
