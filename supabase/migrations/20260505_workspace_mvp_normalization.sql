-- Workspace MVP normalization (non-destructive)
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_id uuid references auth.users(id) on delete set null,
  default_currency text default 'USD',
  status text default 'active' check (status in ('active','archived','suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','property_manager','host','owner','cleaner','maintenance_crew')),
  status text not null default 'approved' check (status in ('pending','approved','suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz default now(),
  approved_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, user_id, role)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','property_manager','host','owner','cleaner','maintenance_crew')),
  invited_by uuid references auth.users(id) on delete set null,
  token text unique,
  status text default 'pending' check (status in ('pending','accepted','expired','revoked')),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists public.properties add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.bookings add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.cleaning_tasks add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.maintenance_jobs add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.maintenance_issues add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.owners add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.guests add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.guest_crm add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.supplies add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.expenses add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table if exists public.direct_booking_leads add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

alter table if exists public.properties add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table if exists public.cleaning_tasks add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table if exists public.maintenance_jobs add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table if exists public.maintenance_issues add column if not exists assigned_to uuid references auth.users(id) on delete set null;

create index if not exists idx_properties_workspace_id on public.properties(workspace_id);
create index if not exists idx_bookings_workspace_id on public.bookings(workspace_id);
create index if not exists idx_cleaning_tasks_workspace_id on public.cleaning_tasks(workspace_id);
create index if not exists idx_maintenance_jobs_workspace_id on public.maintenance_jobs(workspace_id);
create index if not exists idx_maintenance_issues_workspace_id on public.maintenance_issues(workspace_id);
create index if not exists idx_guests_workspace_id on public.guests(workspace_id);
create index if not exists idx_supplies_workspace_id on public.supplies(workspace_id);
create index if not exists idx_expenses_workspace_id on public.expenses(workspace_id);
create index if not exists idx_direct_booking_leads_workspace_id on public.direct_booking_leads(workspace_id);
