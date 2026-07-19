-- MHUR France V393 — INSTALLATION SUPABASE PROPRE (projet neuf)
-- Colle ce fichier ENTIER dans Supabase > SQL Editor > New query, puis Run.
-- Ne l'utilise pas pour supprimer un ancien projet contenant des données.

-- MHUR France — installation complète Supabase
-- Exécuter ce fichier une seule fois dans SQL Editor sur un projet neuf.

-- ============================================================
-- COMMUNAUTE_SUPABASE.sql
-- ============================================================

-- MHUR France — Builds communautaires V304
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- N'utilise jamais la clé service_role dans le site.

create extension if not exists pgcrypto;

create table if not exists public.community_builds (
  id uuid primary key default gen_random_uuid(),
  character_id text not null check (char_length(character_id) between 1 and 60),
  style_id text not null check (char_length(style_id) between 1 and 80),
  costume_id text not null check (char_length(costume_id) between 1 and 160),
  costume_name text not null check (char_length(costume_name) between 1 and 160),
  costume_variant text not null check (char_length(costume_variant) between 1 and 120),
  costume_img text not null default '',
  title text not null check (char_length(title) between 3 and 80),
  author text not null check (char_length(author) between 2 and 40),
  description text not null default '' check (char_length(description) <= 700),
  tuning_slots jsonb not null
    check (jsonb_typeof(tuning_slots) = 'array' and jsonb_array_length(tuning_slots) = 12),
  creator_id uuid not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_build_likes (
  build_id uuid not null references public.community_builds(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (build_id, voter_id)
);

create index if not exists community_builds_ranking_idx
  on public.community_builds(character_id, style_id, likes_count desc, created_at desc);

alter table public.community_builds enable row level security;
alter table public.community_build_likes enable row level security;

drop policy if exists "Public can read visible builds" on public.community_builds;
create policy "Public can read visible builds"
on public.community_builds
for select
to anon, authenticated
using (is_hidden = false);

drop policy if exists "Public can publish valid builds" on public.community_builds;
create policy "Public can publish valid builds"
on public.community_builds
for insert
to anon, authenticated
with check (
  is_hidden = false
  and likes_count = 0
  and char_length(title) between 3 and 80
  and char_length(author) between 2 and 40
  and char_length(description) <= 700
  and jsonb_typeof(tuning_slots) = 'array'
  and jsonb_array_length(tuning_slots) = 12
);

grant select, insert on public.community_builds to anon, authenticated;
revoke update, delete on public.community_builds from anon, authenticated;
revoke all on public.community_build_likes from anon, authenticated;

create or replace function public.toggle_community_build_like(
  p_build_id uuid,
  p_voter_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_liked boolean;
begin
  perform 1
  from public.community_builds
  where id = p_build_id and is_hidden = false
  for update;

  if not found then
    raise exception 'Build introuvable';
  end if;

  if exists (
    select 1
    from public.community_build_likes
    where build_id = p_build_id and voter_id = p_voter_id
  ) then
    delete from public.community_build_likes
    where build_id = p_build_id and voter_id = p_voter_id;

    update public.community_builds
    set likes_count = greatest(likes_count - 1, 0)
    where id = p_build_id
    returning likes_count into v_count;

    v_liked := false;
  else
    insert into public.community_build_likes(build_id, voter_id)
    values (p_build_id, p_voter_id);

    update public.community_builds
    set likes_count = likes_count + 1
    where id = p_build_id
    returning likes_count into v_count;

    v_liked := true;
  end if;

  return jsonb_build_object(
    'liked', v_liked,
    'likes_count', v_count
  );
end;
$$;

revoke all on function public.toggle_community_build_like(uuid, uuid) from public;
grant execute on function public.toggle_community_build_like(uuid, uuid) to anon, authenticated;

-- ============================================================
-- PHASE_1_COMPTES_SUPABASE.sql
-- ============================================================

-- MHUR France V323 — Phase 1 : comptes Google / Discord
-- À lancer dans Supabase > SQL Editor APRÈS COMMUNAUTE_SUPABASE.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 1 and 40),
  avatar_url text not null default '',
  provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "Users create their profile" on public.profiles;
create policy "Users create their profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- Les nouveaux builds doivent appartenir au compte connecté.
drop policy if exists "Public can publish valid builds" on public.community_builds;
drop policy if exists "Authenticated users publish their builds" on public.community_builds;
create policy "Authenticated users publish their builds"
on public.community_builds
for insert
to authenticated
with check (
  auth.uid() = creator_id
  and is_hidden = false
  and likes_count = 0
  and char_length(title) between 3 and 80
  and char_length(author) between 1 and 40
  and char_length(description) <= 700
  and jsonb_typeof(tuning_slots) = 'array'
  and jsonb_array_length(tuning_slots) = 12
);

revoke insert on public.community_builds from anon;
grant insert on public.community_builds to authenticated;

-- Un cœur par compte connecté. Le paramètre voter_id est ignoré et remplacé par auth.uid().
drop function if exists public.toggle_community_build_like(uuid, uuid);

create or replace function public.toggle_community_build_like(
  p_build_id uuid,
  p_voter_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
  v_liked boolean;
begin
  if v_user is null then
    raise exception 'Connexion requise';
  end if;

  perform 1 from public.community_builds
  where id = p_build_id and is_hidden = false;
  if not found then raise exception 'Build introuvable'; end if;

  if exists (
    select 1 from public.community_build_likes
    where build_id = p_build_id and voter_id = v_user
  ) then
    delete from public.community_build_likes
    where build_id = p_build_id and voter_id = v_user;
    v_liked := false;
  else
    insert into public.community_build_likes(build_id, voter_id)
    values (p_build_id, v_user);
    v_liked := true;
  end if;

  select count(*)::integer into v_count
  from public.community_build_likes where build_id = p_build_id;

  update public.community_builds
  set likes_count = v_count where id = p_build_id;

  return jsonb_build_object('liked', v_liked, 'likes_count', v_count);
end;
$$;

grant execute on function public.toggle_community_build_like(uuid,uuid) to authenticated;
revoke execute on function public.toggle_community_build_like(uuid,uuid) from anon;

-- ============================================================
-- PHASE_2_PROFILS_FAVORIS_SUPABASE.sql
-- ============================================================

-- MHUR France V324 — Phase 2 : profils publics et favoris
-- À exécuter APRÈS PHASE_1_COMPTES_SUPABASE.sql.

-- Relation permettant de récupérer le profil de l'auteur avec chaque build.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'community_builds_creator_profile_fkey'
  ) then
    alter table public.community_builds
      add constraint community_builds_creator_profile_fkey
      foreign key (creator_id) references public.profiles(id)
      on delete cascade not valid;
  end if;
end $$;

create table if not exists public.community_build_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  build_id uuid not null references public.community_builds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, build_id)
);

