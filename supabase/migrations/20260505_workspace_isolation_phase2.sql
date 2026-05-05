-- Workspace isolation phase 2: enforce workspace-centric entities and role/status memberships.
create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  default_currency text not null default 'USD',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','host','property_manager','owner','cleaner','maintenance')),
  member_status text not null default 'pending' check (member_status in ('pending','approved','suspended','archived')),
  invited_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, role)
);

alter table public.properties add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.bookings add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.cleaning_tasks add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.maintenance_work_orders add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.supplies add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.notifications add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id),
  record_type text not null,
  record_id uuid,
  action text not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.user_has_workspace_access(target_workspace_id uuid)
returns boolean language sql security definer stable set search_path=public as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.member_status = 'approved'
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.audit_logs enable row level security;

create policy if not exists workspaces_select on public.workspaces for select
using (public.user_has_workspace_access(id));

create policy if not exists workspace_members_select on public.workspace_members for select
using (public.user_has_workspace_access(workspace_id));

create policy if not exists audit_logs_select on public.audit_logs for select
using (public.user_has_workspace_access(workspace_id));

create policy if not exists audit_logs_insert on public.audit_logs for insert
with check (public.user_has_workspace_access(workspace_id));
