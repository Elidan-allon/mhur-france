-- MHUR France V411 — fonctions communautaires avancées
-- À exécuter UNE FOIS dans Supabase > SQL Editor sur une base déjà installée.

-- Version du jeu, attribution des copies et date de dernière modification des builds.
alter table public.community_builds
  add column if not exists game_version text,
  add column if not exists source_build_id uuid,
  add column if not exists source_creator_id uuid,
  add column if not exists source_author text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname='community_builds_source_build_fkey') then
    alter table public.community_builds add constraint community_builds_source_build_fkey
      foreign key (source_build_id) references public.community_builds(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='community_builds_source_creator_fkey') then
    alter table public.community_builds add constraint community_builds_source_creator_fkey
      foreign key (source_creator_id) references public.profiles(id) on delete set null;
  end if;
end $$;

create or replace function public.mhur_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists mhur_builds_updated_at on public.community_builds;
create trigger mhur_builds_updated_at before update on public.community_builds
for each row execute function public.mhur_set_updated_at();

drop trigger if exists mhur_mods_updated_at on public.community_mods;
create trigger mhur_mods_updated_at before update on public.community_mods
for each row execute function public.mhur_set_updated_at();

-- Réactions simples sur les builds.
create table if not exists public.community_build_reactions (
  build_id uuid not null references public.community_builds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('useful','tested','recommended','outdated')),
  created_at timestamptz not null default now(),
  primary key (build_id,user_id,reaction)
);
create index if not exists community_build_reactions_build_idx on public.community_build_reactions(build_id,reaction);
alter table public.community_build_reactions enable row level security;
drop policy if exists "build reactions public read" on public.community_build_reactions;
create policy "build reactions public read" on public.community_build_reactions for select to anon,authenticated using (true);
drop policy if exists "build reactions owner insert" on public.community_build_reactions;
create policy "build reactions owner insert" on public.community_build_reactions for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "build reactions owner delete" on public.community_build_reactions;
create policy "build reactions owner delete" on public.community_build_reactions for delete to authenticated using (auth.uid()=user_id);
grant select on public.community_build_reactions to anon,authenticated;
grant insert,delete on public.community_build_reactions to authenticated;

-- Favoris pour les mods.
create table if not exists public.community_mod_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  mod_id uuid not null references public.community_mods(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,mod_id)
);
create index if not exists community_mod_favorites_user_idx on public.community_mod_favorites(user_id,created_at desc);
alter table public.community_mod_favorites enable row level security;
drop policy if exists "mod favorites owner read" on public.community_mod_favorites;
create policy "mod favorites owner read" on public.community_mod_favorites for select to authenticated using (auth.uid()=user_id);
drop policy if exists "mod favorites owner insert" on public.community_mod_favorites;
create policy "mod favorites owner insert" on public.community_mod_favorites for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "mod favorites owner delete" on public.community_mod_favorites;
create policy "mod favorites owner delete" on public.community_mod_favorites for delete to authenticated using (auth.uid()=user_id);
grant select,insert,delete on public.community_mod_favorites to authenticated;
revoke all on public.community_mod_favorites from anon;

-- Historique téléchargeable des anciennes versions de mods.
create table if not exists public.community_mod_versions (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references public.community_mods(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  mod_version text not null default '1.0',
  game_version text,
  description text not null default '',
  file_url text not null default '',
  file_path text not null default '',
  file_name text not null default '',
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists community_mod_versions_mod_idx on public.community_mod_versions(mod_id,created_at desc);
alter table public.community_mod_versions enable row level security;
drop policy if exists "mod versions public read" on public.community_mod_versions;
create policy "mod versions public read" on public.community_mod_versions for select to anon,authenticated
using (exists(select 1 from public.community_mods m where m.id=mod_id and m.is_hidden=false));
drop policy if exists "mod versions owner insert" on public.community_mod_versions;
create policy "mod versions owner insert" on public.community_mod_versions for insert to authenticated
with check (auth.uid()=creator_id and exists(select 1 from public.community_mods m where m.id=mod_id and m.creator_id=auth.uid()));
grant select on public.community_mod_versions to anon,authenticated;
grant insert on public.community_mod_versions to authenticated;

-- Signalements des mods.
create table if not exists public.community_mod_reports (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references public.community_mods(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('broken','stolen','inappropriate','misleading','other')),
  details text not null default '' check (char_length(details)<=700),
  status text not null default 'open' check (status in ('open','resolved','actioned','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  unique(mod_id,reporter_id)
);
create index if not exists community_mod_reports_status_idx on public.community_mod_reports(status,created_at);
alter table public.community_mod_reports enable row level security;
drop policy if exists "mod reports owner insert" on public.community_mod_reports;
create policy "mod reports owner insert" on public.community_mod_reports for insert to authenticated with check (auth.uid()=reporter_id);
drop policy if exists "mod reports owner read" on public.community_mod_reports;
create policy "mod reports owner read" on public.community_mod_reports for select to authenticated using (auth.uid()=reporter_id or public.is_mhur_moderator());
drop policy if exists "mod reports moderator update" on public.community_mod_reports;
create policy "mod reports moderator update" on public.community_mod_reports for update to authenticated using (public.is_mhur_moderator()) with check (public.is_mhur_moderator());
grant select,insert,update on public.community_mod_reports to authenticated;

-- Les créateurs conservent le droit de modifier/supprimer leurs propres créations.
grant update,delete on public.community_builds to authenticated;
grant update,delete on public.community_mods to authenticated;
