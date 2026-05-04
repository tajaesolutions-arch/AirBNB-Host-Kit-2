-- Expand supported profile roles and safely normalize unknown roles.
update public.profiles
set role = 'host'
where role is null
   or role not in ('admin', 'host', 'property_manager', 'cleaner', 'owner');

alter table public.profiles alter column role set default 'host';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'host', 'property_manager', 'cleaner', 'owner'));
