-- Fichier généré par lib/equipe/import-sql.ts (vérifié par import-sql.test.ts) : ne pas modifier à la main.
--
-- DJ et musiciens de la page Nos DJ, gérés dans le back office (/admin/dj).
-- Lecture publique des seuls membres publiés (clé publishable) ; écriture
-- réservée à l'administrateur (est_admin()). Historique dans audit_log.
-- Photo : fichier du site (/images/…) ou fichier envoyé dans le bucket
-- `medias`, dossier `equipe/` (policies Storage de la migration 0006).

create table public.equipe (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  groupe text not null default 'dj' check (groupe in ('dj', 'musicien')),
  nom text not null check (char_length(nom) between 1 and 80),
  alias text check (char_length(alias) <= 80),
  role_fr text not null check (char_length(role_fr) between 1 and 80),
  role_en text check (char_length(role_en) <= 80),
  styles_fr text[] not null default '{}' check (cardinality(styles_fr) <= 8 and char_length(array_to_string(styles_fr, '')) <= 320),
  styles_en text[] not null default '{}' check (cardinality(styles_en) <= 8 and char_length(array_to_string(styles_en, '')) <= 320),
  accroche_fr text not null check (char_length(accroche_fr) between 1 and 200),
  accroche_en text check (char_length(accroche_en) <= 200),
  -- Paragraphes séparés par une ligne vide.
  presentation_fr text not null check (char_length(presentation_fr) between 1 and 2000),
  presentation_en text check (char_length(presentation_en) <= 2000),
  avis_texte_fr text check (char_length(avis_texte_fr) <= 600),
  avis_texte_en text check (char_length(avis_texte_en) <= 600),
  avis_auteur_fr text check (char_length(avis_auteur_fr) <= 120),
  avis_auteur_en text check (char_length(avis_auteur_en) <= 120),
  lieux_fr text check (char_length(lieux_fr) <= 400),
  lieux_en text check (char_length(lieux_en) <= 400),
  lien_url text check (lien_url ~ '^https://[^\s]+$' and char_length(lien_url) <= 500),
  lien_libelle_fr text check (char_length(lien_libelle_fr) <= 60),
  lien_libelle_en text check (char_length(lien_libelle_en) <= 60),

  photo_chemin text check (
    photo_chemin ~ '^/images/[a-z0-9-]+\.(jpg|jpeg|png|webp)$'
    or (photo_chemin ~ '^equipe/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$' and photo_chemin !~ '//')
  ),
  photo_largeur integer check (photo_largeur between 1 and 20000),
  photo_hauteur integer check (photo_hauteur between 1 and 20000),
  photo_cadrage text not null default '50% 50%' check (photo_cadrage ~ '^([0-9]{1,2}|100)% ([0-9]{1,2}|100)%$'),
  constraint equipe_photo_complete check ((photo_chemin is null) = (photo_largeur is null) and (photo_chemin is null) = (photo_hauteur is null)),

  publie boolean not null default false,
  ordre integer not null default 0
);

comment on table public.equipe is 'DJ et musiciens de la page Nos DJ. Lecture publique des membres publiés.';

create index equipe_publie_ordre_idx on public.equipe (publie, ordre);

create trigger equipe_touch_updated_at
  before update on public.equipe
  for each row execute function public.touch_updated_at();

create trigger equipe_audit
  after insert or update or delete on public.equipe
  for each row execute function public.audit_trigger();

alter table public.equipe enable row level security;

revoke all on table public.equipe from public, anon, authenticated;
grant select on table public.equipe to anon, authenticated;
grant insert, update, delete on table public.equipe to authenticated;

create policy equipe_lecture_publiee on public.equipe
  for select to anon, authenticated using (publie);

create policy equipe_lecture_admin on public.equipe
  for select to authenticated using ((select public.est_admin()));

create policy equipe_ajout_admin on public.equipe
  for insert to authenticated with check ((select public.est_admin()));

create policy equipe_modification_admin on public.equipe
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));

