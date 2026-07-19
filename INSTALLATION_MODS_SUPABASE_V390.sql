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