create index if not exists community_build_favorites_user_idx
  on public.community_build_favorites(user_id, created_at desc);

alter table public.community_build_favorites enable row level security;

drop policy if exists "Users read their favorites" on public.community_build_favorites;
create policy "Users read their favorites"
on public.community_build_favorites for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users add their favorites" on public.community_build_favorites;
create policy "Users add their favorites"
on public.community_build_favorites for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users remove their favorites" on public.community_build_favorites;
create policy "Users remove their favorites"
on public.community_build_favorites for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, delete on public.community_build_favorites to authenticated;
revoke all on public.community_build_favorites from anon;

-- Les auteurs peuvent mettre à jour ou supprimer uniquement leurs propres builds.
drop policy if exists "Authors update their builds" on public.community_builds;
create policy "Authors update their builds"
on public.community_builds for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

drop policy if exists "Authors delete their builds" on public.community_builds;
create policy "Authors delete their builds"
on public.community_builds for delete
to authenticated
using (auth.uid() = creator_id);

grant update, delete on public.community_builds to authenticated;

-- ============================================================
-- PHASE_3_MODERATION_SUPABASE.sql
-- ============================================================

-- MHUR France V325 — Phase 3 : signalements, modération et builds vérifiés
-- À exécuter APRÈS les scripts des phases 1 et 2.

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user','moderator','admin'));

alter table public.community_builds
  add column if not exists is_verified boolean not null default false;

create table if not exists public.community_build_reports (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.community_builds(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam','inappropriate','misleading','harassment','other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed','actioned')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  unique (build_id, reporter_id)
);

create index if not exists community_build_reports_status_idx
  on public.community_build_reports(status, created_at);

create or replace function public.is_mhur_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator','admin')
  );
