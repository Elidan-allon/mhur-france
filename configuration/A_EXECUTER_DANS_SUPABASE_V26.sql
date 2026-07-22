-- MHUR NEXUS V2.6 — CORRECTION DES APERÇUS DE MODS
-- + médias dans les commentaires de Builds communauté et de Mods.
--
-- À exécuter UNE FOIS dans Supabase > SQL Editor > New query > Run.
-- Le script est réexécutable : les colonnes sont ajoutées avec IF NOT EXISTS.

begin;

-- ============================================================
-- 1) MODS : galerie de 1 à 4 photos + vidéo facultative
-- ============================================================
alter table public.community_mods
  add column if not exists preview_images jsonb not null default '[]'::jsonb,
  add column if not exists preview_url text,
  add column if not exists preview_path text,
  add column if not exists preview_type text,
  add column if not exists video_url text,
  add column if not exists video_path text;

-- Convertit automatiquement les anciens aperçus uniques en galerie JSON.
update public.community_mods
set preview_images = jsonb_build_array(
  jsonb_build_object(
    'url', preview_url,
    'path', preview_path
  )
)
where preview_url is not null
  and coalesce(preview_type, 'image') <> 'video'
  and (
    preview_images is null
    or jsonb_typeof(preview_images) <> 'array'
    or jsonb_array_length(preview_images) = 0
  );

-- ============================================================
-- 2) COMMENTAIRES : photo ou vidéo jointe
-- ============================================================
alter table public.community_build_comments
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_path text;

alter table public.community_mod_comments
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_path text;

-- ============================================================
-- 3) STOCKAGE COMMUN DES APERÇUS ET PIÈCES JOINTES
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mod-previews',
  'mod-previews',
  true,
  52428800,
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm','video/quicktime'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

-- Politiques pour les médias placés dans :
-- comments/build-<id>/<user-id>/fichier
-- comments/mod-<id>/<user-id>/fichier

drop policy if exists "comment_media_insert_own" on storage.objects;
create policy "comment_media_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'mod-previews'
  and (storage.foldername(name))[1] = 'comments'
  and (
    (storage.foldername(name))[2] like 'build-%'
    or (storage.foldername(name))[2] like 'mod-%'
  )
  and (storage.foldername(name))[3] = auth.uid()::text
);

drop policy if exists "comment_media_public_read" on storage.objects;
create policy "comment_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'mod-previews');

drop policy if exists "comment_media_delete_own" on storage.objects;
create policy "comment_media_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'mod-previews'
  and (storage.foldername(name))[1] = 'comments'
  and (storage.foldername(name))[3] = auth.uid()::text
);

drop policy if exists "comment_media_delete_staff" on storage.objects;
create policy "comment_media_delete_staff"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'mod-previews'
  and (storage.foldername(name))[1] = 'comments'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in (
        'admin','administrator','moderator','modérateur','moderateur'
      )
  )
);

commit;

-- Force l’API Supabase/PostgREST à reconnaître immédiatement les nouvelles colonnes.
notify pgrst, 'reload schema';
