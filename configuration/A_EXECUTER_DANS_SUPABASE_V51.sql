-- MHUR NEXUS V5.1 — RÉPARATION COMPLÈTE DES SANCTIONS ET DES RECOURS
-- À exécuter dans Supabase > SQL Editor, puis cliquer sur Run.
-- Le script est réexécutable et ne supprime aucun recours existant.

begin;

create extension if not exists pgcrypto;

-- Colonnes nécessaires sur la table de modération.
alter table public.user_moderation add column if not exists sanction_id uuid;
alter table public.user_moderation add column if not exists banned_at timestamptz;
alter table public.user_moderation add column if not exists updated_at timestamptz not null default now();

-- Table des messages envoyés à la modération.
create table if not exists public.moderation_appeals(
  id uuid primary key default gen_random_uuid(),
  sanction_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sanction_type text not null check(sanction_type in ('warning','temporary','permanent')),
  message text not null check(char_length(message) between 1 and 1500),
  status text not null default 'open' check(status in ('open','resolved')),
  response_message text check(response_message is null or char_length(response_message)<=1500),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null,
  unique(sanction_id,user_id)
);

create index if not exists moderation_appeals_user_idx on public.moderation_appeals(user_id,created_at desc);
create index if not exists moderation_appeals_sanction_idx on public.moderation_appeals(sanction_id);

alter table public.moderation_appeals enable row level security;
grant select,insert,update,delete on public.moderation_appeals to authenticated;
grant select,insert,update on public.user_moderation to authenticated;

-- Chaque membre voit son propre recours. Les administrateurs voient et traitent tout.
drop policy if exists appeals_select_self_admin_v50 on public.moderation_appeals;
drop policy if exists appeals_select_self_admin_v51 on public.moderation_appeals;
create policy appeals_select_self_admin_v51
on public.moderation_appeals for select to authenticated
using(user_id=auth.uid() or public.mhur_is_site_admin());

drop policy if exists appeals_insert_self_v50 on public.moderation_appeals;
drop policy if exists appeals_insert_self_v51 on public.moderation_appeals;
create policy appeals_insert_self_v51
on public.moderation_appeals for insert to authenticated
with check(
  user_id=auth.uid()
  and exists(
    select 1 from public.user_moderation m
    where m.user_id=auth.uid()
      and m.sanction_id=moderation_appeals.sanction_id
  )
);

drop policy if exists appeals_update_admin_v50 on public.moderation_appeals;
drop policy if exists appeals_update_admin_v51 on public.moderation_appeals;
create policy appeals_update_admin_v51
on public.moderation_appeals for update to authenticated
using(public.mhur_is_site_admin())
with check(public.mhur_is_site_admin());

drop policy if exists appeals_delete_admin_v50 on public.moderation_appeals;
drop policy if exists appeals_delete_admin_v51 on public.moderation_appeals;
create policy appeals_delete_admin_v51
on public.moderation_appeals for delete to authenticated
using(public.mhur_is_site_admin());

-- Filet de sécurité : même une ancienne interface d'administration qui oublie
-- sanction_id reçoit automatiquement un identifiant de sanction et banned_at.
create or replace function public.mhur_prepare_sanction_v51()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  ban_is_active boolean;
  warning_is_active boolean;
  ban_changed boolean;
  warning_changed boolean;
begin
  ban_is_active := coalesce(new.banned_permanent,false)
    or (new.banned_until is not null and new.banned_until>now());
  warning_is_active := new.warning_message is not null
    and new.warning_acknowledged_at is null;

  if tg_op='INSERT' then
    ban_changed := ban_is_active;
    warning_changed := warning_is_active;
  else
    ban_changed := ban_is_active and (
      coalesce(new.banned_permanent,false) is distinct from coalesce(old.banned_permanent,false)
      or new.banned_until is distinct from old.banned_until
      or new.ban_reason is distinct from old.ban_reason
      or not (coalesce(old.banned_permanent,false) or (old.banned_until is not null and old.banned_until>now()))
    );
    warning_changed := warning_is_active and (
      new.warning_message is distinct from old.warning_message
      or new.warning_created_at is distinct from old.warning_created_at
      or old.warning_acknowledged_at is not null
    );
  end if;

  if ban_changed then
    if new.sanction_id is null or (tg_op='UPDATE' and new.sanction_id=old.sanction_id) then
      new.sanction_id := gen_random_uuid();
    end if;
    if new.banned_at is null or tg_op='INSERT' or (tg_op='UPDATE' and not (coalesce(old.banned_permanent,false) or (old.banned_until is not null and old.banned_until>now()))) then
      new.banned_at := now();
    end if;
  elsif warning_changed then
    if new.sanction_id is null or (tg_op='UPDATE' and new.sanction_id=old.sanction_id) then
      new.sanction_id := gen_random_uuid();
    end if;
    new.warning_created_at := coalesce(new.warning_created_at,now());
  elsif new.sanction_id is null and (ban_is_active or warning_is_active) then
    new.sanction_id := gen_random_uuid();
  end if;

  return new;
