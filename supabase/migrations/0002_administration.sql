-- Fondations du back office (/admin) : compte administrateur, journal d'audit,
-- limite des tentatives de connexion.
--
-- Auth « à plat » (un seul compte, celui de Cédric), avec une défense en profondeur :
-- les inscriptions sont désactivées dans Supabase ET les droits d'écriture exigent
-- une ligne dans `administrateurs`. Un compte créé par erreur n'aurait aucun droit.

-- 1. Administrateurs ---------------------------------------------------------

create table public.administrateurs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.administrateurs is
  'Comptes ayant accès au back office. RLS sans policy : lue seulement par est_admin().';

alter table public.administrateurs enable row level security;
revoke all on table public.administrateurs from public, anon, authenticated;

-- Prédicat des policies : évalué par l'utilisateur courant, il DOIT rester
-- exécutable par `authenticated` (le retirer ferait tomber toute la RLS admin).
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.administrateurs where user_id = (select auth.uid()));
$$;

revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- 2. Journal d'audit ---------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  table_nom text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  ligne_id text,
  auteur uuid,
  avant jsonb,
  apres jsonb
);

create index audit_log_table_ligne_idx on public.audit_log (table_nom, ligne_id, created_at desc);

alter table public.audit_log enable row level security;
revoke all on table public.audit_log from public, anon, authenticated;
grant select on table public.audit_log to authenticated;

create policy audit_log_lecture_admin on public.audit_log
  for select to authenticated using ((select public.est_admin()));

-- Trigger générique, attaché aux tables de contenu (avis, articles, photos…).
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ligne jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (table_nom, operation, ligne_id, auteur, avant, apres)
  values (
    tg_table_name,
    tg_op,
    ligne ->> 'id',
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- Fonction de trigger : aucun droit EXECUTE nécessaire (et pas d'appel par /rest/v1/rpc).
revoke execute on function public.audit_trigger() from public, anon, authenticated;

-- 3. Tentatives de connexion -------------------------------------------------

-- Empreintes HMAC-SHA256 (IP ou compte), jamais l'identifiant en clair.
create table public.tentatives_connexion (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('ip', 'compte')),
  empreinte text not null check (empreinte ~ '^[0-9a-f]{64}$')
);

create index tentatives_connexion_type_empreinte_created_at_idx
  on public.tentatives_connexion (type, empreinte, created_at);

comment on table public.tentatives_connexion is
  'Limite des connexions au back office. RLS sans policy : accès service_role uniquement.';

alter table public.tentatives_connexion enable row level security;
revoke all on table public.tentatives_connexion from public, anon, authenticated;
