-- Montpellier – Silent Wish Tree
-- Run in Supabase SQL Editor (or via migrations).

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  language text not null check (language in ('fr', 'en')),
  ornament_type text not null,
  anchor_index integer not null,
  client_id text,
  is_flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now()
);

create index if not exists wishes_created_at_idx on public.wishes (created_at desc);
create index if not exists wishes_flagged_idx on public.wishes (is_flagged);
create index if not exists wishes_client_id_created_at_idx on public.wishes (client_id, created_at desc);

alter table public.wishes enable row level security;

-- Explicitly deny direct public access (writes must go through Edge Functions).
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'wishes' and policyname = 'deny_public_select'
  ) then
    create policy deny_public_select
      on public.wishes
      for select
      to anon
      using (false);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'wishes' and policyname = 'deny_public_insert'
  ) then
    create policy deny_public_insert
      on public.wishes
      for insert
      to anon
      with check (false);
  end if;
end $$;


