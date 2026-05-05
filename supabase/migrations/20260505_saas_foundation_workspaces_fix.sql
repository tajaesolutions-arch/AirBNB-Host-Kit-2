-- SaaS foundation fix: ensure workspace tables and profile status columns exist
-- Matches app table names exactly: public.workspaces, public.workspace_members, public.workspace_invitations

create extension if not exists "pgcrypto";

-- 1) profiles account status + routing support columns
alter table if exists public.profiles
  add column if not exists account_status text;

alter table if exists public.profiles
  alter column account_status set default 'pending';

update public.profiles
set account_status = 'pending'
where account_status is null
   or account_status not in ('pending','approved','suspended','rejected');

alter table if exists public.profiles
  drop constraint if exists profiles_account_status_check;

alter table if exists public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('pending','approved','suspended','rejected'));

alter table if exists public.profiles
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists suspended_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists default_workspace_id uuid;

-- 2) workspaces table
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspaces_slug_key on public.workspaces(lower(slug)) where slug is not null;
create index if not exists workspaces_status_idx on public.workspaces(status);

alter table if exists public.profiles
  drop constraint if exists profiles_default_workspace_id_fkey;
alter table if exists public.profiles
  add constraint profiles_default_workspace_id_fkey
  foreign key (default_workspace_id) references public.workspaces(id) on delete set null;

-- 3) workspace_members table (exact app name)
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','host','property_manager','owner','cleaner','maintenance_crew')),
  account_status text not null default 'pending' check (account_status in ('pending','approved','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- 4) workspace_invitations table (exact app name)
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','host','property_manager','owner','cleaner','maintenance_crew')),
  status text not null default 'pending' check (status in ('pending','approved','suspended','expired','accepted','revoked')),
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email)
);

-- 5) safe indexes for workspace_id, user_id, role, status
create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists workspace_members_role_idx on public.workspace_members(role);
create index if not exists workspace_members_status_idx on public.workspace_members(account_status);

create index if not exists workspace_invitations_workspace_id_idx on public.workspace_invitations(workspace_id);
create index if not exists workspace_invitations_role_idx on public.workspace_invitations(role);
create index if not exists workspace_invitations_status_idx on public.workspace_invitations(status);
create index if not exists workspace_invitations_email_idx on public.workspace_invitations(lower(email));

create index if not exists profiles_account_status_idx on public.profiles(account_status);

-- keep updated_at current where present
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_workspaces on public.workspaces;
create trigger set_updated_at_workspaces
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_members on public.workspace_members;
create trigger set_updated_at_workspace_members
before update on public.workspace_members
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_invitations on public.workspace_invitations;
create trigger set_updated_at_workspace_invitations
before update on public.workspace_invitations
for each row execute function public.set_updated_at();

-- 6) RLS policies for workspace isolation
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;

-- helpers
create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path=public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.account_status = 'approved'
      and wm.role in ('admin','host','property_manager')
  );
$$;

-- workspaces access
 drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member on public.workspaces
for select
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.account_status = 'approved'
  )
);

drop policy if exists workspaces_insert_creator on public.workspaces;
create policy workspaces_insert_creator on public.workspaces
for insert
with check (created_by = auth.uid());

drop policy if exists workspaces_update_admin on public.workspaces;
create policy workspaces_update_admin on public.workspaces
for update
using (public.is_workspace_admin(id))
with check (public.is_workspace_admin(id));

-- workspace membership access
 drop policy if exists workspace_members_select_self_or_member on public.workspace_members;
create policy workspace_members_select_self_or_member on public.workspace_members
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = workspace_members.workspace_id
      and m.user_id = auth.uid()
      and m.account_status = 'approved'
  )
);

drop policy if exists workspace_members_insert_admin on public.workspace_members;
create policy workspace_members_insert_admin on public.workspace_members
for insert
with check (public.is_workspace_admin(workspace_id));

drop policy if exists workspace_members_update_admin on public.workspace_members;
create policy workspace_members_update_admin on public.workspace_members
for update
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

-- invitations access
 drop policy if exists workspace_invitations_select_member_or_invitee on public.workspace_invitations;
create policy workspace_invitations_select_member_or_invitee on public.workspace_invitations
for select
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_invitations.workspace_id
      and wm.user_id = auth.uid()
      and wm.account_status = 'approved'
  )
  or lower(workspace_invitations.email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
);

drop policy if exists workspace_invitations_insert_admin on public.workspace_invitations;
create policy workspace_invitations_insert_admin on public.workspace_invitations
for insert
with check (public.is_workspace_admin(workspace_id) and invited_by = auth.uid());

drop policy if exists workspace_invitations_update_admin on public.workspace_invitations;
create policy workspace_invitations_update_admin on public.workspace_invitations
for update
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));
