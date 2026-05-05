-- Launch hardening: roles, statuses, admin RPC, and profile safeguards.
-- NOTE: First admin bootstrap (run once in Supabase SQL Editor after founder signup):
-- update public.profiles
-- set
--   account_status = 'approved',
--   role = 'admin',
--   approved_at = now()
-- where email = 'YOUR_ADMIN_EMAIL_HERE';

alter table public.profiles add column if not exists requested_role text;
alter table public.profiles add column if not exists approved_by uuid references auth.users(id);
alter table public.profiles add column if not exists rejected_at timestamptz;
alter table public.profiles add column if not exists rejection_reason text;

update public.profiles
set role = 'host'
where role is null or role not in ('admin','host','property_manager','owner','cleaner','maintenance');

update public.profiles
set requested_role = null
where requested_role is not null and requested_role not in ('host','property_manager','owner','cleaner','maintenance');

update public.profiles
set account_status = 'pending'
where account_status is null or account_status not in ('pending','approved','suspended','rejected');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','host','property_manager','owner','cleaner','maintenance'));
alter table public.profiles drop constraint if exists profiles_requested_role_check;
alter table public.profiles add constraint profiles_requested_role_check check (requested_role is null or requested_role in ('host','property_manager','owner','cleaner','maintenance'));
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check (account_status in ('pending','approved','suspended','rejected'));

update public.property_memberships
set access_role = 'property_manager'
where access_role is null or access_role not in ('property_manager','owner','cleaner','maintenance');

alter table public.property_memberships drop constraint if exists property_memberships_access_role_check;
alter table public.property_memberships add constraint property_memberships_access_role_check check (access_role in ('property_manager','owner','cleaner','maintenance'));

create unique index if not exists property_memberships_unique_active_role_idx
  on public.property_memberships(member_user_id, property_record_id, access_role)
  where active = true;

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'approved'
      and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare requested text;
begin
  requested := lower(coalesce(new.raw_user_meta_data->>'requested_role', new.raw_user_meta_data->>'role', ''));
  if requested not in ('host','property_manager','owner','cleaner','maintenance') then
    requested := 'host';
  end if;

  insert into public.profiles (
    id, email, host_name, business_name, phone,
    role, requested_role, account_status,
    onboarding_completed, onboarding_choice, onboarded_at,
    approved_at, approved_by, suspended_at, rejected_at, rejection_reason,
    created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'host_name', 'Your Host Name'),
    coalesce(new.raw_user_meta_data->>'business_name', 'Your Hospitality Co.'),
    new.raw_user_meta_data->>'phone',
    requested,
    requested,
    'pending',
    false,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    now(),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      host_name = coalesce(public.profiles.host_name, excluded.host_name),
      business_name = coalesce(public.profiles.business_name, excluded.business_name),
      updated_at = now();

  return new;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin_user());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
for insert with check (
  auth.uid() = id
  and account_status = 'pending'
  and role in ('host','property_manager','owner','cleaner','maintenance')
  and role <> 'admin'
  and (requested_role is null or requested_role in ('host','property_manager','owner','cleaner','maintenance'))
  and approved_at is null and approved_by is null and suspended_at is null and rejected_at is null and rejection_reason is null
);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and coalesce(requested_role,'') = coalesce((select p.requested_role from public.profiles p where p.id = auth.uid()),'')
  and account_status = (select p.account_status from public.profiles p where p.id = auth.uid())
  and approved_at is not distinct from (select p.approved_at from public.profiles p where p.id = auth.uid())
  and approved_by is not distinct from (select p.approved_by from public.profiles p where p.id = auth.uid())
  and suspended_at is not distinct from (select p.suspended_at from public.profiles p where p.id = auth.uid())
  and rejected_at is not distinct from (select p.rejected_at from public.profiles p where p.id = auth.uid())
  and rejection_reason is not distinct from (select p.rejection_reason from public.profiles p where p.id = auth.uid())
);

create or replace function public.admin_list_users()
returns table(user_id uuid, email text, host_name text, business_name text, role text, requested_role text, account_status text, approved_at timestamptz, approved_by uuid, suspended_at timestamptz, rejected_at timestamptz, rejection_reason text, created_at timestamptz, membership_count bigint, assigned_roles text)
language sql security definer set search_path = public
as $$
  select p.id, p.email, p.host_name, p.business_name, p.role, p.requested_role, p.account_status,
         p.approved_at, p.approved_by, p.suspended_at, p.rejected_at, p.rejection_reason, p.created_at,
         count(pm.id) filter (where pm.active = true),
         coalesce(string_agg(distinct pm.access_role, ', ' order by pm.access_role), '')
  from public.profiles p
  left join public.property_memberships pm on pm.member_user_id = p.id
  where public.is_admin_user()
  group by p.id;
$$;

