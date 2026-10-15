-- Demandes reçues par le formulaire de contact du site.
--
-- Sécurité : RLS activée SANS AUCUNE POLICY → personne ne lit ni n'écrit par
-- l'API publique (clés anon / authenticated). Seul le serveur du site, avec la
-- clé service_role (qui contourne la RLS), y accède.
-- L'adresse IP n'est jamais stockée en clair : seulement son empreinte HMAC.

create table public.demandes_contact (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  langue text not null check (langue in ('fr', 'en')),
  prenoms text not null check (char_length(prenoms) between 1 and 80),
  nom text not null check (char_length(nom) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  telephone text not null check (char_length(telephone) between 8 and 16),
  type_evenement text not null check (type_evenement in ('mariage', 'prive', 'entreprise', 'autre')),
  date_evenement date,
  lieu text check (char_length(lieu) <= 150),
  invites integer check (invites between 1 and 2000),
  message text not null check (char_length(message) between 1 and 3000),

  -- Empreinte HMAC-SHA256 (hexadécimal) de l'IP, pour la limite de 5 demandes par heure.
  ip_empreinte text check (ip_empreinte ~ '^[0-9a-f]{64}$'),

  -- Trace des envois : une ligne à false = demande à reprendre à la main.
  email_envoye boolean not null default false,
  accuse_envoye boolean not null default false
);

comment on table public.demandes_contact is
  'Demandes du formulaire de contact. RLS sans policy : accès service_role uniquement.';
comment on column public.demandes_contact.ip_empreinte is
  'HMAC-SHA256 de l''IP (secret contact_secret_ip côté serveur), jamais l''IP en clair.';

-- Comptage des demandes récentes par IP (limitation).
create index demandes_contact_ip_empreinte_created_at_idx
  on public.demandes_contact (ip_empreinte, created_at);

-- Mise à jour automatique de updated_at.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger demandes_contact_touch_updated_at
  before update on public.demandes_contact
  for each row execute function public.touch_updated_at();

-- Une fonction de trigger n'a pas besoin du droit EXECUTE pour se déclencher ;
-- on le retire pour qu'elle ne soit pas appelable par /rest/v1/rpc.
-- (Retirer à anon seul ne suffit pas : anon hérite du droit de PUBLIC.)
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Deny-by-default : RLS activée, aucune policy.
alter table public.demandes_contact enable row level security;

revoke all on table public.demandes_contact from public, anon, authenticated;