$$;

grant execute on function public.is_mhur_moderator() to authenticated;

alter table public.community_build_reports enable row level security;

drop policy if exists "Users create reports" on public.community_build_reports;
create policy "Users create reports"
on public.community_build_reports for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.community_build_reports;
create policy "Users read own reports"
on public.community_build_reports for select
to authenticated
using (auth.uid() = reporter_id or public.is_mhur_moderator());

drop policy if exists "Moderators update reports" on public.community_build_reports;
create policy "Moderators update reports"
on public.community_build_reports for update
to authenticated
using (public.is_mhur_moderator())
with check (public.is_mhur_moderator());

-- La vérification et le masquage sont réservés aux modérateurs.
drop policy if exists "Moderators update all builds" on public.community_builds;
create policy "Moderators update all builds"
on public.community_builds for update
to authenticated
using (public.is_mhur_moderator())
with check (public.is_mhur_moderator());

grant select, insert, update on public.community_build_reports to authenticated;
grant select on public.profiles to anon, authenticated;

-- IMPORTANT : remplace l'adresse ci-dessous par TON adresse Google/Discord après ta première connexion.
-- Cette commande te donnera le rôle administrateur.
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'TON-EMAIL@EXEMPLE.COM'
-- );

-- ============================================================
-- PHASE_4_LANCEMENT_SECURITE_SUPABASE.sql
-- ============================================================

-- MHUR France V326 — préparation au lancement
-- À exécuter APRÈS les phases 1, 2 et 3.

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users create deletion request" on public.account_deletion_requests;
create policy "Users create deletion request"
on public.account_deletion_requests for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users read deletion request" on public.account_deletion_requests;
create policy "Users read deletion request"
on public.account_deletion_requests for select
to authenticated
using (auth.uid() = user_id or public.is_mhur_moderator());

drop policy if exists "Moderators update deletion requests" on public.account_deletion_requests;
create policy "Moderators update deletion requests"
on public.account_deletion_requests for update
to authenticated
using (public.is_mhur_moderator())
with check (public.is_mhur_moderator());

grant select, insert, update on public.account_deletion_requests to authenticated;

-- Anti-spam : maximum 5 builds par heure et 10 signalements par heure par compte.
create or replace function public.mhur_limit_build_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.community_builds where creator_id = auth.uid() and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Limite atteinte : 5 builds par heure maximum';
  end if;
  return new;
end;
$$;

drop trigger if exists mhur_limit_build_posts_trigger on public.community_builds;
create trigger mhur_limit_build_posts_trigger
before insert on public.community_builds
for each row execute function public.mhur_limit_build_posts();

create or replace function public.mhur_limit_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.community_build_reports where reporter_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Limite atteinte : 10 signalements par heure maximum';
  end if;
  return new;
end;
$$;

drop trigger if exists mhur_limit_reports_trigger on public.community_build_reports;
create trigger mhur_limit_reports_trigger
before insert on public.community_build_reports
for each row execute function public.mhur_limit_reports();

-- Compatibility helpers used by the community hub policies.
create or replace function public.is_community_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_mhur_moderator();
$$;

create or replace function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_community_moderator() to authenticated;
grant execute on function public.is_community_admin() to authenticated;

-- ============================================================
-- PHASE_5_HUB_COMMUNAUTAIRE_SUPABASE.sql
-- ============================================================

-- V327 — commentaires, tier list, notifications et administration
-- À exécuter après les scripts des phases 1 à 4.

create table if not exists public.community_build_comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.community_builds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 2 and 700),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_comments_build_idx on public.community_build_comments(build_id,created_at);
alter table public.community_build_comments enable row level security;
drop policy if exists "comments public read" on public.community_build_comments;
create policy "comments public read" on public.community_build_comments for select to anon,authenticated using (is_hidden=false or auth.uid()=user_id or public.is_community_moderator());
drop policy if exists "comments authenticated insert" on public.community_build_comments;
create policy "comments authenticated insert" on public.community_build_comments for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "comments owner delete" on public.community_build_comments;
create policy "comments owner delete" on public.community_build_comments for delete to authenticated using (auth.uid()=user_id or public.is_community_moderator());
drop policy if exists "comments moderators update" on public.community_build_comments;
create policy "comments moderators update" on public.community_build_comments for update to authenticated using (public.is_community_moderator()) with check (public.is_community_moderator());
grant select on public.community_build_comments to anon,authenticated;
grant insert,delete,update on public.community_build_comments to authenticated;

