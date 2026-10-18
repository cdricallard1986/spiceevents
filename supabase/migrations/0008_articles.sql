-- Articles du journal, gérés dans /admin/journal (éditeur visuel).
--
-- Le contenu est le document JSON de l'éditeur (Tiptap / ProseMirror), rendu côté
-- serveur par un composant pur. Une image est soit un fichier du site (`/journal/…`,
-- livré avec le code), soit un fichier du bucket `medias` (`journal/…`).
-- Un article est créé en brouillon dès l'ouverture de l'éditeur ; il n'est
-- visible du public qu'une fois publié, et son adresse (slug) est alors figée.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  statut text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  publie_le timestamptz,

  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  titre text not null default '' check (char_length(titre) <= 200),
  sous_titre text check (char_length(sous_titre) <= 300),
  description text check (char_length(description) <= 160),
  categorie text check (categorie in ('Conseils mariage', 'Musique & ambiance', 'Technique', 'Animations', 'Mariages réalisés')),
  date_publication date,
  couverture text check (
    couverture ~ '^/journal/[a-z0-9/_.-]+\.(jpg|jpeg|png|webp)$'
    or couverture ~ '^journal/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$'
  ),
  couverture_alt text check (char_length(couverture_alt) <= 300),
  contenu jsonb not null default '{"type": "doc", "content": []}'::jsonb
    check (jsonb_typeof(contenu) = 'object' and contenu ->> 'type' = 'doc'),

  -- Un article publié est complet : ce qui s'affiche sur le site et pour Google.
  constraint articles_publie_complet check (
    statut = 'brouillon' or (
      char_length(titre) >= 1
      and char_length(description) >= 1
      and categorie is not null
      and date_publication is not null
      and couverture is not null
      and char_length(couverture_alt) >= 1
      and publie_le is not null
    )
  )
);

comment on table public.articles is 'Articles du journal. Lecture publique des articles publiés.';

create index articles_statut_date_idx on public.articles (statut, date_publication desc);

create trigger articles_touch_updated_at
  before update on public.articles
  for each row execute function public.touch_updated_at();

create trigger articles_audit
  after insert or update or delete on public.articles
  for each row execute function public.audit_trigger();

-- L'adresse d'un article déjà publié ne change plus : Google et les liens
-- externes pointent dessus (une nouvelle adresse = une redirection à prévoir).
create or replace function public.articles_slug_fige()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.publie_le is not null and new.slug is distinct from old.slug then
    raise exception 'L''adresse d''un article déjà publié ne peut plus être modifiée.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.articles_slug_fige() from public, anon, authenticated;

create trigger articles_slug_fige
  before update on public.articles
  for each row execute function public.articles_slug_fige();

alter table public.articles enable row level security;

revoke all on table public.articles from public, anon, authenticated;
grant select on table public.articles to anon, authenticated;
grant insert, update, delete on table public.articles to authenticated;

create policy articles_lecture_publies on public.articles
  for select to anon, authenticated using (statut = 'publie');
create policy articles_lecture_admin on public.articles
  for select to authenticated using ((select public.est_admin()));
create policy articles_ajout_admin on public.articles
  for insert to authenticated with check ((select public.est_admin()));
create policy articles_modification_admin on public.articles
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy articles_suppression_admin on public.articles
  for delete to authenticated using ((select public.est_admin()));
