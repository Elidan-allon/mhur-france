-- MHUR NEXUS V5.0 — sanctions, durée personnalisée et recours uniques
-- Exécuter UNE FOIS dans Supabase > SQL Editor.
begin;
create extension if not exists pgcrypto;
alter table public.user_moderation add column if not exists sanction_id uuid;
alter table public.user_moderation add column if not exists banned_at timestamptz;
update public.user_moderation set sanction_id=gen_random_uuid() where sanction_id is null and (warning_message is not null or banned_permanent=true or banned_until is not null);

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
alter table public.moderation_appeals enable row level security;
drop policy if exists appeals_select_self_admin_v50 on public.moderation_appeals;
create policy appeals_select_self_admin_v50 on public.moderation_appeals for select to authenticated using(user_id=auth.uid() or public.mhur_is_site_admin());
drop policy if exists appeals_insert_self_v50 on public.moderation_appeals;
create policy appeals_insert_self_v50 on public.moderation_appeals for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.user_moderation m where m.user_id=auth.uid() and m.sanction_id=moderation_appeals.sanction_id));
drop policy if exists appeals_update_admin_v50 on public.moderation_appeals;
create policy appeals_update_admin_v50 on public.moderation_appeals for update to authenticated using(public.mhur_is_site_admin()) with check(public.mhur_is_site_admin());
drop policy if exists appeals_delete_admin_v50 on public.moderation_appeals;
create policy appeals_delete_admin_v50 on public.moderation_appeals for delete to authenticated using(public.mhur_is_site_admin());

do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  begin alter publication supabase_realtime add table public.moderation_appeals; exception when duplicate_object then null; end;
 end if;
end $$;
commit;
notify pgrst,'reload schema';
