-- Admin Users & Access management hardening

alter table if exists public.profiles
  add column if not exists requested_role text;

alter table if exists public.profiles
  add column if not exists approved_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.profiles alter column role set default 'host';
alter table if exists public.profiles alter column account_status set default 'pending';

create index if not exists profiles_account_status_idx on public.profiles(account_status);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_requested_role_idx on public.profiles(requested_role);

alter table if exists public.property_memberships
  add column if not exists property_record_id uuid references public.properties(id) on delete cascade;

create index if not exists property_memberships_host_user_id_idx on public.property_memberships(host_user_id);
create index if not exists property_memberships_member_user_id_idx on public.property_memberships(member_user_id);
create index if not exists property_memberships_property_record_id_idx on public.property_memberships(property_record_id);
create index if not exists property_memberships_property_id_idx on public.property_memberships(property_id);
create index if not exists property_memberships_active_idx on public.property_memberships(active);
create index if not exists property_memberships_access_role_idx on public.property_memberships(access_role);

create unique index if not exists property_memberships_unique_active_role_idx
  on public.property_memberships(member_user_id, property_record_id, access_role)
  where active = true;

do $$
begin
  if exists (select 1 from public.profiles where account_status is not null and account_status not in ('pending','approved','suspended')) then
    raise notice 'Skipping profiles_account_status_admin_check because incompatible data exists';
  else
    alter table public.profiles drop constraint if exists profiles_account_status_admin_check;
    alter table public.profiles add constraint profiles_account_status_admin_check check (account_status in ('pending','approved','suspended'));
  end if;

  if exists (select 1 from public.profiles where role is not null and role not in ('host','admin','property_manager','cleaner','owner')) then
    raise notice 'Skipping profiles_role_admin_check because incompatible data exists';
  else
    alter table public.profiles drop constraint if exists profiles_role_admin_check;
    alter table public.profiles add constraint profiles_role_admin_check check (role in ('host','admin','property_manager','cleaner','owner'));
  end if;

  if exists (select 1 from public.profiles where requested_role is not null and requested_role not in ('host','admin','property_manager','cleaner','owner')) then
    raise notice 'Skipping profiles_requested_role_admin_check because incompatible data exists';
  else
    alter table public.profiles drop constraint if exists profiles_requested_role_admin_check;
    alter table public.profiles add constraint profiles_requested_role_admin_check check (requested_role in ('host','admin','property_manager','cleaner','owner'));
  end if;
end $$;

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
      and p.role in ('admin', 'host')
  );
$$;

