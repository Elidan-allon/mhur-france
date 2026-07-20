-- MHUR France V412 — fiabilité, partage, sécurité et notifications
-- À exécuter UNE FOIS dans Supabase > SQL Editor sur une base déjà en V411.

create extension if not exists pgcrypto;

-- ============================================================
-- BUILDS : code de partage, compteur de copies et validation
-- ============================================================
create or replace function public.mhur_generate_build_share_code()
returns text
language sql
volatile
as $$
  select 'MHR-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
$$;

alter table public.community_builds
  add column if not exists share_code text,
  add column if not exists copied_count integer not null default 0 check (copied_count >= 0),
  add column if not exists validation_status text not null default 'valid'
    check (validation_status in ('valid','warning','invalid')),
  add column if not exists validation_issues text[] not null default '{}';

update public.community_builds
set share_code = public.mhur_generate_build_share_code()
where share_code is null or btrim(share_code) = '';

alter table public.community_builds
  alter column share_code set default public.mhur_generate_build_share_code(),
  alter column share_code set not null;

create unique index if not exists community_builds_share_code_uidx
  on public.community_builds(upper(share_code));

create or replace function public.increment_build_copy(target_build uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer := 0;
begin
  if auth.uid() is null then
    select copied_count into new_count
    from public.community_builds
    where id = target_build and is_hidden = false;
    return coalesce(new_count, 0);
  end if;

  update public.community_builds
  set copied_count = copied_count + 1
  where id = target_build and is_hidden = false
  returning copied_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

revoke execute on function public.increment_build_copy(uuid) from anon;
grant execute on function public.increment_build_copy(uuid) to authenticated;

-- ============================================================
-- MODS : état de sécurité et empreinte du fichier
-- ============================================================
alter table public.community_mods
  add column if not exists file_sha256 text,
  add column if not exists security_status text not null default 'extension_checked'
    check (security_status in ('verified','checksum','extension_checked','unverified','blocked')),
  add column if not exists security_note text;

create index if not exists community_mods_security_idx
  on public.community_mods(security_status, created_at desc);

-- ============================================================
-- NOTIFICATIONS PRIVÉES ET PERSISTANTES
-- ============================================================
create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid,
  type text not null check (type in (
    'build_comment','mod_comment','build_like','mod_like','build_reaction',
    'build_updated','mod_updated','moderation','badge','system'
  )),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  entity_type text check (entity_type in ('build','mod','profile','system')),
  entity_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_idx
  on public.community_notifications(user_id, is_read, created_at desc);

alter table public.community_notifications enable row level security;

drop policy if exists "notifications owner read" on public.community_notifications;
create policy "notifications owner read"
on public.community_notifications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications owner update" on public.community_notifications;
create policy "notifications owner update"
on public.community_notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications owner delete" on public.community_notifications;
create policy "notifications owner delete"
on public.community_notifications for delete
to authenticated
using (auth.uid() = user_id);

grant select, update, delete on public.community_notifications to authenticated;
revoke all on public.community_notifications from anon;

create or replace function public.mhur_insert_notification(
  p_user uuid,
  p_actor uuid,
  p_type text,
  p_title text,
  p_body text,
  p_entity_type text,
  p_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null or p_user = p_actor then return; end if;
  insert into public.community_notifications(user_id, actor_id, type, title, body, entity_type, entity_id)
  values (p_user, p_actor, p_type, left(p_title,120), left(coalesce(p_body,''),500), p_entity_type, p_entity_id);
end;
$$;
revoke execute on function public.mhur_insert_notification(uuid,uuid,text,text,text,text,uuid) from public, anon, authenticated;

-- Commentaire sur un build.
create or replace function public.mhur_notify_build_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid; build_title text; actor_name text;
begin
  select creator_id, title into owner_id, build_title from public.community_builds where id = new.build_id;
  select username into actor_name from public.profiles where id = new.user_id;
  perform public.mhur_insert_notification(owner_id,new.user_id,'build_comment','Nouveau commentaire',coalesce(actor_name,'Membre') || ' · ' || coalesce(build_title,'Build'),'build',new.build_id);
  return new;
end;
$$;
drop trigger if exists mhur_notify_build_comment_trg on public.community_build_comments;
create trigger mhur_notify_build_comment_trg
after insert on public.community_build_comments
for each row execute function public.mhur_notify_build_comment();

-- Commentaire sur un mod.
create or replace function public.mhur_notify_mod_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid; mod_title text; actor_name text;
begin
  select creator_id, title into owner_id, mod_title from public.community_mods where id = new.mod_id;
  select username into actor_name from public.profiles where id = new.user_id;
  perform public.mhur_insert_notification(owner_id,new.user_id,'mod_comment','Nouveau commentaire',coalesce(actor_name,'Membre') || ' · ' || coalesce(mod_title,'Mod'),'mod',new.mod_id);
  return new;
end;
$$;
drop trigger if exists mhur_notify_mod_comment_trg on public.community_mod_comments;
create trigger mhur_notify_mod_comment_trg
after insert on public.community_mod_comments
for each row execute function public.mhur_notify_mod_comment();

-- Like sur un mod.
create or replace function public.mhur_notify_mod_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid; mod_title text; actor_name text;
begin
  select creator_id, title into owner_id, mod_title from public.community_mods where id = new.mod_id;
  select username into actor_name from public.profiles where id = new.user_id;
  perform public.mhur_insert_notification(owner_id,new.user_id,'mod_like','Nouveau J’aime',coalesce(actor_name,'Membre') || ' · ' || coalesce(mod_title,'Mod'),'mod',new.mod_id);
  return new;
end;
$$;
drop trigger if exists mhur_notify_mod_like_trg on public.community_mod_likes;
create trigger mhur_notify_mod_like_trg
after insert on public.community_mod_likes
for each row execute function public.mhur_notify_mod_like();

-- Like sur un build. voter_id correspond au compte connecté dans les versions récentes.
create or replace function public.mhur_notify_build_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid; build_title text; actor_name text;
begin
  select creator_id, title into owner_id, build_title from public.community_builds where id = new.build_id;
  select username into actor_name from public.profiles where id = new.voter_id;
  perform public.mhur_insert_notification(owner_id,new.voter_id,'build_like','Nouveau J’aime',coalesce(actor_name,'Membre') || ' · ' || coalesce(build_title,'Build'),'build',new.build_id);
  return new;
end;
$$;
drop trigger if exists mhur_notify_build_like_trg on public.community_build_likes;
create trigger mhur_notify_build_like_trg
after insert on public.community_build_likes
for each row execute function public.mhur_notify_build_like();

-- Réaction sur un build.
create or replace function public.mhur_notify_build_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid; build_title text; actor_name text;
begin
  select creator_id, title into owner_id, build_title from public.community_builds where id = new.build_id;
  select username into actor_name from public.profiles where id = new.user_id;
  perform public.mhur_insert_notification(owner_id,new.user_id,'build_reaction','Nouvelle réaction',coalesce(actor_name,'Membre') || ' · ' || coalesce(build_title,'Build') || ' · ' || new.reaction,'build',new.build_id);
  return new;
end;
$$;
drop trigger if exists mhur_notify_build_reaction_trg on public.community_build_reactions;
create trigger mhur_notify_build_reaction_trg
after insert on public.community_build_reactions
for each row execute function public.mhur_notify_build_reaction();

-- Mise à jour d’un build favori.
create or replace function public.mhur_notify_build_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare fav record;
begin
  for fav in select user_id from public.community_build_favorites where build_id = new.id loop
    perform public.mhur_insert_notification(fav.user_id,new.creator_id,'build_updated','Build favori mis à jour',new.title,'build',new.id);
  end loop;
  return new;
end;
$$;
drop trigger if exists mhur_notify_build_update_trg on public.community_builds;
create trigger mhur_notify_build_update_trg
after update of title, description, tuning_slots, costume_id, game_version on public.community_builds
for each row when (old.updated_at is distinct from new.updated_at)
execute function public.mhur_notify_build_update();

-- Mise à jour d’un mod favori.
create or replace function public.mhur_notify_mod_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare fav record;
begin
  for fav in select user_id from public.community_mod_favorites where mod_id = new.id loop
    perform public.mhur_insert_notification(fav.user_id,new.creator_id,'mod_updated','Mod favori mis à jour',new.title || ' · v' || coalesce(new.mod_version,'1.0'),'mod',new.id);
  end loop;
  return new;
end;
$$;
drop trigger if exists mhur_notify_mod_update_trg on public.community_mods;
create trigger mhur_notify_mod_update_trg
after update of title, description, mod_version, game_version, file_url, preview_url on public.community_mods
for each row when (old.updated_at is distinct from new.updated_at)
execute function public.mhur_notify_mod_update();

-- Nettoyage facultatif : conserve au maximum environ six mois de notifications lues.
create or replace function public.mhur_cleanup_old_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare removed integer;
begin
  delete from public.community_notifications
  where is_read = true and created_at < now() - interval '180 days';
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke execute on function public.mhur_cleanup_old_notifications() from anon;
grant execute on function public.mhur_cleanup_old_notifications() to authenticated;

-- Les créateurs gardent leurs droits de modification.
grant update, delete on public.community_builds to authenticated;
grant update, delete on public.community_mods to authenticated;