create table if not exists public.community_tier_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  style_id text not null,
  tier text not null check (tier in ('S','A','B','C','D')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,style_id)
);
alter table public.community_tier_votes enable row level security;
drop policy if exists "tier votes public read" on public.community_tier_votes;
create policy "tier votes public read" on public.community_tier_votes for select to anon,authenticated using (true);
drop policy if exists "tier votes own insert" on public.community_tier_votes;
create policy "tier votes own insert" on public.community_tier_votes for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "tier votes own update" on public.community_tier_votes;
create policy "tier votes own update" on public.community_tier_votes for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
grant select on public.community_tier_votes to anon,authenticated;
grant insert,update on public.community_tier_votes to authenticated;

-- Les administrateurs peuvent gérer les rôles. La fonction SECURITY DEFINER évite une politique RLS récursive.
create or replace function public.set_community_user_role(p_user uuid,p_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_community_admin() then raise exception 'admin required'; end if;
  if p_role not in ('user','moderator','admin') then raise exception 'invalid role'; end if;
  update public.profiles set role=p_role,updated_at=now() where id=p_user;
end;$$;
grant execute on function public.set_community_user_role(uuid,text) to authenticated;

-- ============================================================
-- V347 — TIER LISTS PERSONNELLES PUBLIABLES
-- ============================================================
create table if not exists public.community_tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  title text not null default 'Tier List' check (char_length(title) between 1 and 80),
  rankings jsonb not null default '{"S":[],"A":[],"B":[],"C":[],"D":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(rankings) = 'object')
);

alter table public.community_tier_lists enable row level security;

drop policy if exists "Published tier lists are public" on public.community_tier_lists;
create policy "Published tier lists are public"
on public.community_tier_lists for select
to anon, authenticated
using (true);

drop policy if exists "Users publish own tier list" on public.community_tier_lists;
create policy "Users publish own tier list"
on public.community_tier_lists for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own tier list" on public.community_tier_lists;
create policy "Users update own tier list"
on public.community_tier_lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own tier list" on public.community_tier_lists;
create policy "Users delete own tier list"
on public.community_tier_lists for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.community_tier_lists to anon, authenticated;
grant insert, update, delete on public.community_tier_lists to authenticated;


-- ============================================================
-- MODS V387
-- ============================================================

