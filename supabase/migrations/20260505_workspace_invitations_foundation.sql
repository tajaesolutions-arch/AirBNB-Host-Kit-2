create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'host' check (role in ('admin','property_manager','host','owner','cleaner','maintenance_crew')),
  status text not null default 'pending' check (status in ('pending','approved','suspended','expired','accepted','revoked')),
  invited_by uuid references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_invitations_workspace_id_idx on public.workspace_invitations(workspace_id);
create index if not exists workspace_invitations_email_idx on public.workspace_invitations(email);
create index if not exists workspace_invitations_status_idx on public.workspace_invitations(status);

alter table if exists public.workspace_invitations enable row level security;

drop policy if exists workspace_invitations_select on public.workspace_invitations;
create policy workspace_invitations_select on public.workspace_invitations
for select using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_invitations.workspace_id
      and wm.user_id = auth.uid()
      and wm.account_status = 'approved'
  )
  or lower(workspace_invitations.email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
);

