-- AdToDeal AI — backfill for accounts created before 0001.
--
-- `handle_new_user` only fires on INSERT into auth.users, so anyone who signed
-- up before the schema existed has no profile, no organization and no
-- membership — and RLS denies them every row because is_org_member() is false.
-- Run once, after 0001. Idempotent: re-running touches nothing.

-- 1. Missing profiles
insert into public.profiles (id, full_name)
select u.id,
       coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 2. Missing organizations + owner membership, in one pass so an account can
--    never end up with an organization it is not a member of.
with missing as (
  select u.id,
         coalesce(nullif(u.raw_user_meta_data ->> 'agency_name', ''),
                  nullif(u.raw_user_meta_data ->> 'name', ''),
                  split_part(u.email, '@', 1)) as display
  from auth.users u
  where not exists (select 1 from public.org_members m where m.user_id = u.id)
),
created as (
  insert into public.organizations (name, created_by)
  select display, id from missing
  returning id as org_id, created_by
)
insert into public.org_members (org_id, user_id, role)
select org_id, created_by, 'owner'
from created
on conflict do nothing;

-- 3. Report what the account now sees.
select u.email, o.id as org_id, o.name as org_name, m.role
from auth.users u
join public.org_members m on m.user_id = u.id
join public.organizations o on o.id = m.org_id
order by u.created_at;
