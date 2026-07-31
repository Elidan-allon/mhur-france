-- ============================================================================
-- MHUR NEXUS — V543
-- Signalements complets, 3 images maximum et réponses de modération.
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Colonnes supplémentaires
-- ---------------------------------------------------------------------------

alter table if exists public.community_mod_reports
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table if exists public.community_build_reports
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table if exists public.community_feedback
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists moderator_reply text,
  add column if not exists responded_at timestamptz,
  add column if not exists responded_by uuid references auth.users(id) on delete set null;

-- Si community_feedback n'existe pas encore, crée-la.
create table if not exists public.community_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'suggestion',
  subject text not null,
  message text not null,
  attachments jsonb not null default '[]'::jsonb,
  status text not null default 'open',
  moderator_reply text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- 2. Vérification commune du rôle
-- ---------------------------------------------------------------------------

create or replace function public.mhur_is_staff(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user
      and lower(coalesce(p.role, 'user'))
        in ('admin', 'administrator', 'moderator')
  );
$$;

revoke all on function public.mhur_is_staff(uuid) from public;
grant execute on function public.mhur_is_staff(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Politiques de lecture / modification
-- ---------------------------------------------------------------------------

alter table if exists public.community_mod_reports enable row level security;
alter table if exists public.community_build_reports enable row level security;
alter table if exists public.community_feedback enable row level security;

drop policy if exists "v543_mod_reports_staff_read" on public.community_mod_reports;
create policy "v543_mod_reports_staff_read"
  on public.community_mod_reports
  for select
  to authenticated
  using (public.mhur_is_staff());

drop policy if exists "v543_build_reports_staff_read" on public.community_build_reports;
create policy "v543_build_reports_staff_read"
  on public.community_build_reports
  for select
  to authenticated
  using (public.mhur_is_staff());

drop policy if exists "v543_feedback_own_or_staff_read" on public.community_feedback;
create policy "v543_feedback_own_or_staff_read"
  on public.community_feedback
  for select
  to authenticated
  using (auth.uid() = user_id or public.mhur_is_staff());

drop policy if exists "v543_feedback_own_insert" on public.community_feedback;
create policy "v543_feedback_own_insert"
  on public.community_feedback
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and jsonb_typeof(attachments) = 'array'
    and jsonb_array_length(attachments) <= 3
  );

drop policy if exists "v543_feedback_staff_update" on public.community_feedback;
create policy "v543_feedback_staff_update"
  on public.community_feedback
  for update
  to authenticated
  using (public.mhur_is_staff())
  with check (public.mhur_is_staff());

-- Les contenus masqués doivent rester consultables par le personnel.
drop policy if exists "v543_mods_staff_read" on public.community_mods;
create policy "v543_mods_staff_read"
  on public.community_mods
  for select
  to authenticated
  using (public.mhur_is_staff());

drop policy if exists "v543_builds_staff_read" on public.community_builds;
create policy "v543_builds_staff_read"
  on public.community_builds
  for select
  to authenticated
  using (public.mhur_is_staff());

grant select, insert, update on public.community_feedback to authenticated;
grant select on public.community_mod_reports to authenticated;
grant select on public.community_build_reports to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Stockage privé des preuves
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'moderation-attachments',
  'moderation-attachments',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "v543_evidence_insert_own_folder" on storage.objects;
create policy "v543_evidence_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'moderation-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "v543_evidence_read_own_or_staff" on storage.objects;
create policy "v543_evidence_read_own_or_staff"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'moderation-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.mhur_is_staff()
    )
  );

drop policy if exists "v543_evidence_delete_own_or_staff" on storage.objects;
create policy "v543_evidence_delete_own_or_staff"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'moderation-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.mhur_is_staff()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Actions sécurisées des modérateurs
-- ---------------------------------------------------------------------------

create or replace function public.mhur_staff_handle_mod_report(
  p_report uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mod uuid;
begin
  if not public.mhur_is_staff() then
    raise exception 'Accès modération requis';
  end if;

  select mod_id into v_mod
  from public.community_mod_reports
  where id = p_report;

  if not found then
    return;
  end if;

  if p_action = 'delete_target' and v_mod is not null then
    delete from public.community_mods where id = v_mod;
  elsif p_action <> 'dismiss' then
    raise exception 'Action invalide';
  end if;

  delete from public.community_mod_reports where id = p_report;
end;
$$;

create or replace function public.mhur_staff_handle_build_report(
  p_report uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_build uuid;
begin
  if not public.mhur_is_staff() then
    raise exception 'Accès modération requis';
  end if;

  select build_id into v_build
  from public.community_build_reports
  where id = p_report;

  if not found then
    return;
  end if;

  if p_action = 'delete_target' and v_build is not null then
    delete from public.community_builds where id = v_build;
  elsif p_action <> 'dismiss' then
    raise exception 'Action invalide';
  end if;

  delete from public.community_build_reports where id = p_report;
end;
$$;

create or replace function public.mhur_staff_reply_feedback(
  p_feedback uuid,
  p_reply text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.mhur_is_staff() then
    raise exception 'Accès modération requis';
  end if;

  update public.community_feedback
  set
    status = 'resolved',
    moderator_reply = nullif(trim(coalesce(p_reply, '')), ''),
    responded_at = now(),
    responded_by = auth.uid(),
    resolved_at = now(),
    resolved_by = auth.uid()
  where id = p_feedback;
end;
$$;

create or replace function public.mhur_staff_update_deletion_request(
  p_user uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.mhur_is_staff() then
    raise exception 'Accès modération requis';
  end if;

  if p_status not in ('processed', 'rejected', 'pending', 'open') then
    raise exception 'Statut invalide';
  end if;

  update public.account_deletion_requests
  set status = p_status
  where user_id = p_user;
end;
$$;

revoke all on function public.mhur_staff_handle_mod_report(uuid,text) from public;
revoke all on function public.mhur_staff_handle_build_report(uuid,text) from public;
revoke all on function public.mhur_staff_reply_feedback(uuid,text) from public;
revoke all on function public.mhur_staff_update_deletion_request(uuid,text) from public;

grant execute on function public.mhur_staff_handle_mod_report(uuid,text) to authenticated;
grant execute on function public.mhur_staff_handle_build_report(uuid,text) to authenticated;
grant execute on function public.mhur_staff_reply_feedback(uuid,text) to authenticated;
grant execute on function public.mhur_staff_update_deletion_request(uuid,text) to authenticated;

-- Recharge le cache de schéma PostgREST.
notify pgrst, 'reload schema';
