-- MHUR NEXUS V3.5 — bannissement total et réception immédiate des sanctions
-- Exécuter dans Supabase > SQL Editor.

begin;

-- Un membre banni ne peut plus lire les contenus communautaires via Supabase.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'community_builds','community_mods',
    'community_build_comments','community_mod_comments',
    'community_build_likes','community_mod_likes',
    'community_build_favorites','community_mod_favorites',
    'community_build_reports','community_mod_reports',
    'community_mod_versions'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists %I on public.%I', 'not_banned_select_v35', table_name);
      execute format(
        'create policy %I on public.%I as restrictive for select to authenticated using (not public.mhur_is_user_blocked())',
        'not_banned_select_v35', table_name
      );
    end if;
  end loop;
end $$;

-- Empêche également la lecture des photos, vidéos et fichiers communautaires.
drop policy if exists "not_banned_storage_select_v35" on storage.objects;
create policy "not_banned_storage_select_v35"
on storage.objects as restrictive
for select to authenticated
using (not public.mhur_is_user_blocked());

-- Ajoute la table de modération à la publication Realtime quand elle existe.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.user_moderation;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

commit;
notify pgrst, 'reload schema';
