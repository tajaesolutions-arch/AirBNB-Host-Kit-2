-- Host Kit SaaS foundation (safe/idempotent)
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  default_currency text not null default 'USD',
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','host','property_manager','owner','cleaner','maintenance')),
  account_status text not null default 'pending' check (account_status in ('pending','approved','suspended','archived')),
  invited_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  suspended_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.profiles add column if not exists default_workspace_id uuid references public.workspaces(id);
alter table public.profiles add column if not exists global_status text not null default 'active';

create table if not exists public.property_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assignment_role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  record_type text not null,
  record_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ensure workspace_id columns exist on core tables.
alter table public.properties add column if not exists workspace_id uuid references public.workspaces(id);
alter table public.bookings add column if not exists workspace_id uuid references public.workspaces(id);
alter table public.cleaning_tasks add column if not exists workspace_id uuid references public.workspaces(id);
alter table public.maintenance_work_orders add column if not exists workspace_id uuid references public.workspaces(id);

-- RLS scaffold (conservative): approved members only.
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists workspace_read_approved on public.workspaces;
create policy workspace_read_approved on public.workspaces for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.account_status = 'approved'
  )
);

-- TODO: Add table-by-table scoped policies for owner/cleaner/maintenance assignment-level read filters.
-- TODO: Add trigger-based audit logging for role/status and financial field updates.
-- TODO: Connect pending-member notification email service if SendGrid/Resend provider is configured.
