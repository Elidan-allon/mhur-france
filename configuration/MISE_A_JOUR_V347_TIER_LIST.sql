-- ============================================================
-- V347 — TIER LISTS PERSONNELLES PUBLIABLES
-- ============================================================
create table if not exists public.community_tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  title text not null default 'Tier List' check (char_length(title) between 1 and 80),
  rankings jsonb not null default '{"S":[],"A":[],"B":[],"C":[],"D":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(rankings) = 'object')
);

alter table public.community_tier_lists enable row level security;

drop policy if exists "Published tier lists are public" on public.community_tier_lists;
create policy "Published tier lists are public"
on public.community_tier_lists for select
to anon, authenticated
using (true);

drop policy if exists "Users publish own tier list" on public.community_tier_lists;
create policy "Users publish own tier list"
on public.community_tier_lists for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own tier list" on public.community_tier_lists;
create policy "Users update own tier list"
on public.community_tier_lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own tier list" on public.community_tier_lists;
create policy "Users delete own tier list"
on public.community_tier_lists for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.community_tier_lists to anon, authenticated;
grant insert, update, delete on public.community_tier_lists to authenticated;
