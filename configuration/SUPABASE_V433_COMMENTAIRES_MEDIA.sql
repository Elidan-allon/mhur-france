-- MHUR France V433 — photos/vidéos dans les commentaires
-- À exécuter UNE FOIS dans Supabase > SQL Editor avant de déployer la V433.

alter table public.community_build_comments
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_path text;

alter table public.community_mod_comments
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_path text;

-- Le site réutilise le bucket public "mod-previews" déjà utilisé par les aperçus des mods.
-- Vérification/création du bucket (ne modifie pas le bucket s'il existe déjà).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mod-previews', 'mod-previews', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = true,
  file_size_limit = greatest(storage.buckets.file_size_limit, excluded.file_size_limit);

-- Autorise un membre connecté à envoyer ses pièces jointes dans comments/<type>/<son-id>/...
drop policy if exists "comment_media_insert_own" on storage.objects;
create policy "comment_media_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'mod-previews'
  and (storage.foldername(name))[1] = 'comments'
  and (storage.foldername(name))[3] = auth.uid()::text
);

-- Lecture publique (le bucket est public, cette règle couvre aussi l'API Storage).
drop policy if exists "comment_media_public_read" on storage.objects;
create policy "comment_media_public_read"
on storage.objects for select to public
using (bucket_id = 'mod-previews');

-- Un membre peut supprimer uniquement ses propres pièces jointes de commentaire.
drop policy if exists "comment_media_delete_own" on storage.objects;
create policy "comment_media_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'mod-previews'
  and (storage.foldername(name))[1] = 'comments'
  and (storage.foldername(name))[3] = auth.uid()::text
);
