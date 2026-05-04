alter table if exists public.profiles add column if not exists requested_role text;
alter table if exists public.profiles add column if not exists account_status text default 'pending';

create index if not exists idx_property_memberships_member_user_id on public.property_memberships(member_user_id);
create index if not exists idx_property_memberships_host_user_id on public.property_memberships(host_user_id);
create index if not exists idx_property_memberships_property_id on public.property_memberships(property_id);
create index if not exists idx_property_memberships_property_record_id on public.property_memberships(property_record_id);
create index if not exists idx_property_memberships_active on public.property_memberships(active);

alter table public.property_memberships enable row level security;

drop policy if exists "members can read own active memberships" on public.property_memberships;
create policy "members can read own active memberships" on public.property_memberships
for select using (auth.uid() = member_user_id and active = true);
