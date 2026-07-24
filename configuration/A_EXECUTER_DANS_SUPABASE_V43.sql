-- MHUR NEXUS V4.3 — CORRECTION PUBLICATION DES MODS
-- Corrige l'erreur : community_mods_description_check
-- À exécuter dans Supabase > SQL Editor > New query > Run.
-- Le script est réexécutable.

begin;

alter table public.community_mods
  drop constraint if exists community_mods_description_check;

alter table public.community_mods
  add constraint community_mods_description_check
  check (description is null or char_length(description) <= 3000);

commit;

notify pgrst, 'reload schema';
