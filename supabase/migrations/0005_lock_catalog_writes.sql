-- AdToDeal AI — revoke write privileges on the pricing catalog.
--
-- Found while attacking 0004: a PATCH repricing Growth to 1 SAR returned
-- `200 []` instead of a denial. Nothing changed — RLS has no update policy, so
-- zero rows matched — but the request was reaching the table at all. Supabase
-- grants ALL on new public tables to anon/authenticated through default
-- privileges, and `grant select` in 0004 added to that instead of narrowing it.
--
-- RLS was doing the work alone. This restores the second layer, and turns a
-- silent no-op into a loud 42501 the way `subscriptions` already behaves.

revoke insert, update, delete, truncate
  on public.plans, public.plan_prices, public.plan_features
  from anon, authenticated;

-- Same reasoning for the tenancy tables: membership and organizations are
-- managed by owners through server functions (Phase 8), never by direct writes.
revoke insert, update, delete, truncate
  on public.organizations, public.org_members
  from anon, authenticated;

-- Re-assert the reads these tables must keep serving.
grant select on public.plans, public.plan_prices, public.plan_features to anon, authenticated;
grant select on public.organizations, public.org_members to authenticated;

-- Verify: authenticated should hold SELECT and nothing else on all of these.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema = 'public'
  and table_name in ('plans', 'plan_prices', 'plan_features', 'subscriptions',
                     'organizations', 'org_members')
order by table_name, privilege_type;