create policy equipe_suppression_admin on public.equipe
  for delete to authenticated using ((select public.est_admin()));

-- Import de l'équipe du code (contenu/equipe.ts) : 6 membres, publiés. Rejouable.
insert into public.equipe (id, groupe, nom, alias, role_fr, role_en, styles_fr, styles_en, accroche_fr, accroche_en, presentation_fr, presentation_en, avis_texte_fr, avis_texte_en, avis_auteur_fr, avis_auteur_en, lieux_fr, lieux_en, lien_url, lien_libelle_fr, lien_libelle_en, photo_chemin, photo_largeur, photo_hauteur, photo_cadrage, publie, ordre) values
  ('6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e01', 'dj', 'Antoine D.', null, 'DJ', null, array['Mariages', 'Mariages internationaux']::text[], array['Weddings', 'International weddings']::text[], 'Le dernier arrivé, déjà salué par les mariés.', 'The newest member, already praised by couples.', 'Antoine a rejoint l''équipe pour la saison 2026. Il a déjà fait danser des mariages venus de l''étranger, en orchestrant aussi les discours du dîner.', 'Antoine joined the team for the 2026 season. He has already got couples from abroad dancing, and hosted the dinner speeches too.', 'DJ Antoine a été excellent ; il a joué toutes les chansons que nous avons demandées et a aidé à officier les discours pendant le dîner.', 'DJ Antoine was excellent; he played all the songs we requested and helped officiate the speeches during the dinner.', 'Roman, mariage de juillet 2026', 'Roman, July 2026 wedding', null, null, null, null, null, null, null, null, '50% 50%', true, 10),
  ('6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e02', 'dj', 'Kevin R.', null, 'DJ', null, array['Électro', 'Funk', 'French Touch']::text[], array['Electro', 'Funk', 'French Touch']::text[], 'Né en 1992, il baigne dans la musique depuis toujours.', 'Born in 1992, he has grown up surrounded by music.', 'Il découvre le DJing à 13 ans et bricole ses premiers mix dans sa chambre. La French Touch et ses voyages lui donnent son univers : électro et funk, avec quelques percussions à l''esprit tribal.

Repéré pour son charisme et l''originalité de ses mix, il joue dans les plus grands clubs parisiens et des lieux reconnus, du Rex Club au Palace. En 2019, il fait partie du jury du Lab Festival Paris, dédié à la nouvelle scène DJ parisienne.', 'He discovered DJing at 13 and made his first mixes in his bedroom. French Touch and his travels shaped his sound: electro and funk, with a touch of tribal percussion.

Noticed for his charisma and original mixes, he has played the biggest Paris clubs and renowned venues, from the Rex Club to Le Palace. In 2019 he sat on the jury of the Lab Festival Paris, devoted to the new Paris DJ scene.', null, null, null, null, 'Amante (Ibiza), Rex Club, La Machine du Moulin Rouge, InterContinental Paris Le Grand, The Westin, Pavillon Cambon Capucines, Tour Montparnasse, Musée Rodin', null, 'https://www.mixcloud.com/kevin-ramboatiana/', 'Sa page Mixcloud', 'His Mixcloud page', '/images/dj-kevin-r.jpg', 1244, 1244, '50% 8%', true, 20),
  ('6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e03', 'dj', 'DJ Pan''s', 'Aurélien', 'DJ, avec guitariste', 'DJ, with guitarist', array['Rock', 'Pop', 'New wave', 'Rockabilly']::text[], array['Rock', 'Pop', 'New wave', 'Rockabilly']::text[], 'Let''s rock !', 'Let''s rock!', 'Du rockabilly à l''électro-rock, en passant par la pop, la new wave et le surf : aucune branche du rock ne manque à sa playlist.

Major de sa promotion à l''école des Deejays de l''UCPA, rodé par des centaines de clubs en France et à l''étranger, et passé par la radio, il propose un vrai show pop-rock accompagné d''un guitariste : nouveautés et classiques, pépites et raretés, entrecoupés de riffs ravageurs.', 'From rockabilly to electro-rock, by way of pop, new wave and surf: no branch of rock is missing from his playlist.

Top of his class at the UCPA DJ school, seasoned by hundreds of clubs in France and abroad and by radio work, he offers a real pop-rock show with a live guitarist: new releases and classics, gems and rarities, cut with blistering riffs.', 'Aurélien nous a fait danser toute la nuit en s''adaptant à nos goûts. Il a été extrêmement gentil et arrangeant !', 'Aurélien kept us dancing all night, adapting to our tastes. He was extremely kind and accommodating!', 'Juliette, mariage de septembre 2022', 'Juliette, September 2022 wedding', null, null, 'https://www.facebook.com/djpans', 'Sa page Facebook', 'His Facebook page', '/images/dj-pans.jpg', 1200, 1800, '50% 30%', true, 30),
  ('6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e04', 'dj', 'David G.', null, 'DJ', null, array['House', 'Deep house', 'Mariages']::text[], array['House', 'Deep house', 'Weddings']::text[], 'Depuis ses 15 ans, David vous fait danser.', 'David has been getting people dancing since he was 15.', 'Il commence par les soirées de son entourage, puis mixe dès 18 ans dans des discothèques parisiennes comme le Duplex ou le Mix Club, avant de se consacrer aux mariages.

Ses mariages l''ont mené aux quatre coins de la France, du bassin parisien à la Bretagne, et jusque sur des îles comme l''île d''Yeu ou le Frioul. Sa motivation : partager sa passion et mettre le feu jusqu''au bout de la nuit.', 'He started with parties for friends and family, then played Paris clubs such as Le Duplex and the Mix Club from the age of 18, before focusing on weddings.

Weddings have taken him all over France, from Paris to Brittany and out to islands such as Île d''Yeu and Frioul. What drives him: sharing his passion and keeping the party going until dawn.', null, null, null, null, null, null, null, null, null, '/images/dj-david-g.jpg', 1800, 1350, '55% 30%', true, 40),
  ('6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e05', 'dj', 'Lucas M.', null, 'DJ et musicien', 'DJ and musician', array['Funk', 'Rock', 'Disco', 'Actuel']::text[], array['Funk', 'Rock', 'Disco', 'Current hits']::text[], 'De la technique à la magie.', 'From technique to magic.', 'Émerveillé depuis toujours par l''événementiel, Lucas mixe depuis plus de 10 ans dans des soirées privées avant de se tourner vers les mariages.

Musicien de la première heure, il mêle les ambiances, du funk au rock en passant par le disco et les musiques actuelles, pour garder la piste pleine jusqu''au petit matin.', 'Always fascinated by events, Lucas has been DJing private parties for more than 10 years before turning to weddings.

A musician through and through, he blends moods, from funk to rock by way of disco and current hits, to keep the dance floor full until the small hours.', null, null, null, null, null, null, null, null, null, '/images/dj-lucas-m.jpg', 484, 600, '50% 22%', true, 50),
  ('6c0f3a52-1d4e-4b8a-9f21-0a1b2c3d4e06', 'musicien', 'Angel', null, 'Saxophoniste', 'Saxophonist', array['Vin d''honneur', 'Soirée']::text[], array['Drinks reception', 'Party']::text[], 'Le live qui fait lever les invités.', 'The live touch that gets guests on their feet.', 'Angel accompagne le DJ au saxophone, pour un cocktail élégant ou une soirée qui monte encore d''un cran.', 'Angel plays saxophone alongside the DJ, for an elegant drinks reception or a party that goes up another notch.', 'Cédric et Angel ont été fantastiques et ont rendu l''après-midi et la soirée inoubliables pour le mariage.', 'Cedric and Angel were fantastic and made the afternoon and evening a wedding to remember.', 'Lucy, mariage de juillet 2026', 'Lucy, July 2026 wedding', null, null, null, null, null, null, null, null, '50% 50%', true, 60)
on conflict (id) do nothing;