end;
$$;

drop trigger if exists mhur_prepare_sanction_v51 on public.user_moderation;
create trigger mhur_prepare_sanction_v51
before insert or update on public.user_moderation
for each row execute function public.mhur_prepare_sanction_v51();

-- Répare les sanctions actives créées avant la V5.1.
update public.user_moderation
set sanction_id=coalesce(sanction_id,gen_random_uuid()),
    banned_at=case
      when banned_permanent=true or (banned_until is not null and banned_until>now())
      then coalesce(banned_at,updated_at,now())
      else banned_at
    end
where warning_message is not null
   or banned_permanent=true
   or banned_until is not null;

-- Envoi fiable d'un seul message par sanction. Le serveur retrouve lui-même
-- la sanction active : le navigateur n'a plus besoin de posséder sanction_id.
create or replace function public.mhur_submit_moderation_appeal(appeal_message text)
returns setof public.moderation_appeals
language plpgsql
security definer
set search_path=public
as $$
declare
  moderation public.user_moderation%rowtype;
  appeal public.moderation_appeals%rowtype;
  current_type text;
  clean_message text;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  clean_message := btrim(coalesce(appeal_message,''));
  if char_length(clean_message)<1 or char_length(clean_message)>1500 then
    raise exception 'Le message doit contenir entre 1 et 1500 caractères.';
  end if;

  select * into moderation
  from public.user_moderation
  where user_id=auth.uid()
  for update;

  if not found then raise exception 'Aucune sanction active.'; end if;

  if moderation.banned_permanent then current_type:='permanent';
  elsif moderation.banned_until is not null and moderation.banned_until>now() then current_type:='temporary';
  elsif moderation.warning_message is not null and moderation.warning_acknowledged_at is null then current_type:='warning';
  else raise exception 'Cette sanction n’est plus active.';
  end if;

  if moderation.sanction_id is null then
    update public.user_moderation
    set sanction_id=gen_random_uuid(),updated_at=now()
    where user_id=auth.uid()
    returning * into moderation;
  end if;

  select * into appeal
  from public.moderation_appeals
  where sanction_id=moderation.sanction_id and user_id=auth.uid();

  if found then
    return next appeal;
    return;
  end if;

  insert into public.moderation_appeals(sanction_id,user_id,sanction_type,message)
  values(moderation.sanction_id,auth.uid(),current_type,clean_message)
  returning * into appeal;

  return next appeal;
end;
$$;
revoke all on function public.mhur_submit_moderation_appeal(text) from public;
grant execute on function public.mhur_submit_moderation_appeal(text) to authenticated;

-- Retourne le recours associé à la sanction actuellement affichée.
create or replace function public.mhur_get_my_current_appeal()
returns setof public.moderation_appeals
language sql
stable
security definer
set search_path=public
as $$
  select a.*
  from public.moderation_appeals a
  join public.user_moderation m
    on m.sanction_id=a.sanction_id and m.user_id=a.user_id
  where m.user_id=auth.uid()
  order by a.created_at desc
  limit 1;
$$;
revoke all on function public.mhur_get_my_current_appeal() from public;
grant execute on function public.mhur_get_my_current_appeal() to authenticated;

