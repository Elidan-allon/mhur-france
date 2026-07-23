-- MHUR NEXUS V2.8 — ADMINISTRATION + COMMENTAIRES MODIFIABLES + MÉDIAS COLLÉS
-- À exécuter dans Supabase > SQL Editor après avoir déployé la V2.8.
-- Ce script est réexécutable.

begin;

-- Colonnes nécessaires à l'affichage "modifié".
alter table public.community_build_comments add column if not exists updated_at timestamptz;
alter table public.community_mod_comments add column if not exists updated_at timestamptz;
update public.community_build_comments set updated_at=created_at where updated_at is null;
update public.community_mod_comments set updated_at=created_at where updated_at is null;

-- Donne automatiquement le rôle administrateur au compte MHUR Nexus.
-- Si tu te connectes avec une autre adresse, remplace l'adresse ci-dessous avant Run.
update public.profiles p
set role='admin'
from auth.users u
where p.id=u.id
  and lower(coalesce(u.email,''))=lower('Mhurnexus@gmail.com');

-- Fonction centrale : seules les personnes ayant le rôle admin/administrator sont super-administrateurs.
create or replace function public.mhur_is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid()
      and lower(coalesce(p.role,'')) in ('admin','administrator')
  );
$$;
revoke all on function public.mhur_is_site_admin() from public;
grant execute on function public.mhur_is_site_admin() to authenticated;

-- Les auteurs peuvent modifier leurs commentaires. L'admin ne modifie pas le texte des autres.
drop policy if exists "build_comments_update_own_v28" on public.community_build_comments;
create policy "build_comments_update_own_v28" on public.community_build_comments
for update to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

drop policy if exists "mod_comments_update_own_v28" on public.community_mod_comments;
create policy "mod_comments_update_own_v28" on public.community_mod_comments
for update to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

-- Suppression : auteur de son propre contenu OU super-administrateur.
drop policy if exists "build_comments_delete_owner_admin_v28" on public.community_build_comments;
create policy "build_comments_delete_owner_admin_v28" on public.community_build_comments
for delete to authenticated
using (user_id=auth.uid() or public.mhur_is_site_admin());

drop policy if exists "mod_comments_delete_owner_admin_v28" on public.community_mod_comments;
create policy "mod_comments_delete_owner_admin_v28" on public.community_mod_comments
for delete to authenticated
using (user_id=auth.uid() or public.mhur_is_site_admin());

drop policy if exists "community_builds_delete_owner_admin_v28" on public.community_builds;
create policy "community_builds_delete_owner_admin_v28" on public.community_builds
for delete to authenticated
using (creator_id=auth.uid() or public.mhur_is_site_admin());

drop policy if exists "community_mods_delete_owner_admin_v28" on public.community_mods;
create policy "community_mods_delete_owner_admin_v28" on public.community_mods
for delete to authenticated
using (creator_id=auth.uid() or public.mhur_is_site_admin());

-- L'admin peut supprimer les fichiers liés aux mods/commentaires supprimés.
drop policy if exists "comment_media_delete_staff" on storage.objects;
drop policy if exists "media_delete_site_admin_v28" on storage.objects;
create policy "media_delete_site_admin_v28" on storage.objects
for delete to authenticated
using (
  bucket_id in ('mod-previews','community-mods')
  and public.mhur_is_site_admin()
);

commit;
notify pgrst, 'reload schema';