-- MHUR France V387 — communauté de mods
-- À exécuter une seule fois dans Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.community_mods (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  description text not null check (char_length(description) between 2 and 3000),
  category text not null check (category in ('skins','ui','sounds','effects','maps','gameplay','characters','other')),
  character_id text,
  character_name text,
  file_url text not null,
  file_path text not null,
  file_name text not null,
  file_size bigint not null default 0,
  preview_url text not null,
  preview_path text not null,
  preview_type text not null default 'image' check (preview_type in ('image','video')),
  downloads_count integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_mods_created_idx on public.community_mods(created_at desc);
create index if not exists community_mods_category_idx on public.community_mods(category);
create index if not exists community_mods_creator_idx on public.community_mods(creator_id);

alter table public.community_mods enable row level security;
drop policy if exists "community_mods_public_read" on public.community_mods;
create policy "community_mods_public_read" on public.community_mods for select using (is_hidden = false);
drop policy if exists "community_mods_authenticated_insert" on public.community_mods;
create policy "community_mods_authenticated_insert" on public.community_mods for insert to authenticated with check (auth.uid() = creator_id);
drop policy if exists "community_mods_owner_update" on public.community_mods;
create policy "community_mods_owner_update" on public.community_mods for update to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
drop policy if exists "community_mods_owner_delete" on public.community_mods;
create policy "community_mods_owner_delete" on public.community_mods for delete to authenticated using (auth.uid() = creator_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('community-mods','community-mods',true,209715200,array['application/zip','application/x-zip-compressed','application/x-rar-compressed','application/vnd.rar','application/x-7z-compressed','application/octet-stream'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('mod-previews','mod-previews',true,20971520,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit;

-- Lecture publique des fichiers.
drop policy if exists "mods_files_public_read" on storage.objects;
create policy "mods_files_public_read" on storage.objects for select using (bucket_id in ('community-mods','mod-previews'));

-- Chaque membre écrit uniquement dans son propre dossier user_id/...
drop policy if exists "mods_files_owner_insert" on storage.objects;
create policy "mods_files_owner_insert" on storage.objects for insert to authenticated
with check (bucket_id in ('community-mods','mod-previews') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "mods_files_owner_update" on storage.objects;
create policy "mods_files_owner_update" on storage.objects for update to authenticated
using (bucket_id in ('community-mods','mod-previews') and owner_id = auth.uid()::text)
with check (bucket_id in ('community-mods','mod-previews') and owner_id = auth.uid()::text);

drop policy if exists "mods_files_owner_delete" on storage.objects;
create policy "mods_files_owner_delete" on storage.objects for delete to authenticated
using (bucket_id in ('community-mods','mod-previews') and owner_id = auth.uid()::text);


-- Explicit API privileges. RLS policies still control which rows are accessible.
grant select on public.community_mods to anon, authenticated;
grant insert, update, delete on public.community_mods to authenticated;


-- ============================================================
-- MODS V390
-- ============================================================

-- MHUR France V390 — mise à niveau complète de la plateforme Mods
-- À exécuter dans Supabase > SQL Editor après le script V387.

alter table public.community_mods
  add column if not exists game_version text,
  add column if not exists mod_version text not null default '1.0',
  add column if not exists tags text[] not null default '{}',
  add column if not exists likes_count integer not null default 0;

-- Catégories V390. Les anciennes valeurs restent compatibles côté site.
alter table public.community_mods drop constraint if exists community_mods_category_check;
alter table public.community_mods add constraint community_mods_category_check
  check (category in ('skin','ui','audio','vfx','animation','environment','gameplay','misc','skins','sounds','effects','maps','characters','other'));

create table if not exists public.community_mod_likes (
  mod_id uuid not null references public.community_mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mod_id, user_id)
);

create table if not exists public.community_mod_comments (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references public.community_mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_mod_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1500),
  media_url text,
  likes_count integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_mod_likes_mod_idx on public.community_mod_likes(mod_id);
create index if not exists community_mod_comments_mod_idx on public.community_mod_comments(mod_id, created_at);

alter table public.community_mod_likes enable row level security;
alter table public.community_mod_comments enable row level security;

drop policy if exists "community_mod_likes_public_read" on public.community_mod_likes;
create policy "community_mod_likes_public_read" on public.community_mod_likes for select using (true);
drop policy if exists "community_mod_likes_owner_insert" on public.community_mod_likes;
create policy "community_mod_likes_owner_insert" on public.community_mod_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "community_mod_likes_owner_delete" on public.community_mod_likes;
create policy "community_mod_likes_owner_delete" on public.community_mod_likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "community_mod_comments_public_read" on public.community_mod_comments;
create policy "community_mod_comments_public_read" on public.community_mod_comments for select using (is_hidden = false);
drop policy if exists "community_mod_comments_owner_insert" on public.community_mod_comments;
create policy "community_mod_comments_owner_insert" on public.community_mod_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "community_mod_comments_owner_update" on public.community_mod_comments;
create policy "community_mod_comments_owner_update" on public.community_mod_comments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "community_mod_comments_owner_delete" on public.community_mod_comments;
create policy "community_mod_comments_owner_delete" on public.community_mod_comments for delete to authenticated using (auth.uid() = user_id);

create or replace function public.increment_mod_downloads(target_mod uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  update public.community_mods
  set downloads_count = downloads_count + 1
  where id = target_mod and is_hidden = false
  returning downloads_count into new_count;
  return coalesce(new_count, 0);
end;
$$;
grant execute on function public.increment_mod_downloads(uuid) to anon, authenticated;

create or replace function public.refresh_mod_likes(target_mod uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  select count(*)::integer into new_count from public.community_mod_likes where mod_id = target_mod;
  update public.community_mods set likes_count = new_count where id = target_mod;
  return new_count;
end;
$$;
grant execute on function public.refresh_mod_likes(uuid) to authenticated;


-- Explicit API privileges.
grant select on public.community_mod_likes, public.community_mod_comments to anon, authenticated;
grant insert, delete on public.community_mod_likes to authenticated;
grant insert, update, delete on public.community_mod_comments to authenticated;
