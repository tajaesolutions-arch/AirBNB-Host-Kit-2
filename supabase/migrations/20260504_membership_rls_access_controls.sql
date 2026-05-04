-- Extend user-owned table policies so active property members can access assigned properties.
-- Host owner access (auth.uid() = user_id) remains unchanged.

create or replace function public.has_active_property_access(record_owner_id uuid, record_property_id text, record_property_record_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.property_memberships pm
    where pm.host_user_id = record_owner_id
      and pm.member_user_id = auth.uid()
      and pm.active = true
      and (
        (record_property_id is not null and pm.property_id = record_property_id)
        or (record_property_record_id is not null and pm.property_record_id = record_property_record_id)
      )
  );
$$;

create or replace function public.has_active_property_financial_access(record_owner_id uuid, record_property_id text, record_property_record_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.property_memberships pm
    where pm.host_user_id = record_owner_id
      and pm.member_user_id = auth.uid()
      and pm.active = true
      and pm.can_view_financials = true
      and (
        (record_property_id is not null and pm.property_id = record_property_id)
        or (record_property_record_id is not null and pm.property_record_id = record_property_record_id)
      )
  );
$$;

create or replace function public.has_active_property_operations_edit_access(record_owner_id uuid, record_property_id text, record_property_record_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.property_memberships pm
    where pm.host_user_id = record_owner_id
      and pm.member_user_id = auth.uid()
      and pm.active = true
      and pm.can_edit_operations = true
      and (
        (record_property_id is not null and pm.property_id = record_property_id)
        or (record_property_record_id is not null and pm.property_record_id = record_property_record_id)
      )
  );
$$;

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
    execute format('drop policy if exists "Users can view own records" on public.%I', t);
    execute format($policy$
      create policy "Users can view own records"
      on public.%I
      for select
      using (
        public.is_approved_user()
        and (
          auth.uid() = user_id
          or (
            case
              when '%2$s' = any (array['expenses', 'owner_reports', 'tax_reserve_records'])
                then public.has_active_property_financial_access(user_id, property_id, null)
              else public.has_active_property_access(user_id, property_id, case when '%2$s' = 'properties' then id else null end)
            end
          )
        )
      )
    $policy$, t, t);

    execute format('drop policy if exists "Users can insert own records" on public.%I', t);
    execute format($policy$
      create policy "Users can insert own records"
      on public.%I
      for insert
      with check (
        public.is_approved_user()
        and (
          auth.uid() = user_id
          or public.has_active_property_operations_edit_access(user_id, property_id, case when '%2$s' = 'properties' then id else null end)
        )
      )
    $policy$, t, t);

    execute format('drop policy if exists "Users can update own records" on public.%I', t);
    execute format($policy$
      create policy "Users can update own records"
      on public.%I
      for update
      using (
        public.is_approved_user()
        and (
          auth.uid() = user_id
          or public.has_active_property_operations_edit_access(user_id, property_id, case when '%2$s' = 'properties' then id else null end)
        )
      )
      with check (
        public.is_approved_user()
        and (
          auth.uid() = user_id
          or public.has_active_property_operations_edit_access(user_id, property_id, case when '%2$s' = 'properties' then id else null end)
        )
      )
    $policy$, t, t);

    execute format('drop policy if exists "Users can delete own records" on public.%I', t);
    execute format($policy$
      create policy "Users can delete own records"
      on public.%I
      for delete
      using (
        public.is_approved_user()
        and (
          auth.uid() = user_id
          or public.has_active_property_operations_edit_access(user_id, property_id, case when '%2$s' = 'properties' then id else null end)
        )
      )
    $policy$, t, t);
  end loop;
end $$;
