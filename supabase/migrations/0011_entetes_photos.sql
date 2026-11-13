-- Fichier généré par outils/generer_import_galeries.mjs (lib/photos/import-sql.ts) : ne pas modifier à la main.
--
-- Diaporamas d'en-tête des pages (Accueil, Mariages, Événements, Son & lumière) :
-- une photo tirée au hasard à chaque visite. Ils deviennent des emplacements
-- `entete:<page>` de `galeries_photos`, choisis depuis la fiche de chaque photo
-- dans le back office. Import des listes du code, dans leur ordre (10, 20, 30…),
-- avec les identifiants fixes des données de secours (lib/photos/repli.ts).
-- Rejouable : une ligne déjà présente est ignorée.
-- 28 photos (dont certaines déjà importées par 0007), 38 liaisons.

alter table public.galeries_photos drop constraint if exists galeries_photos_galerie_check;
alter table public.galeries_photos add constraint galeries_photos_galerie_check
  check (galerie ~ '^(galerie_mariages|galerie_evenements|option:[a-z0-9-]+|entete:[a-z0-9-]+)$');

insert into public.photos (id, origine, chemin, largeur, hauteur, alt_fr, alt_en) values
  ('68b67169-8b12-5fc1-8b49-02ed36d43a69', 'site', '/images/hero-premiere-danse.jpg', 2400, 1600, 'Première danse des mariés dans la fumée lourde, sous les projecteurs', 'The couple''s first dance in low fog under stage lights'),
  ('f2ae2377-ea03-59ca-b6ce-e652e23eef44', 'site', '/images/presta-mariage-hero.jpg', 2400, 1800, 'Première danse des mariés sous des projections lumineuses roses, entourés de leurs invités', 'The couple''s first dance under pink light projections, surrounded by their guests'),
  ('11abb2ef-09db-5466-bb1d-ca95a126aec4', 'site', '/images/mariage-soiree-faisceaux.jpg', 2400, 1600, 'Faisceaux de lumière blanche au-dessus des invités qui dansent', 'Beams of white light above dancing guests'),
  ('df7b03f9-d6a5-561b-b5c5-fa0ca0decb50', 'site', '/images/mariage-soiree-piste-rose.jpg', 2400, 1600, 'Piste de danse baignée de fumée et de lumière rose et violette', 'A dance floor bathed in haze and pink and purple light'),
  ('69618ba3-239b-51f4-9202-a960bfe2697a', 'site', '/images/maison-mariage-lasers.jpg', 2400, 1597, 'Invités qui dansent sous des lasers roses et bleus', 'Guests dancing under pink and blue lasers'),
  ('ab928d62-03d1-5ded-8af0-6ebae9ad8c02', 'site', '/images/mariage-soiree-scene-dj.jpg', 2048, 1363, 'Piste de danse pleine devant la scène du DJ, entre deux colonnes d''enceintes', 'A packed dance floor in front of the DJ stage, between two speaker stacks'),
  ('d5df8ce8-e424-5e75-b475-0c00f7a0c661', 'site', '/images/maison-evenement-scene-dj.jpg', 2048, 1363, 'DJ sur une scène en structure, entouré du public', 'DJ on a truss stage, surrounded by the crowd'),
  ('0d8b4285-2bde-56ba-adf3-8cfab9820a6b', 'site', '/images/presta-soiree-privee.jpg', 1600, 1200, 'Soirée privée : invités qui dansent autour du DJ', 'Private party: guests dancing around the DJ'),
  ('9cb78b64-6389-5fa1-80a4-d940d9d75fdb', 'site', '/images/presta-gala-salle.jpg', 2048, 1365, 'Dîner de gala dans une salle historique éclairée en rose et violet', 'Gala dinner in a historic hall lit in pink and purple'),
  ('2d72bb9e-0e63-5e94-ad5e-9afda0bbc2fe', 'site', '/images/presta-piste-laser.jpg', 2400, 1597, 'Piste de danse traversée de faisceaux lumineux', 'Dance floor criss-crossed by light beams'),
  ('c8ee5f61-cb44-588a-8a04-9d7da98cfeaf', 'site', '/images/soiree-piste-fumee.jpg', 1800, 1200, 'Piste de danse pleine, dans la brume traversée de lumière bleue et violette', 'A packed dance floor in haze lit with blue and purple beams'),
  ('f2139dd4-a3e3-5a56-a03a-67f0f469365c', 'site', '/images/soiree-piste-costumes.jpg', 1800, 1200, 'Invités en costume et lunettes de soleil qui dansent dans la lumière bleue', 'Guests in suits and sunglasses dancing in blue light'),
  ('442909e2-3670-5bed-bcf9-3f74f7a8723f', 'site', '/images/maison-mariage-danse-genou.jpg', 2400, 1800, 'Première danse des mariés sous des projections lumineuses bleues, entourés des invités', 'The couple''s first dance under blue light projections, surrounded by guests'),
  ('a1c730bf-cb05-53a5-88a9-90293efac535', 'site', '/images/contact-maries-lumiere.jpg', 2400, 1602, 'Mariés enlacés sur la piste, entre deux colonnes de lumière', 'Newlyweds embracing on the dance floor between two columns of light'),
  ('7093bc78-77b3-5735-87ca-d9e7ec62b687', 'site', '/images/presta-bal-fumee-bleue.jpg', 2400, 1600, 'Mariés qui ouvrent le bal dans la fumée, sous une lumière bleue', 'Newlyweds opening the dance in haze under blue light'),
  ('baaffe7e-b8ca-539d-aa16-5a2a85cab024', 'site', '/images/mariage-accueil-fumee.jpg', 1623, 1080, 'Ouverture de bal dans la fumée lourde, sous une lumière rose', 'A first dance in low fog under pink light'),
  ('bc2b90a2-75f5-5e72-b3c3-acb1d92b255a', 'site', '/images/presta-bal-etincelles-salle.jpg', 1920, 1080, 'Marié qui fait tournoyer la mariée dans la fumée lourde, entourés d''étincelles froides', 'The groom twirling the bride in low fog, surrounded by cold sparks'),
  ('c9ba60d5-013b-5ef0-9b73-152e76a45e79', 'site', '/images/piste-invites.jpg', 2048, 1363, 'Invités qui dansent sous les lumières', 'Guests dancing under the lights'),
  ('88bcf888-7120-5234-8513-42d21a62158d', 'site', '/images/maison-mariage-diner-violet.jpg', 2400, 1800, 'Dîner de mariage sous un éclairage violet et des motifs lumineux', 'Wedding dinner under purple lighting and light patterns'),
  ('9b72350c-9b2e-5183-8d67-f46d96b44779', 'site', '/images/mariage-soiree-fumee-rouge.jpg', 2400, 1800, 'Invités qui dansent dans des jets de fumée éclairés en rouge', 'Guests dancing amid jets of red-lit haze'),
  ('444d0e03-0b3f-5fc6-a29c-d0c88ba34a11', 'site', '/images/mariage-soiree-regie.jpg', 2048, 1363, 'DJ à la régie sous une structure de lumières, invités qui dansent en bleu', 'The DJ at the booth under a lighting truss, guests dancing in blue light'),
  ('0d15b562-638c-57b2-9f92-bca39a21c1db', 'site', '/images/mariage-soiree-cabine.jpg', 2400, 1350, 'Cabine du DJ dans la fumée, rayons verts et lumière rose', 'The DJ booth in haze, with green beams and pink light'),
  ('0177975d-40c6-5e3b-a1ca-d84c4e255d20', 'site', '/images/mariage-soiree-chapiteau-bleu.jpg', 2400, 1800, 'Soirée sous un chapiteau mis en lumière bleue, motifs projetés au plafond', 'A party in a marquee lit in blue, with patterns projected on the ceiling'),
  ('7cb5ec27-550d-5481-a755-4f551383768e', 'site', '/images/mariage-soiree-bras-ouverts.jpg', 1800, 1200, 'Le marié, bras ouverts, mène la danse sous les faisceaux bleus', 'The groom leads the dance, arms wide, under blue light beams'),
  ('e6066e8e-f065-535f-b6f4-d8d3033beaa3', 'site', '/images/mariage-soiree-bras-leves.jpg', 1800, 1200, 'Invités bras levés sur la piste, dans la brume et la lumière bleue', 'Guests with their arms up on the dance floor, in haze and blue light'),
  ('26be420a-4376-5d89-b736-0aa1bb532f27', 'site', '/images/mariage-premiere-danse-bleue.jpg', 1800, 1200, 'Baiser des mariés pendant la première danse, sous les projecteurs bleus', 'The couple kiss during their first dance, under blue spotlights'),
  ('272572d8-a4e2-5aff-81a1-77d14020ab28', 'site', '/images/son-lumiere-installation.jpg', 2400, 1800, 'Piste de danse et structures éclairées en violet, installation prête avant l''arrivée des invités', 'Dance floor and trusses lit in purple, set up and ready before the guests arrive'),
  ('32e590ae-8653-51da-9ca9-adaa271118eb', 'site', '/images/son-lumiere-regie-lets-dance.jpg', 1800, 1200, 'Régie DJ, enceintes sur pied et jeux de lumière installés dans une salle bleutée', 'DJ booth, speakers on stands and lighting rigs set up in a blue-lit room')
