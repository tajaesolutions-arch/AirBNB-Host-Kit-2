-- Auth/approval role foundation migration
alter table public.profiles add column if not exists role text default 'host';
alter table public.profiles add column if not exists account_status text default 'pending';
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists rejected_at timestamptz;
alter table public.profiles add column if not exists approved_by uuid;
alter table public.profiles add column if not exists rejection_reason text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_approved_by_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_approved_by_fkey
      foreign key (approved_by) references auth.users(id);
  end if;
end $$;

alter table public.profiles alter column role set default 'host';
alter table public.profiles alter column account_status set default 'pending';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'host', 'cleaner', 'owner'));

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check (account_status in ('pending', 'approved', 'suspended', 'rejected'));
