-- MHUR NEXUS V2.9 — PROFILS PUBLICS, AVERTISSEMENTS ET BANNISSEMENTS
-- À exécuter UNE FOIS dans Supabase > SQL Editor > New query > Run.
-- Le script peut être réexécuté sans supprimer les données existantes.

begin;

-- Les informations privées de modération sont séparées des profils publics.
create table if not exists public.user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  warning_message text,
  warning_created_at timestamptz,
  warning_acknowledged_at timestamptz,
  warned_by uuid references auth.users(id) on delete set null,
  banned_until timestamptz,
  banned_permanent boolean not null default false,
  ban_reason text,
  banned_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.user_moderation enable row level security;

-- Vérifie le rôle admin stocké dans public.profiles.
create or replace function public.mhur_is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role,'')) in ('admin','administrator')
  );
$$;
revoke all on function public.mhur_is_site_admin() from public;
grant execute on function public.mhur_is_site_admin() to authenticated;

-- Indique si un compte est actuellement suspendu.
create or replace function public.mhur_is_user_blocked(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_moderation m
    where m.user_id = target_user
      and (
        m.banned_permanent = true
        or (m.banned_until is not null and m.banned_until > now())
      )
  );
$$;
revoke all on function public.mhur_is_user_blocked(uuid) from public;
grant execute on function public.mhur_is_user_blocked(uuid) to authenticated;

-- L'utilisateur peut uniquement confirmer qu'il a lu son avertissement.
create or replace function public.mhur_ack_warning()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_moderation
  set warning_acknowledged_at = now(), updated_at = now()
  where user_id = auth.uid()
    and warning_message is not null;
end;
$$;
revoke all on function public.mhur_ack_warning() from public;
grant execute on function public.mhur_ack_warning() to authenticated;

-- Lecture : chaque membre voit uniquement sa propre sanction ; l'admin voit tout.
drop policy if exists "moderation_select_self_admin_v29" on public.user_moderation;
create policy "moderation_select_self_admin_v29"
on public.user_moderation
for select to authenticated
using (user_id = auth.uid() or public.mhur_is_site_admin());

-- Écriture : réservée au super-administrateur.
drop policy if exists "moderation_insert_admin_v29" on public.user_moderation;
create policy "moderation_insert_admin_v29"
on public.user_moderation
for insert to authenticated
with check (public.mhur_is_site_admin());

drop policy if exists "moderation_update_admin_v29" on public.user_moderation;
create policy "moderation_update_admin_v29"
on public.user_moderation
for update to authenticated
using (public.mhur_is_site_admin())
with check (public.mhur_is_site_admin());

drop policy if exists "moderation_delete_admin_v29" on public.user_moderation;
create policy "moderation_delete_admin_v29"
on public.user_moderation
for delete to authenticated
using (public.mhur_is_site_admin());

-- Un compte suspendu garde le droit de consulter le site, mais ne peut plus
-- publier, modifier ni supprimer du contenu communautaire.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'community_builds',
    'community_mods',
    'community_build_comments',
    'community_mod_comments',
    'community_build_likes',
    'community_mod_likes',
    'community_build_favorites',
    'community_mod_favorites',
    'community_build_reports',
    'community_mod_reports',
    'community_mod_versions'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists %I on public.%I', 'not_banned_insert_v29', table_name);
      execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (not public.mhur_is_user_blocked())', 'not_banned_insert_v29', table_name);
      execute format('drop policy if exists %I on public.%I', 'not_banned_update_v29', table_name);
      execute format('create policy %I on public.%I as restrictive for update to authenticated using (not public.mhur_is_user_blocked()) with check (not public.mhur_is_user_blocked())', 'not_banned_update_v29', table_name);
      execute format('drop policy if exists %I on public.%I', 'not_banned_delete_v29', table_name);
      execute format('create policy %I on public.%I as restrictive for delete to authenticated using (not public.mhur_is_user_blocked())', 'not_banned_delete_v29', table_name);
    end if;
  end loop;
end $$;

-- Même protection pour les fichiers de mods, photos et vidéos.
drop policy if exists "not_banned_storage_insert_v29" on storage.objects;
create policy "not_banned_storage_insert_v29"
on storage.objects as restrictive
for insert to authenticated
with check (not public.mhur_is_user_blocked());

drop policy if exists "not_banned_storage_update_v29" on storage.objects;
create policy "not_banned_storage_update_v29"
on storage.objects as restrictive
for update to authenticated
using (not public.mhur_is_user_blocked())
with check (not public.mhur_is_user_blocked());

drop policy if exists "not_banned_storage_delete_v29" on storage.objects;
create policy "not_banned_storage_delete_v29"
on storage.objects as restrictive
for delete to authenticated
using (not public.mhur_is_user_blocked());

commit;
notify pgrst, 'reload schema';
