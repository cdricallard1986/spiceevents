import { EQUIPE_INITIALE } from "@/contenu/equipe";
import type { MembreEquipe } from "./types";

/**
 * Migration 0012 (table `equipe` + import de l'équipe du code). Le texte est
 * produit ici et comparé au fichier par `import-sql.test.ts` : la migration
 * ne se retouche pas à la main.
 */

function chaine(v: string | null): string {
  return v === null ? "null" : `'${v.replace(/'/g, "''")}'`;
}

function tableau(v: readonly string[]): string {
  return v.length === 0 ? "'{}'::text[]" : `array[${v.map(chaine).join(", ")}]::text[]`;
}

const COLONNES: (keyof MembreEquipe)[] = [
  "id", "groupe", "nom", "alias", "role_fr", "role_en", "styles_fr", "styles_en", "accroche_fr", "accroche_en",
  "presentation_fr", "presentation_en", "avis_texte_fr", "avis_texte_en", "avis_auteur_fr", "avis_auteur_en",
  "lieux_fr", "lieux_en", "lien_url", "lien_libelle_fr", "lien_libelle_en",
  "photo_chemin", "photo_largeur", "photo_hauteur", "photo_cadrage", "publie", "ordre",
];

function valeur(v: MembreEquipe[keyof MembreEquipe]): string {
  if (Array.isArray(v)) return tableau(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return chaine(v);
}

export function sqlTableEquipe(): string {
  const lignes = EQUIPE_INITIALE.map((m) => `  (${COLONNES.map((c) => valeur(m[c])).join(", ")})`);
  return [
    "-- Fichier généré par lib/equipe/import-sql.ts (vérifié par import-sql.test.ts) : ne pas modifier à la main.",
    "--",
    "-- DJ et musiciens de la page Nos DJ, gérés dans le back office (/admin/dj).",
    "-- Lecture publique des seuls membres publiés (clé publishable) ; écriture",
    "-- réservée à l'administrateur (est_admin()). Historique dans audit_log.",
    "-- Photo : fichier du site (/images/…) ou fichier envoyé dans le bucket",
    "-- `medias`, dossier `equipe/` (policies Storage de la migration 0006).",
    "",
    "create table public.equipe (",
    "  id uuid primary key default gen_random_uuid(),",
    "  created_at timestamptz not null default now(),",
    "  updated_at timestamptz not null default now(),",
    "",
    "  groupe text not null default 'dj' check (groupe in ('dj', 'musicien')),",
    "  nom text not null check (char_length(nom) between 1 and 80),",
    "  alias text check (char_length(alias) <= 80),",
    "  role_fr text not null check (char_length(role_fr) between 1 and 80),",
    "  role_en text check (char_length(role_en) <= 80),",
    "  styles_fr text[] not null default '{}' check (cardinality(styles_fr) <= 8 and char_length(array_to_string(styles_fr, '')) <= 320),",
    "  styles_en text[] not null default '{}' check (cardinality(styles_en) <= 8 and char_length(array_to_string(styles_en, '')) <= 320),",
    "  accroche_fr text not null check (char_length(accroche_fr) between 1 and 200),",
    "  accroche_en text check (char_length(accroche_en) <= 200),",
    "  -- Paragraphes séparés par une ligne vide.",
    "  presentation_fr text not null check (char_length(presentation_fr) between 1 and 2000),",
    "  presentation_en text check (char_length(presentation_en) <= 2000),",
    "  avis_texte_fr text check (char_length(avis_texte_fr) <= 600),",
    "  avis_texte_en text check (char_length(avis_texte_en) <= 600),",
    "  avis_auteur_fr text check (char_length(avis_auteur_fr) <= 120),",
    "  avis_auteur_en text check (char_length(avis_auteur_en) <= 120),",
    "  lieux_fr text check (char_length(lieux_fr) <= 400),",
    "  lieux_en text check (char_length(lieux_en) <= 400),",
    "  lien_url text check (lien_url ~ '^https://[^\\s]+$' and char_length(lien_url) <= 500),",
    "  lien_libelle_fr text check (char_length(lien_libelle_fr) <= 60),",
    "  lien_libelle_en text check (char_length(lien_libelle_en) <= 60),",
    "",
    "  photo_chemin text check (",
    "    photo_chemin ~ '^/images/[a-z0-9-]+\\.(jpg|jpeg|png|webp)$'",
    "    or (photo_chemin ~ '^equipe/[a-z0-9/_-]+\\.(jpg|jpeg|png|webp|avif)$' and photo_chemin !~ '//')",
    "  ),",
    "  photo_largeur integer check (photo_largeur between 1 and 20000),",
    "  photo_hauteur integer check (photo_hauteur between 1 and 20000),",
    "  photo_cadrage text not null default '50% 50%' check (photo_cadrage ~ '^([0-9]{1,2}|100)% ([0-9]{1,2}|100)%$'),",
    "  constraint equipe_photo_complete check ((photo_chemin is null) = (photo_largeur is null) and (photo_chemin is null) = (photo_hauteur is null)),",
    "",
    "  publie boolean not null default false,",
    "  ordre integer not null default 0",
    ");",
    "",
    "comment on table public.equipe is 'DJ et musiciens de la page Nos DJ. Lecture publique des membres publiés.';",
    "",
    "create index equipe_publie_ordre_idx on public.equipe (publie, ordre);",
    "",
    "create trigger equipe_touch_updated_at",
    "  before update on public.equipe",
    "  for each row execute function public.touch_updated_at();",
    "",
    "create trigger equipe_audit",
    "  after insert or update or delete on public.equipe",
    "  for each row execute function public.audit_trigger();",
    "",
    "alter table public.equipe enable row level security;",
    "",
    "revoke all on table public.equipe from public, anon, authenticated;",
    "grant select on table public.equipe to anon, authenticated;",
    "grant insert, update, delete on table public.equipe to authenticated;",
    "",
    "create policy equipe_lecture_publiee on public.equipe",
    "  for select to anon, authenticated using (publie);",
    "",
    "create policy equipe_lecture_admin on public.equipe",
    "  for select to authenticated using ((select public.est_admin()));",
    "",
    "create policy equipe_ajout_admin on public.equipe",
    "  for insert to authenticated with check ((select public.est_admin()));",
    "",
    "create policy equipe_modification_admin on public.equipe",
    "  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));",
    "",
    "create policy equipe_suppression_admin on public.equipe",
    "  for delete to authenticated using ((select public.est_admin()));",
    "",
    `-- Import de l'équipe du code (contenu/equipe.ts) : ${EQUIPE_INITIALE.length} membres, publiés. Rejouable.`,
    `insert into public.equipe (${COLONNES.join(", ")}) values`,
    `${lignes.join(",\n")}`,
    "on conflict (id) do nothing;",
    "",
  ].join("\n");
}
