-- MHUR France V409 — modification des créations + téléchargements uniques
-- À exécuter UNE FOIS dans Supabase > SQL Editor sur une base déjà installée.

-- Les créateurs authentifiés peuvent modifier/supprimer uniquement leurs propres contenus.
-- Les politiques RLS propriétaires déjà présentes restent la protection principale.
grant update, delete on public.community_builds to authenticated;
grant update, delete on public.community_mods to authenticated;

-- Un téléchargement ne peut augmenter le compteur qu'une seule fois par compte.
create table if not exists public.community_mod_downloads (
  mod_id uuid not null references public.community_mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mod_id, user_id)
);

create index if not exists community_mod_downloads_mod_idx
  on public.community_mod_downloads(mod_id);

alter table public.community_mod_downloads enable row level security;
revoke all on public.community_mod_downloads from anon, authenticated;

create or replace function public.increment_mod_downloads(target_mod uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  downloader uuid := auth.uid();
  inserted_rows integer := 0;
  new_count integer := 0;
begin
  if not exists (
    select 1 from public.community_mods
    where id = target_mod and is_hidden = false
  ) then
    return 0;
  end if;

  -- Sans compte connecté, le fichier reste téléchargeable mais le compteur ne monte pas.
  if downloader is null then
    select downloads_count into new_count
    from public.community_mods where id = target_mod;
    return coalesce(new_count, 0);
  end if;

  insert into public.community_mod_downloads(mod_id, user_id)
  values (target_mod, downloader)
  on conflict (mod_id, user_id) do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 1 then
    update public.community_mods
    set downloads_count = downloads_count + 1
    where id = target_mod and is_hidden = false
    returning downloads_count into new_count;
  else
    select downloads_count into new_count
    from public.community_mods where id = target_mod;
  end if;

  return coalesce(new_count, 0);
end;
$$;

revoke execute on function public.increment_mod_downloads(uuid) from anon;
grant execute on function public.increment_mod_downloads(uuid) to authenticated;
