-- ============================================================
-- AirBNB Host Kit — Supabase Schema for international short-term rental operations
-- Run this in Supabase SQL Editor before deploying the SaaS app.
-- ============================================================

create extension if not exists "pgcrypto";

-- Updated timestamp helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  business_name text default 'Your Hospitality Co.',
  host_name text default 'Your Host Name',
  phone text,
  default_currency text default 'JMD',
  default_tax_reserve_percentage numeric default 0.15,
  default_management_fee_percentage numeric default 0.15,
  account_status text not null default 'pending',
  role text not null default 'host',
  approved_at timestamptz,
  suspended_at timestamptz,
  rejected_at timestamptz,
  approved_by uuid references auth.users(id),
  rejection_reason text,
  onboarding_completed boolean not null default false,
  onboarding_choice text,
  onboarded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();


alter table public.profiles add column if not exists account_status text not null default 'pending';
alter table public.profiles add column if not exists role text not null default 'host';
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists approved_by uuid references auth.users(id);
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists rejected_at timestamptz;
alter table public.profiles add column if not exists rejection_reason text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check (account_status in ('pending', 'approved', 'rejected', 'suspended'));

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'host', 'property_manager', 'cleaner', 'owner'));

create or replace function public.is_approved_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'approved'
  );
$$;

-- ============================================================
-- User-owned data tables
-- IDs such as property_id, booking_id, guest_id are app-facing IDs.
-- user_id is used for tenant isolation through Row Level Security.
-- ============================================================

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null,
  property_name text not null,
  parish_town text,
  property_type text,
  bedrooms numeric,
  bathrooms numeric,
  max_guests numeric,
  owner_name text,
  owner_email text,
  default_nightly_rate numeric default 0,
  default_cleaning_fee numeric default 0,
  default_checkin_time text,
  default_checkout_time text,
  wifi_name text,
  wifi_password text,
  address text,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, property_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id text not null,
  property_id text,
  guest_id text,
  guest_name text,
  platform text,
  checkin_date date,
  checkout_date date,
  nightly_rate numeric default 0,
  cleaning_fee numeric default 0,
  extra_fees numeric default 0,
  discounts numeric default 0,
  payment_status text,
  booking_status text,
  source_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, booking_id)
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_id text not null,
  guest_name text not null,
  country text,
  email text,
  phone text,
  review_left boolean default false,
  direct_followup_sent boolean default false,
  preferences text,
  notes text,
  last_contacted_date date,
  next_followup_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, guest_id)
);

create table if not exists public.cleaning_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cleaning_id text not null,
  property_id text,
  booking_id text,
  checkout_date date,
  next_checkin_date date,
  cleaner_name text,
  cleaning_status text,
  linen_status text,
  damage_check text,
  supplies_restocked boolean default false,
  photos_uploaded boolean default false,
  time_completed text,
  cleaning_cost numeric default 0,
  notes text,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, cleaning_id)
);

create table if not exists public.maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id text not null,
  property_id text,
  issue_title text not null,
  property_area text,
  priority text,
  reported_by text,
  vendor text,
  estimated_cost numeric default 0,
  actual_cost numeric default 0,
  status text,
  reported_date date,
  completion_date date,
  photo_or_link text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, issue_id)
);

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supply_id text not null,
  property_id text,
  item_name text not null,
  category text,
  current_quantity numeric default 0,
  unit text,
  reorder_level numeric default 0,
  unit_cost numeric default 0,
  supplier text,
  last_restocked_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, supply_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_id text not null,
  property_id text,
  expense_date date,
  category text,
  vendor text,
  description text,
  amount numeric default 0,
  reimbursable boolean default false,
  paid_by text,
  receipt_link text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, expense_id)
);

create table if not exists public.direct_booking_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id text not null,
  lead_name text not null,
  source text,
  phone text,
  email text,
  property_interested text,
  dates_requested text,
  number_of_guests numeric,
  budget numeric default 0,
  quote_sent boolean default false,
  followup_date date,
  status text,
  message_template_used text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lead_id)
);

create table if not exists public.owner_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id text not null,
  property_id text,
  report_month text,
  report_data jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, report_id)
);

create table if not exists public.tax_reserve_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_record_id text not null,
  property_id text,
  month text,
  gross_rental_revenue numeric default 0,
  platform_revenue numeric default 0,
  direct_booking_revenue numeric default 0,
  tax_reserve_percentage numeric default 0.15,
  estimated_reserve_amount numeric default 0,
  amount_actually_set_aside numeric default 0,
  accountant_handoff_status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, tax_record_id)
);

-- ============================================================
-- Safe additive migrations for app/schema compatibility
-- ============================================================
alter table public.cleaning_tasks
add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table public.direct_booking_leads
add column if not exists full_name text;

alter table public.direct_booking_leads
add column if not exists property_id text;

alter table public.properties
add column if not exists country text;

alter table public.properties
add column if not exists timezone text;

alter table public.bookings
add column if not exists deposit_status text;

alter table public.bookings
add column if not exists damage_status text;

alter table public.bookings
add column if not exists refund_status text;

alter table public.bookings
add column if not exists review_followup_status text;

alter table public.guests
add column if not exists tags jsonb not null default '[]'::jsonb;

