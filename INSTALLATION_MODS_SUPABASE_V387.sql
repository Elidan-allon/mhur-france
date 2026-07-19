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
