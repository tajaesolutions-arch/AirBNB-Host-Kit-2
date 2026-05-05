create extension if not exists pgcrypto;

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'pending',
  approved_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members add column if not exists status text not null default 'pending';
alter table public.workspace_members add column if not exists approved_at timestamptz null;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workspace_members' AND column_name='account_status'
  ) THEN
    EXECUTE 'UPDATE public.workspace_members SET status = COALESCE(status, account_status, ''pending'') WHERE status IS NULL';
  END IF;
END$$;
