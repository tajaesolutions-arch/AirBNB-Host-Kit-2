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

create or replace function public.current_user_role_for_org(org_id uuid) returns text language sql stable as $$
  select role from public.organization_members
  where organization_id = org_id
    and status='active'
    and (user_id = auth.uid() or lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  limit 1
$$;

create or replace function public.current_user_can_access_property(org_id uuid, property_key text) returns boolean language sql stable as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.status='active'
      and (om.user_id = auth.uid() or lower(om.email)=lower(coalesce(auth.jwt()->>'email','')))
      and om.role = 'host_admin'
  )
  or exists (
    select 1
    from public.property_access pa
    where pa.organization_id = org_id
      and pa.property_id = property_key
      and (pa.user_id = auth.uid() or lower(pa.email)=lower(coalesce(auth.jwt()->>'email','')))
  )
$$;

create or replace function public.current_user_can_update_cleaning_task(org_id uuid, property_key text) returns boolean language sql stable as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = org_id and om.status='active'
      and (om.user_id = auth.uid() or lower(om.email)=lower(coalesce(auth.jwt()->>'email','')))
      and om.role in ('host_admin','property_manager')
  ) or exists (
    select 1 from public.property_access pa
    where pa.organization_id = org_id and pa.property_id = property_key
      and (pa.user_id = auth.uid() or lower(pa.email)=lower(coalesce(auth.jwt()->>'email','')))
      and (pa.role in ('property_manager','cleaner') and coalesce(pa.can_update_cleaning,false)=true)
  )
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.property_access enable row level security;
alter table public.invitations enable row level security;

drop policy if exists org_admin_all_orgs on public.organizations;
create policy org_admin_all_orgs on public.organizations for all
  using (owner_user_id = auth.uid() or public.current_user_role_for_org(id) = 'host_admin')
  with check (owner_user_id = auth.uid() or public.current_user_role_for_org(id) = 'host_admin');

drop policy if exists org_members_view on public.organization_members;
create policy org_members_view on public.organization_members for select
  using (organization_id in (select public.current_org_ids()));

drop policy if exists org_members_admin_manage on public.organization_members;
create policy org_members_admin_manage on public.organization_members for all
  using (public.current_user_role_for_org(organization_id)='host_admin')
  with check (public.current_user_role_for_org(organization_id)='host_admin');

drop policy if exists property_access_view on public.property_access;
create policy property_access_view on public.property_access for select
  using (
    public.current_user_role_for_org(organization_id)='host_admin'
    or (user_id = auth.uid() or lower(email)=lower(coalesce(auth.jwt()->>'email','')))
  );