create or replace function public.admin_list_users()
returns table(user_id uuid, email text, role text, requested_role text, account_status text, approved_at timestamptz, suspended_at timestamptz, created_at timestamptz, membership_count bigint, assigned_roles text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.email, p.role, p.requested_role, p.account_status, p.approved_at, p.suspended_at, p.created_at,
         count(pm.id) filter (where pm.active = true) as membership_count,
         coalesce(string_agg(distinct pm.access_role, ', ' order by pm.access_role), '') as assigned_roles
  from public.profiles p
  left join public.property_memberships pm on pm.member_user_id = p.id
  where public.is_admin_user()
  group by p.id;
$$;

create or replace function public.admin_approve_user(target_user_id uuid, approved_role text)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if approved_role not in ('host','property_manager','cleaner','owner','admin') then raise exception 'invalid role'; end if;
  update public.profiles set account_status='approved', role=approved_role, approved_at=now(), suspended_at=null, updated_at=now() where id=target_user_id returning * into updated_profile;
  return updated_profile;
end $$;

create or replace function public.admin_suspend_user(target_user_id uuid)
returns public.profiles
language plpgsql security definer set search_path = public
as $$ declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  update public.profiles set account_status='suspended', suspended_at=now(), updated_at=now() where id=target_user_id returning * into updated_profile;
  update public.property_memberships set active=false, updated_at=now() where member_user_id=target_user_id and active=true;
  return updated_profile;
end $$;

create or replace function public.admin_restore_user(target_user_id uuid)
returns public.profiles
language plpgsql security definer set search_path = public
as $$ declare updated_profile public.profiles;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  update public.profiles set account_status='approved', suspended_at=null, updated_at=now() where id=target_user_id returning * into updated_profile;
  return updated_profile;
end $$;

create or replace function public.admin_assign_property_membership(target_user_id uuid, target_property_record_id uuid, target_access_role text, target_can_view_financials boolean, target_can_edit_operations boolean, target_can_approve_maintenance boolean)
returns public.property_memberships
language plpgsql security definer set search_path = public
as $$
declare me public.profiles; prop record; updated_row public.property_memberships;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  if target_access_role not in ('host','property_manager','cleaner','owner') then raise exception 'invalid access role'; end if;
  select * into me from public.profiles where id=auth.uid();
  select id, user_id, property_id into prop from public.properties where id=target_property_record_id;
  if prop.id is null then raise exception 'property not found'; end if;
  if me.role <> 'admin' and prop.user_id <> auth.uid() then raise exception 'not allowed to manage this property'; end if;

  insert into public.property_memberships(host_user_id, member_user_id, property_record_id, property_id, access_role, can_view_financials, can_edit_operations, can_approve_maintenance, active, updated_at)
  values(prop.user_id, target_user_id, prop.id, prop.property_id, target_access_role, coalesce(target_can_view_financials,false), coalesce(target_can_edit_operations,false), coalesce(target_can_approve_maintenance,false), true, now())
  on conflict (member_user_id, property_record_id, access_role) where active = true
  do update set can_view_financials=excluded.can_view_financials, can_edit_operations=excluded.can_edit_operations, can_approve_maintenance=excluded.can_approve_maintenance, active=true, updated_at=now()
  returning * into updated_row;
  return updated_row;
end $$;

create or replace function public.admin_update_property_membership(membership_id uuid, target_access_role text, target_can_view_financials boolean, target_can_edit_operations boolean, target_can_approve_maintenance boolean, target_active boolean)
returns public.property_memberships
language plpgsql security definer set search_path = public
as $$ declare me public.profiles; updated_row public.property_memberships;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  select * into me from public.profiles where id=auth.uid();
  if me.role <> 'admin' and exists(select 1 from public.property_memberships pm where pm.id=membership_id and pm.host_user_id<>auth.uid()) then raise exception 'not allowed'; end if;
  update public.property_memberships set access_role=target_access_role, can_view_financials=coalesce(target_can_view_financials,false), can_edit_operations=coalesce(target_can_edit_operations,false), can_approve_maintenance=coalesce(target_can_approve_maintenance,false), active=coalesce(target_active,true), updated_at=now() where id=membership_id returning * into updated_row;
  return updated_row;
end $$;

create or replace function public.admin_delete_or_deactivate_membership(membership_id uuid)
returns public.property_memberships
language plpgsql security definer set search_path = public
as $$ declare me public.profiles; updated_row public.property_memberships;
begin
  if not public.is_admin_user() then raise exception 'not authorized'; end if;
  select * into me from public.profiles where id=auth.uid();
  if me.role <> 'admin' and exists(select 1 from public.property_memberships pm where pm.id=membership_id and pm.host_user_id<>auth.uid()) then raise exception 'not allowed'; end if;
  update public.property_memberships set active=false, updated_at=now() where id=membership_id returning * into updated_row;
  return updated_row;
end $$;

create or replace function public.admin_list_memberships()
returns table(id uuid, host_user_id uuid, member_user_id uuid, member_email text, property_record_id uuid, property_id text, property_name text, access_role text, can_view_financials boolean, can_edit_operations boolean, can_approve_maintenance boolean, active boolean, created_at timestamptz)
language sql security definer set search_path = public
as $$
  select pm.id, pm.host_user_id, pm.member_user_id, pr.email, pm.property_record_id, pm.property_id, coalesce(p.name, p.property_id), pm.access_role, pm.can_view_financials, pm.can_edit_operations, pm.can_approve_maintenance, pm.active, pm.created_at
  from public.property_memberships pm
  join public.profiles pr on pr.id = pm.member_user_id
  left join public.properties p on p.id = pm.property_record_id
  where public.is_admin_user() and (
    exists(select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
    or pm.host_user_id = auth.uid()
  );
$$;

alter table if exists public.profiles enable row level security;
alter table if exists public.property_memberships enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id or public.is_admin_user());

revoke insert, update, delete on public.property_memberships from authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_approve_user(uuid,text) to authenticated;
grant execute on function public.admin_suspend_user(uuid) to authenticated;
grant execute on function public.admin_restore_user(uuid) to authenticated;
grant execute on function public.admin_assign_property_membership(uuid,uuid,text,boolean,boolean,boolean) to authenticated;
grant execute on function public.admin_update_property_membership(uuid,text,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.admin_delete_or_deactivate_membership(uuid) to authenticated;
grant execute on function public.admin_list_memberships() to authenticated;