create or replace function public.admin_approve_user(target_user_id uuid, approved_role text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if approved_role not in ('admin','host','property_manager','owner','cleaner','maintenance') then raise exception 'invalid role'; end if;
  if target_user_id = auth.uid() then raise exception 'cannot approve self'; end if;
  update public.profiles
  set account_status='approved', role=approved_role, approved_at=now(), approved_by=auth.uid(),
      suspended_at=null, rejected_at=null, rejection_reason=null, updated_at=now()
  where id=target_user_id
  returning * into updated_profile;
  return updated_profile;
end $$;

create or replace function public.admin_suspend_user(target_user_id uuid)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if target_user_id = auth.uid() then raise exception 'cannot suspend self'; end if;
  update public.profiles set account_status='suspended', suspended_at=now(), updated_at=now() where id=target_user_id returning * into updated_profile;
  update public.property_memberships set active=false, updated_at=now() where member_user_id=target_user_id and active=true;
  return updated_profile;
end $$;

create or replace function public.admin_reject_user(target_user_id uuid, reason text default null)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if target_user_id = auth.uid() then raise exception 'cannot reject self'; end if;
  update public.profiles set account_status='rejected', rejected_at=now(), rejection_reason=reason, updated_at=now() where id=target_user_id returning * into updated_profile;
  return updated_profile;
end $$;

create or replace function public.admin_restore_user(target_user_id uuid)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if target_user_id = auth.uid() then raise exception 'cannot restore self'; end if;
  update public.profiles set account_status='approved', suspended_at=null, rejected_at=null, rejection_reason=null, updated_at=now() where id=target_user_id returning * into updated_profile;
  return updated_profile;
end $$;

create or replace function public.admin_update_user_role(target_user_id uuid, next_role text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if next_role not in ('admin','host','property_manager','owner','cleaner','maintenance') then raise exception 'invalid role'; end if;
  if target_user_id = auth.uid() and next_role <> 'admin' then raise exception 'cannot remove your own admin role'; end if;
  update public.profiles set role=next_role, updated_at=now() where id=target_user_id returning * into updated_profile;
  return updated_profile;
end $$;

create or replace function public.admin_assign_property_membership(target_user_id uuid, target_property_record_id uuid, target_access_role text, target_can_view_financials boolean, target_can_edit_operations boolean, target_can_approve_maintenance boolean)
returns public.property_memberships language plpgsql security definer set search_path = public as $$
declare prop record; updated_row public.property_memberships;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if target_access_role not in ('property_manager','owner','cleaner','maintenance') then raise exception 'invalid access role'; end if;
  select p.id, p.user_id, p.property_id into prop from public.properties p where p.id=target_property_record_id;
  if prop.id is null then raise exception 'property not found'; end if;

  insert into public.property_memberships(host_user_id, member_user_id, property_record_id, property_id, access_role, can_view_financials, can_edit_operations, can_approve_maintenance, active, updated_at)
  values(prop.user_id, target_user_id, prop.id, prop.property_id, target_access_role, coalesce(target_can_view_financials,false), coalesce(target_can_edit_operations,false), coalesce(target_can_approve_maintenance,false), true, now())
  on conflict (member_user_id, property_record_id, access_role) where active = true
  do update set can_view_financials=excluded.can_view_financials, can_edit_operations=excluded.can_edit_operations, can_approve_maintenance=excluded.can_approve_maintenance, active=true, updated_at=now()
  returning * into updated_row;
  return updated_row;
end $$;

create or replace function public.admin_list_memberships()
returns table(id uuid, host_user_id uuid, member_user_id uuid, member_email text, property_record_id uuid, property_id text, property_name text, access_role text, can_view_financials boolean, can_edit_operations boolean, can_approve_maintenance boolean, active boolean, created_at timestamptz)
language sql security definer set search_path = public
as $$
  select pm.id, pm.host_user_id, pm.member_user_id, pr.email, pm.property_record_id, pm.property_id,
         coalesce(p.property_name, p.property_id), pm.access_role, pm.can_view_financials, pm.can_edit_operations, pm.can_approve_maintenance, pm.active, pm.created_at
  from public.property_memberships pm
  join public.profiles pr on pr.id = pm.member_user_id
  left join public.properties p on p.id = pm.property_record_id
  where public.is_admin_user();
$$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_approve_user(uuid,text) to authenticated;
grant execute on function public.admin_suspend_user(uuid) to authenticated;
grant execute on function public.admin_reject_user(uuid,text) to authenticated;
grant execute on function public.admin_restore_user(uuid) to authenticated;
grant execute on function public.admin_update_user_role(uuid,text) to authenticated;
grant execute on function public.admin_assign_property_membership(uuid,uuid,text,boolean,boolean,boolean) to authenticated;
grant execute on function public.admin_list_memberships() to authenticated;
