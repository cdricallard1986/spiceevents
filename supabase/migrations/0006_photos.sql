-- Photos des galeries (page Galerie et pages d'animations), gérées dans /admin/photos.
--
-- Une photo est soit un fichier du site (`origine = 'site'`, chemin `/images/…`,
-- livré avec le code), soit un fichier envoyé depuis le back office dans le
-- bucket Storage `medias` (`origine = 'stockage'`, chemin dans le bucket).
-- Lecture publique ; écriture réservée à l'administrateur.

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  origine text not null check (origine in ('site', 'stockage')),
  chemin text not null unique check (
    (origine = 'site' and chemin ~ '^/images/[a-z0-9-]+\.(jpg|jpeg|png|webp)$')
    or (origine = 'stockage' and chemin ~ '^galeries/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$')
  ),
  largeur integer not null check (largeur between 1 and 20000),
  hauteur integer not null check (hauteur between 1 and 20000),
  alt_fr text not null check (char_length(alt_fr) between 1 and 300),
  alt_en text check (char_length(alt_en) <= 300),
  credit text check (char_length(credit) <= 200)
);

comment on table public.photos is 'Photos utilisables dans les galeries du site. Lecture publique.';

create table public.galeries_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  galerie text not null check (galerie ~ '^(galerie_mariages|galerie_evenements|option:[a-z0-9-]+)$'),
  photo_id uuid not null references public.photos (id) on delete cascade,
  ordre integer not null default 0,
  unique (galerie, photo_id)
);

create index galeries_photos_galerie_ordre_idx on public.galeries_photos (galerie, ordre);
create index galeries_photos_photo_id_idx on public.galeries_photos (photo_id);

create trigger photos_touch_updated_at
  before update on public.photos
  for each row execute function public.touch_updated_at();

create trigger photos_audit
  after insert or update or delete on public.photos
  for each row execute function public.audit_trigger();

create trigger galeries_photos_audit
  after insert or update or delete on public.galeries_photos
  for each row execute function public.audit_trigger();

alter table public.photos enable row level security;
alter table public.galeries_photos enable row level security;

revoke all on table public.photos, public.galeries_photos from public, anon, authenticated;
grant select on table public.photos, public.galeries_photos to anon, authenticated;
grant insert, update, delete on table public.photos, public.galeries_photos to authenticated;

create policy photos_lecture on public.photos for select to anon, authenticated using (true);
create policy photos_ajout_admin on public.photos for insert to authenticated with check ((select public.est_admin()));
create policy photos_modification_admin on public.photos
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy photos_suppression_admin on public.photos for delete to authenticated using ((select public.est_admin()));

create policy galeries_photos_lecture on public.galeries_photos for select to anon, authenticated using (true);
create policy galeries_photos_ajout_admin on public.galeries_photos for insert to authenticated with check ((select public.est_admin()));
create policy galeries_photos_modification_admin on public.galeries_photos
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy galeries_photos_suppression_admin on public.galeries_photos for delete to authenticated using ((select public.est_admin()));

-- Bucket public `medias` : lecture par l'URL publique, sans policy de lecture sur
-- storage.objects (le contenu du bucket ne peut donc pas être listé par un visiteur).
-- Envoi direct navigateur → Storage par URL signée, créée par une Server Action admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medias', 'medias', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy medias_ajout_admin on storage.objects
  for insert to authenticated with check (bucket_id = 'medias' and (select public.est_admin()));
create policy medias_modification_admin on storage.objects
  for update to authenticated using (bucket_id = 'medias' and (select public.est_admin()))
  with check (bucket_id = 'medias' and (select public.est_admin()));
create policy medias_suppression_admin on storage.objects
  for delete to authenticated using (bucket_id = 'medias' and (select public.est_admin()));
-- L'administrateur doit pouvoir lire les lignes de ses objets (suppression, remplacement).
create policy medias_lecture_admin on storage.objects
  for select to authenticated using (bucket_id = 'medias' and (select public.est_admin()));
