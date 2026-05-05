-- Cleaner role hardening: idempotent schema + policy setup.
alter table public.profiles add column if not exists display_name text;
alter table public.cleaning_tasks add column if not exists assigned_to_user_id uuid references auth.users(id);
create index if not exists idx_cleaning_tasks_assigned_to_user_id on public.cleaning_tasks(assigned_to_user_id);
do $$ begin
  if to_regclass('public.work_tasks') is not null then
    execute 'create index if not exists idx_work_tasks_assigned_to_user_id on public.work_tasks(assigned_to_user_id)';
  end if;
end $$;

-- Basic cleaner read/update scoping on own assigned tasks.
drop policy if exists cleaner_select_own_cleaning_tasks on public.cleaning_tasks;
create policy cleaner_select_own_cleaning_tasks on public.cleaning_tasks
for select to authenticated
using (assigned_to_user_id = auth.uid());

drop policy if exists cleaner_update_own_cleaning_tasks on public.cleaning_tasks;
create policy cleaner_update_own_cleaning_tasks on public.cleaning_tasks
for update to authenticated
using (assigned_to_user_id = auth.uid())
with check (assigned_to_user_id = auth.uid());