-- Toutes les sanctions administrateur sont désormais atomiques et reçoivent
-- toujours un nouvel identifiant. Une sanction remplace la précédente.
create or replace function public.mhur_admin_apply_sanction(
  target_user uuid,
  sanction_action text,
  moderation_message text default null,
  temporary_until timestamptz default null
)
returns setof public.user_moderation
language plpgsql
security definer
set search_path=public
as $$
declare
  result public.user_moderation%rowtype;
  now_value timestamptz:=now();
  new_id uuid:=gen_random_uuid();
  clean_action text:=lower(btrim(coalesce(sanction_action,'')));
  clean_message text:=nullif(btrim(coalesce(moderation_message,'')),'');
begin
  if not public.mhur_is_site_admin() then raise exception 'Accès administrateur requis.'; end if;
  if target_user is null then raise exception 'Utilisateur manquant.'; end if;

  if clean_action='warn' then
    if clean_message is null then raise exception 'Le message d’avertissement est obligatoire.'; end if;
    insert into public.user_moderation(
      user_id,sanction_id,warning_message,warning_created_at,warning_acknowledged_at,warned_by,
      banned_permanent,banned_until,banned_at,ban_reason,banned_by,updated_at
    ) values(
      target_user,new_id,clean_message,now_value,null,auth.uid(),
      false,null,null,null,null,now_value
    )
    on conflict(user_id) do update set
      sanction_id=excluded.sanction_id,
      warning_message=excluded.warning_message,
      warning_created_at=excluded.warning_created_at,
      warning_acknowledged_at=null,
      warned_by=excluded.warned_by,
      banned_permanent=false,banned_until=null,banned_at=null,ban_reason=null,banned_by=null,
      updated_at=now_value;

  elsif clean_action='temporary' then
    if temporary_until is null or temporary_until<=now_value then raise exception 'Choisis une date de fin future.'; end if;
    insert into public.user_moderation(
      user_id,sanction_id,warning_message,warning_created_at,warning_acknowledged_at,warned_by,
      banned_permanent,banned_until,banned_at,ban_reason,banned_by,updated_at
    ) values(
      target_user,new_id,null,null,null,null,
      false,temporary_until,now_value,coalesce(clean_message,'Bannissement temporaire'),auth.uid(),now_value
    )
    on conflict(user_id) do update set
      sanction_id=excluded.sanction_id,
      warning_message=null,warning_created_at=null,warning_acknowledged_at=null,warned_by=null,
      banned_permanent=false,banned_until=excluded.banned_until,banned_at=now_value,
      ban_reason=excluded.ban_reason,banned_by=auth.uid(),updated_at=now_value;

  elsif clean_action='permanent' then
    insert into public.user_moderation(
      user_id,sanction_id,warning_message,warning_created_at,warning_acknowledged_at,warned_by,
      banned_permanent,banned_until,banned_at,ban_reason,banned_by,updated_at
    ) values(
      target_user,new_id,null,null,null,null,
      true,null,now_value,coalesce(clean_message,'Bannissement définitif'),auth.uid(),now_value
    )
    on conflict(user_id) do update set
      sanction_id=excluded.sanction_id,
      warning_message=null,warning_created_at=null,warning_acknowledged_at=null,warned_by=null,
      banned_permanent=true,banned_until=null,banned_at=now_value,
      ban_reason=excluded.ban_reason,banned_by=auth.uid(),updated_at=now_value;

  elsif clean_action='unban' then
    update public.user_moderation set
      banned_permanent=false,banned_until=null,banned_at=null,ban_reason=null,banned_by=null,updated_at=now_value
    where user_id=target_user;

  elsif clean_action='clear_warning' then
    update public.user_moderation set
      warning_message=null,warning_created_at=null,warning_acknowledged_at=null,warned_by=null,updated_at=now_value
    where user_id=target_user;

  else
    raise exception 'Action de modération inconnue.';
  end if;

  select * into result from public.user_moderation where user_id=target_user;
  if found then return next result; end if;
end;
$$;
revoke all on function public.mhur_admin_apply_sanction(uuid,text,text,timestamptz) from public;
grant execute on function public.mhur_admin_apply_sanction(uuid,text,text,timestamptz) to authenticated;

-- Realtime pour les sanctions et les recours.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    begin alter publication supabase_realtime add table public.user_moderation; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.moderation_appeals; exception when duplicate_object then null; end;
  end if;
end $$;

commit;
notify pgrst,'reload schema';
