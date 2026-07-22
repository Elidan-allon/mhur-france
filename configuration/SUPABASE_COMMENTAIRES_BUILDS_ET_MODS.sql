-- MHUR NEXUS V2.0 — PHOTOS / VIDÉOS DANS LES COMMENTAIRES
-- Concerne :
--   1) les commentaires des Builds communauté
--   2) les commentaires des Mods
-- À exécuter UNE FOIS dans Supabase > SQL Editor.

begin;

-- Colonnes média pour les commentaires de Builds communauté.
alter table public.community_build_comments
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_path text;

-- Colonnes média pour les commentaires de Mods.
alter table public.community_mod_comments
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_path text;

-- Bucket commun aux aperçus de mods et aux médias de commentaires.
-- Limite générale : 50 Mo. Le site limite lui-même les images à 8 Mo.
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

-- Nettoyage des anciennes politiques portant le même nom.
drop policy if exists "comment_media_insert_own" on storage.objects;
drop policy if exists "comment_media_public_read" on storage.objects;
drop policy if exists "comment_media_delete_own" on storage.objects;
drop policy if exists "comment_media_delete_staff" on storage.objects;

-- Envoi réservé aux membres connectés dans :
-- comments/build-<id>/<user-id>/fichier
-- comments/mod-<id>/<user-id>/fichier
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

-- Lecture publique des photos et vidéos publiées.
create policy "comment_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'mod-previews');

-- Un membre peut supprimer ses propres pièces jointes.
create policy "comment_media_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'mod-previews'
  and (storage.foldername(name))[1] = 'comments'
  and (storage.foldername(name))[3] = auth.uid()::text
);

-- Les administrateurs et modérateurs peuvent supprimer un média signalé.
-- Cette règle utilise public.profiles.role, déjà utilisée par le site.
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
      and lower(coalesce(p.role, '')) in ('admin','administrator','moderator','modérateur','moderateur')
  )
);

commit;
