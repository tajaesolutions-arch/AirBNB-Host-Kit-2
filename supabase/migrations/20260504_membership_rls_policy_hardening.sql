-- Membership-aware RLS hardening for host + assigned member access.
-- Idempotent policy refresh.

alter table if exists public.property_memberships enable row level security;

create or replace function public.is_host_for_membership(target_host_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() = target_host_user_id;
$$;

create or replace function public.member_has_property_access(target_host_user_id uuid, target_property_id text, require_financial boolean default false, require_ops boolean default false, require_approval boolean default false)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.property_memberships pm
    where pm.host_user_id = target_host_user_id
      and pm.member_user_id = auth.uid()
      and pm.active = true
      and pm.property_id = target_property_id
      and (not require_financial or pm.can_view_financials = true)
      and (not require_ops or pm.can_edit_operations = true)
      and (not require_approval or pm.can_approve_maintenance = true)
  );
$$;

drop policy if exists "Members can view own memberships" on public.property_memberships;
create policy "Members can view own memberships"
on public.property_memberships
for select
using (
  public.is_approved_user()
  and (
    auth.uid() = member_user_id
    or auth.uid() = host_user_id
  )
);

drop policy if exists "Hosts manage memberships" on public.property_memberships;
create policy "Hosts manage memberships"
on public.property_memberships
for all
using (public.is_approved_user() and auth.uid() = host_user_id)
with check (public.is_approved_user() and auth.uid() = host_user_id);

-- Ensure settings remain host-only (global workspace config).
drop policy if exists "Users can view own records" on public.settings;
create policy "Users can view own records"
on public.settings
for select
using (public.is_approved_user() and auth.uid() = user_id);

drop policy if exists "Users can insert own records" on public.settings;
create policy "Users can insert own records"
on public.settings
for insert
with check (public.is_approved_user() and auth.uid() = user_id);

drop policy if exists "Users can update own records" on public.settings;
create policy "Users can update own records"
on public.settings
for update
using (public.is_approved_user() and auth.uid() = user_id)
with check (public.is_approved_user() and auth.uid() = user_id);

drop policy if exists "Users can delete own records" on public.settings;
create policy "Users can delete own records"
on public.settings
for delete
using (public.is_approved_user() and auth.uid() = user_id);
