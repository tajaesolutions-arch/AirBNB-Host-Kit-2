-- Host Kit launch-readiness demo seed
-- Safe test-only data keyed off test.hostkit.local accounts.

with users as (
  select id, email from auth.users where email like '%@test.hostkit.local'
),
roles as (
  select p.id, p.email, p.role from public.profiles p join users u on u.id = p.id
)
insert into public.properties (name, location, status, owner_id, manager_id, created_by)
select * from (
  values
    ('Ocean View Villa','Montego Bay','active',(select id from roles where role='owner' limit 1),(select id from roles where role='property_manager' limit 1),(select id from roles where role in ('host','admin') limit 1)),
    ('Kingston Business Loft','Kingston','active',(select id from roles where role='owner' limit 1),(select id from roles where role='property_manager' limit 1),(select id from roles where role in ('host','admin') limit 1)),
    ('Montego Bay Guest House','Montego Bay','active',(select id from roles where role='owner' limit 1),(select id from roles where role='property_manager' limit 1),(select id from roles where role in ('host','admin') limit 1)),
    ('Ocho Rios Family Retreat','Ocho Rios','active',(select id from roles where role='owner' limit 1),(select id from roles where role='property_manager' limit 1),(select id from roles where role in ('host','admin') limit 1))
) as seed(name, location, status, owner_id, manager_id, created_by)
where not exists (select 1 from public.properties p where p.name = seed.name);

-- NOTE: run the app setup screens to add bookings/tasks/orders if table columns differ.
