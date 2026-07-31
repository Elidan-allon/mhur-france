-- ============================================================================
-- MHUR NEXUS — V539 : boîte Suggestions / Problèmes
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.community_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'suggestion' check (type in ('suggestion','bug','help','other')),
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'open' check (status in ('open','resolved','archived')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create index if not exists community_feedback_status_created_idx
  on public.community_feedback(status, created_at desc);
create index if not exists community_feedback_user_created_idx
  on public.community_feedback(user_id, created_at desc);

alter table public.community_feedback enable row level security;

drop policy if exists "feedback_insert_own" on public.community_feedback;
create policy "feedback_insert_own"
  on public.community_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "feedback_read_own_or_staff" on public.community_feedback;
create policy "feedback_read_own_or_staff"
  on public.community_feedback
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role,'user')) in ('admin','administrator','moderator')
    )
  );

drop policy if exists "feedback_update_staff" on public.community_feedback;
create policy "feedback_update_staff"
  on public.community_feedback
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role,'user')) in ('admin','administrator','moderator')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role,'user')) in ('admin','administrator','moderator')
    )
  );

grant select, insert, update on public.community_feedback to authenticated;
