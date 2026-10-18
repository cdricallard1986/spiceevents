-- Suivi des demandes de contact dans le back office (/admin/demandes).
--
-- Ajouts seulement (compatibles avec le code déjà en production) : un statut
-- commercial et une note interne. L'administrateur peut lire les demandes et
-- modifier ces deux colonnes, rien d'autre ; le formulaire du site continue
-- d'écrire avec la clé service_role. Le visiteur n'a toujours aucun droit.

alter table public.demandes_contact
  add column statut text not null default 'nouvelle'
    check (statut in ('nouvelle', 'rappelee', 'devis_envoye', 'signee', 'perdue')),
  add column note_interne text check (char_length(note_interne) <= 5000);

create index demandes_contact_statut_created_at_idx on public.demandes_contact (statut, created_at desc);

grant select on table public.demandes_contact to authenticated;
grant update (statut, note_interne) on table public.demandes_contact to authenticated;

create policy demandes_contact_lecture_admin on public.demandes_contact
  for select to authenticated using ((select public.est_admin()));

create policy demandes_contact_suivi_admin on public.demandes_contact
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
