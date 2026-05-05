create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.current_role()
returns text language sql security definer stable set search_path=public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_approved()
returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and account_status='approved');
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and account_status='approved' and role='admin');
$$;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  country text,
  property_type text,
  bedrooms int,
  bathrooms numeric,
  max_guests int,
  owner_id uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.property_users (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_on_property text not null check (role_on_property in ('admin','host','property_manager','owner','cleaner','maintenance')),
  assignment_status text not null default 'active' check (assignment_status in ('active','inactive')),
  assignment_notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists property_users_unique_active on public.property_users(property_id,user_id,role_on_property) where assignment_status='active';

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  guest_name text, check_in date, check_out date, booking_status text, gross_revenue numeric default 0, platform text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.cleaning_tasks (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  assigned_to uuid references public.profiles(id), booking_id uuid references public.bookings(id) on delete set null,
  task_title text not null, task_status text not null default 'not_started' check (task_status in ('not_started','in_progress','completed','blocked')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date timestamptz, checklist jsonb not null default '[]'::jsonb, cleaner_notes text, completed_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.maintenance_work_orders (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  assigned_to uuid references public.profiles(id), title text not null, description text, issue_category text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  work_status text not null default 'open' check (work_status in ('open','assigned','in_progress','completed','cancelled')),
  estimated_cost numeric default 0, final_cost numeric default 0, due_date timestamptz, completed_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  requested_by uuid not null references public.profiles(id), request_title text not null, request_description text,
  priority text default 'medium', request_status text not null default 'submitted' check (request_status in ('submitted','reviewed','approved','rejected','converted_to_work_order')),
  linked_work_order_id uuid references public.maintenance_work_orders(id) on delete set null,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.owner_messages (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 sender_id uuid not null references public.profiles(id), recipient_id uuid references public.profiles(id), message_body text not null,
 message_status text not null default 'unread' check (message_status in ('unread','read','archived')), created_at timestamptz default now()
);
create table if not exists public.supplies (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete cascade, name text, qty numeric default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.revenue_records (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete cascade, amount numeric default 0, revenue_date date, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.expense_records (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete cascade, amount numeric default 0, expense_date date, category text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.activity_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), property_id uuid references public.properties(id), action_type text not null, action_description text, metadata jsonb default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text not null, body text not null, notification_type text not null, read_at timestamptz, created_at timestamptz default now());

create or replace function public.has_property_access(target_property uuid)
returns boolean language sql security definer stable set search_path=public as $$
select public.is_admin() or exists(select 1 from public.properties p where p.id=target_property and (p.created_by=auth.uid() or p.owner_id=auth.uid())) or exists(select 1 from public.property_users pu where pu.property_id=target_property and pu.user_id=auth.uid() and pu.assignment_status='active');
$$;

create or replace function public.can_create_property()
returns boolean language sql security definer stable set search_path=public as $$
select public.is_approved() and public.current_role() in ('admin','host','property_manager','owner'); $$;

alter table public.properties enable row level security;
alter table public.property_users enable row level security;
alter table public.bookings enable row level security;
alter table public.cleaning_tasks enable row level security;
alter table public.maintenance_work_orders enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.owner_messages enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

create policy if not exists properties_select on public.properties for select using (public.is_approved() and public.has_property_access(id));
create policy if not exists properties_insert on public.properties for insert with check (public.can_create_property() and created_by=auth.uid());
create policy if not exists properties_update on public.properties for update using (public.is_admin() or created_by=auth.uid() or exists(select 1 from public.property_users pu where pu.property_id=id and pu.user_id=auth.uid() and pu.assignment_status='active' and pu.role_on_property in ('admin','host','property_manager')));

create policy if not exists property_users_select on public.property_users for select using (public.has_property_access(property_id));
create policy if not exists property_users_insert on public.property_users for insert with check (public.is_admin() or exists(select 1 from public.properties p where p.id=property_id and p.created_by=auth.uid()) or exists(select 1 from public.property_users pu where pu.property_id=property_id and pu.user_id=auth.uid() and pu.assignment_status='active' and pu.role_on_property in ('admin','host','property_manager')));
create policy if not exists property_users_update on public.property_users for update using (public.is_admin() or exists(select 1 from public.properties p where p.id=property_id and p.created_by=auth.uid()));

create policy if not exists task_cleaner_select on public.cleaning_tasks for select using (public.is_admin() or assigned_to=auth.uid() or public.has_property_access(property_id));
create policy if not exists task_cleaner_update_self on public.cleaning_tasks for update using (public.is_admin() or assigned_to=auth.uid());
create policy if not exists task_insert on public.cleaning_tasks for insert with check (public.is_admin() or public.has_property_access(property_id));

create policy if not exists work_orders_select on public.maintenance_work_orders for select using (public.is_admin() or assigned_to=auth.uid() or public.has_property_access(property_id));
create policy if not exists work_orders_update on public.maintenance_work_orders for update using (public.is_admin() or assigned_to=auth.uid() or public.has_property_access(property_id));
create policy if not exists work_orders_insert on public.maintenance_work_orders for insert with check (public.is_admin() or public.has_property_access(property_id));

create policy if not exists maint_req_select on public.maintenance_requests for select using (public.is_admin() or requested_by=auth.uid() or public.has_property_access(property_id));
create policy if not exists maint_req_insert on public.maintenance_requests for insert with check (requested_by=auth.uid() and public.has_property_access(property_id));
create policy if not exists owner_msg_select on public.owner_messages for select using (public.is_admin() or sender_id=auth.uid() or recipient_id=auth.uid() or public.has_property_access(property_id));
create policy if not exists owner_msg_insert on public.owner_messages for insert with check (sender_id=auth.uid() and public.has_property_access(property_id));
create policy if not exists notifications_select on public.notifications for select using (user_id=auth.uid() or public.is_admin());

create or replace function public.log_activity(p_action_type text, p_action_description text, p_property_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path=public as $$
insert into public.activity_logs(actor_id, property_id, action_type, action_description, metadata) values (auth.uid(), p_property_id, p_action_type, p_action_description, coalesce(p_metadata,'{}'::jsonb));
$$;

create or replace function public.admin_approve_user(target_user_id uuid, approved_role text)
returns public.profiles language plpgsql security definer set search_path=public as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if approved_role not in ('admin','host','property_manager','owner','cleaner','maintenance') then raise exception 'invalid role'; end if;
  update public.profiles set account_status='approved', role=approved_role, approved_at=now(), approved_by=auth.uid(), suspended_at=null, rejected_at=null, rejection_reason=null, updated_at=now() where id=target_user_id returning * into updated_profile;
  insert into public.notifications(user_id,title,body,notification_type) values (target_user_id,'Account approved','Your Host Kit account has been approved.','account_approved');
  perform public.log_activity('user_approved','Approved user account',null,jsonb_build_object('target_user_id',target_user_id,'role',approved_role));
  return updated_profile;
end $$;
