-- MHUR Nexus v4.0 — diffusion temps réel des données communautaires
-- À exécuter une seule fois dans Supabase > SQL Editor.

-- Ajoute les tables existantes à la publication Supabase Realtime.
do $$
declare
  t text;
begin
  foreach t in array array[
    'community_mods',
    'community_mod_comments',
    'community_mod_likes',
    'community_builds',
    'community_build_comments',
    'community_build_reactions',
    'profiles',
    'user_moderation'
  ] loop
    if to_regclass('public.' || t) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;
      end;
    end if;
  end loop;
end $$;

-- Garantit une colonne updated_at sur les tables principales lorsque possible.
do $$
declare
  t text;
begin
  foreach t in array array['community_mods','community_mod_comments','community_builds','community_build_comments','profiles','user_moderation'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists updated_at timestamptz default now()', t);
    end if;
  end loop;
end $$;

create or replace function public.mhur_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
  trigger_name text;
begin
  foreach t in array array['community_mods','community_mod_comments','community_builds','community_build_comments','profiles','user_moderation'] loop
    if to_regclass('public.' || t) is not null then
      trigger_name := 'mhur_touch_' || t || '_updated_at';
      execute format('drop trigger if exists %I on public.%I', trigger_name, t);
      execute format('create trigger %I before update on public.%I for each row execute function public.mhur_touch_updated_at()', trigger_name, t);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