alter table public.maintenance_issues
add column if not exists maintenance_id text;

alter table public.maintenance_issues
add column if not exists approval_status text;

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Enable RLS and policies on all user-owned tables
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'properties', 'bookings', 'guests', 'cleaning_tasks', 'maintenance_issues',
    'supplies', 'expenses', 'direct_booking_leads', 'owner_reports',
    'tax_reserve_records', 'settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Users can view own records" on public.%I', t);
    execute format('create policy "Users can view own records" on public.%I for select using (auth.uid() = user_id and public.is_approved_user())', t);

    execute format('drop policy if exists "Users can insert own records" on public.%I', t);
    execute format('create policy "Users can insert own records" on public.%I for insert with check (auth.uid() = user_id and public.is_approved_user())', t);

    execute format('drop policy if exists "Users can update own records" on public.%I', t);
    execute format('create policy "Users can update own records" on public.%I for update using (auth.uid() = user_id and public.is_approved_user()) with check (auth.uid() = user_id and public.is_approved_user())', t);

    execute format('drop policy if exists "Users can delete own records" on public.%I', t);
    execute format('create policy "Users can delete own records" on public.%I for delete using (auth.uid() = user_id and public.is_approved_user())', t);
  end loop;
end $$;

-- Updated-at triggers
do $$
declare
  t text;
begin
  foreach t in array array[
    'properties', 'bookings', 'guests', 'cleaning_tasks', 'maintenance_issues',
    'supplies', 'expenses', 'direct_booking_leads', 'owner_reports',
    'tax_reserve_records', 'settings'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

-- ============================================================
-- Non-destructive upgrades for global operations + calendar + deposits/reviews
-- ============================================================
alter table if exists public.profiles add column if not exists country text;
alter table if exists public.profiles add column if not exists timezone text;
alter table if exists public.profiles add column if not exists date_format text;
alter table if exists public.profiles add column if not exists tax_label text;
alter table if exists public.profiles add column if not exists business_type text;
alter table if exists public.profiles add column if not exists property_type text;
alter table if exists public.profiles add column if not exists language text;
alter table if exists public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table if exists public.profiles add column if not exists onboarding_choice text;
alter table if exists public.profiles add column if not exists onboarded_at timestamptz;

alter table public.profiles
drop constraint if exists profiles_onboarding_choice_check;

alter table public.profiles
add constraint profiles_onboarding_choice_check
check (
  onboarding_choice is null
  or onboarding_choice in ('fresh', 'sample')
);

alter table if exists public.properties add column if not exists airbnb_ical_url text;
alter table if exists public.properties add column if not exists vrbo_ical_url text;
alter table if exists public.properties add column if not exists booking_ical_url text;
alter table if exists public.properties add column if not exists last_calendar_sync_at timestamptz;

alter table if exists public.bookings add column if not exists security_deposit_required boolean default false;
alter table if exists public.bookings add column if not exists security_deposit_amount numeric default 0;
alter table if exists public.bookings add column if not exists deposit_paid_amount numeric default 0;
alter table if exists public.bookings add column if not exists deposit_due_date date;
alter table if exists public.bookings add column if not exists deposit_status text;
alter table if exists public.bookings add column if not exists damage_status text;
alter table if exists public.bookings add column if not exists damage_description text;
alter table if exists public.bookings add column if not exists damage_photo_or_link text;
alter table if exists public.bookings add column if not exists amount_deducted numeric default 0;
alter table if exists public.bookings add column if not exists refund_due_date date;
alter table if exists public.bookings add column if not exists refund_status text;
alter table if exists public.bookings add column if not exists review_request_sent boolean default false;
alter table if exists public.bookings add column if not exists review_request_date date;
alter table if exists public.bookings add column if not exists review_received boolean default false;
alter table if exists public.bookings add column if not exists review_score numeric;
alter table if exists public.bookings add column if not exists review_public_text text;
alter table if exists public.bookings add column if not exists host_response text;
alter table if exists public.bookings add column if not exists review_followup_status text;

alter table if exists public.maintenance_issues add column if not exists owner_approval_required boolean default false;
alter table if exists public.maintenance_issues add column if not exists approval_status text;
alter table if exists public.maintenance_issues add column if not exists approval_requested_date date;
alter table if exists public.maintenance_issues add column if not exists approval_response_date date;
alter table if exists public.maintenance_issues add column if not exists owner_approval_notes text;
alter table if exists public.maintenance_issues add column if not exists vendor_quote_link text;
alter table if exists public.maintenance_issues add column if not exists before_photo_link text;
alter table if exists public.maintenance_issues add column if not exists after_photo_link text;

alter table public.cleaning_tasks
add column if not exists checklist jsonb not null default '[]'::jsonb;

-- ============================================================
-- Auto-create profile for each new auth user
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    business_name,
    host_name,
    default_currency,
    default_tax_reserve_percentage,
    default_management_fee_percentage,
    onboarding_completed
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'business_name', 'Your Hospitality Co.'),
    coalesce(new.raw_user_meta_data ->> 'host_name', 'Your Host Name'),
    'JMD',
    0.15,
    0.15,
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        business_name = coalesce(excluded.business_name, public.profiles.business_name),
        host_name = coalesce(excluded.host_name, public.profiles.host_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
