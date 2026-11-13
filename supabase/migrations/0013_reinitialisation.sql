-- Mot de passe oublié (/admin/connexion/oubli) : les liens de réinitialisation
-- réellement envoyés sont comptés par compte, à part des échecs de connexion
-- (sinon quelqu'un qui ne connaît que l'email de Cédric pourrait bloquer sa
-- connexion en demandant des liens). Même table, même règle : empreinte HMAC,
-- RLS sans policy (service_role seulement). Ajout seulement : compatible avec
-- le code déjà en production.

alter table public.tentatives_connexion drop constraint if exists tentatives_connexion_type_check;
alter table public.tentatives_connexion add constraint tentatives_connexion_type_check
  check (type in ('ip', 'compte', 'reinitialisation'));
