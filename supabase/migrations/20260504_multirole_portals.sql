-- Multi-role SaaS migration
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('host_admin','property_manager','cleaner','owner')),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, email)
);
create table if not exists public.property_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  property_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('property_manager','cleaner','owner')),
  can_view_financials boolean default false,
  can_view_owner_report boolean default false,
  can_view_cleaning_cost boolean default false,
  can_update_cleaning boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, property_id, email, role)
);
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade,
  invited_email text not null, invited_role text not null check (invited_role in ('property_manager','cleaner','owner')),
  property_ids text[] default '{}', token uuid default gen_random_uuid(),
  status text default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid references auth.users(id), expires_at timestamptz default now() + interval '14 days', created_at timestamptz default now()
);
alter table if exists public.cleaning_tasks add column if not exists assigned_cleaner_user_id uuid references auth.users(id);
alter table if exists public.cleaning_tasks add column if not exists assigned_cleaner_email text;
alter table if exists public.cleaning_tasks add column if not exists cleaner_instructions text;
alter table if exists public.cleaning_tasks add column if not exists checklist_completed boolean default false;
alter table if exists public.cleaning_tasks add column if not exists cleaner_started_at timestamptz;
alter table if exists public.cleaning_tasks add column if not exists cleaner_completed_at timestamptz;
alter table if exists public.cleaning_tasks add column if not exists completion_photo_url text;
alter table if exists public.cleaning_tasks add column if not exists owner_visible_notes text;
alter table if exists public.cleaning_tasks add column if not exists task_sent_at timestamptz;
alter table if exists public.cleaning_tasks add column if not exists task_sent_to text;
alter table if exists public.cleaning_tasks add column if not exists task_delivery_method text check (task_delivery_method in ('copy_whatsapp','copy_email','manual','edge_email'));

create or replace function public.current_org_ids() returns setof uuid language sql stable as $$
  select organization_id from public.organization_members where (user_id = auth.uid() or lower(email)=lower(coalesce(auth.jwt()->>'email',''))) and status='active'
$$;
