-- Property memberships foundation migration
create table if not exists public.property_memberships (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid not null references auth.users(id) on delete cascade,
  property_record_id uuid references public.properties(id) on delete cascade,
  property_id text not null,
  access_role text not null check (access_role in ('property_manager', 'cleaner', 'owner')),
  can_view_financials boolean default false,
  can_edit_operations boolean default false,
  can_approve_maintenance boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists property_memberships_member_user_id_idx
  on public.property_memberships (member_user_id);

create index if not exists property_memberships_host_user_id_idx
  on public.property_memberships (host_user_id);

create index if not exists property_memberships_property_id_idx
  on public.property_memberships (property_id);

create index if not exists property_memberships_access_role_idx
  on public.property_memberships (access_role);

alter table public.property_memberships enable row level security;

-- Hosts can view/manage memberships they own.
drop policy if exists "Hosts can view their memberships" on public.property_memberships;
create policy "Hosts can view their memberships"
  on public.property_memberships
  for select
  using (host_user_id = auth.uid());

drop policy if exists "Hosts can insert their memberships" on public.property_memberships;
create policy "Hosts can insert their memberships"
  on public.property_memberships
  for insert
  with check (host_user_id = auth.uid());

drop policy if exists "Hosts can update their memberships" on public.property_memberships;
create policy "Hosts can update their memberships"
  on public.property_memberships
  for update
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

drop policy if exists "Hosts can delete their memberships" on public.property_memberships;
create policy "Hosts can delete their memberships"
  on public.property_memberships
  for delete
  using (host_user_id = auth.uid());

-- Members can view their own active memberships.
drop policy if exists "Members can view active memberships" on public.property_memberships;
create policy "Members can view active memberships"
  on public.property_memberships
  for select
  using (member_user_id = auth.uid() and active = true);

-- Admin access note:
-- Service role bypasses RLS in Supabase. If admin users need table access via anon/authenticated
-- JWTs, add explicit admin policies based on a trusted admin claim or role table.