on conflict do nothing;

insert into public.galeries_photos (galerie, photo_id, ordre) values
  ('entete:accueil', '68b67169-8b12-5fc1-8b49-02ed36d43a69', 10),
  ('entete:accueil', 'f2ae2377-ea03-59ca-b6ce-e652e23eef44', 20),
  ('entete:accueil', '11abb2ef-09db-5466-bb1d-ca95a126aec4', 30),
  ('entete:accueil', 'df7b03f9-d6a5-561b-b5c5-fa0ca0decb50', 40),
  ('entete:accueil', '69618ba3-239b-51f4-9202-a960bfe2697a', 50),
  ('entete:accueil', 'ab928d62-03d1-5ded-8af0-6ebae9ad8c02', 60),
  ('entete:accueil', 'd5df8ce8-e424-5e75-b475-0c00f7a0c661', 70),
  ('entete:accueil', '0d8b4285-2bde-56ba-adf3-8cfab9820a6b', 80),
  ('entete:accueil', '9cb78b64-6389-5fa1-80a4-d940d9d75fdb', 90),
  ('entete:accueil', '2d72bb9e-0e63-5e94-ad5e-9afda0bbc2fe', 100),
  ('entete:accueil', 'c8ee5f61-cb44-588a-8a04-9d7da98cfeaf', 110),
  ('entete:accueil', 'f2139dd4-a3e3-5a56-a03a-67f0f469365c', 120),
  ('entete:mariages', 'f2ae2377-ea03-59ca-b6ce-e652e23eef44', 10),
  ('entete:mariages', '442909e2-3670-5bed-bcf9-3f74f7a8723f', 20),
  ('entete:mariages', 'a1c730bf-cb05-53a5-88a9-90293efac535', 30),
  ('entete:mariages', '68b67169-8b12-5fc1-8b49-02ed36d43a69', 40),
  ('entete:mariages', '7093bc78-77b3-5735-87ca-d9e7ec62b687', 50),
  ('entete:mariages', 'baaffe7e-b8ca-539d-aa16-5a2a85cab024', 60),
  ('entete:mariages', 'bc2b90a2-75f5-5e72-b3c3-acb1d92b255a', 70),
  ('entete:mariages', 'c9ba60d5-013b-5ef0-9b73-152e76a45e79', 80),
  ('entete:mariages', 'd5df8ce8-e424-5e75-b475-0c00f7a0c661', 90),
  ('entete:mariages', '0d8b4285-2bde-56ba-adf3-8cfab9820a6b', 100),
  ('entete:mariages', '2d72bb9e-0e63-5e94-ad5e-9afda0bbc2fe', 110),
  ('entete:mariages', '88bcf888-7120-5234-8513-42d21a62158d', 120),
  ('entete:mariages', '69618ba3-239b-51f4-9202-a960bfe2697a', 130),
  ('entete:mariages', '9b72350c-9b2e-5183-8d67-f46d96b44779', 140),
  ('entete:mariages', 'ab928d62-03d1-5ded-8af0-6ebae9ad8c02', 150),
  ('entete:mariages', '444d0e03-0b3f-5fc6-a29c-d0c88ba34a11', 160),
  ('entete:mariages', 'df7b03f9-d6a5-561b-b5c5-fa0ca0decb50', 170),
  ('entete:mariages', '0d15b562-638c-57b2-9f92-bca39a21c1db', 180),
  ('entete:mariages', '0177975d-40c6-5e3b-a1ca-d84c4e255d20', 190),
  ('entete:mariages', '11abb2ef-09db-5466-bb1d-ca95a126aec4', 200),
  ('entete:mariages', '7cb5ec27-550d-5481-a755-4f551383768e', 210),
  ('entete:mariages', 'e6066e8e-f065-535f-b6f4-d8d3033beaa3', 220),
  ('entete:mariages', '26be420a-4376-5d89-b736-0aa1bb532f27', 230),
  ('entete:evenementiel', '9cb78b64-6389-5fa1-80a4-d940d9d75fdb', 10),
  ('entete:son-et-lumiere', '272572d8-a4e2-5aff-81a1-77d14020ab28', 10),
  ('entete:son-et-lumiere', '32e590ae-8653-51da-9ca9-adaa271118eb', 20)
on conflict (galerie, photo_id) do nothing;
