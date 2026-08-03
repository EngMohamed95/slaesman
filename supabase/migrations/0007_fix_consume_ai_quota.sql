-- Fix consume_ai_quota, which failed at runtime with quota_check_failed.
--
-- Two real bugs in 0006, both invisible until the function actually ran:
--
-- 1. `RETURNS TABLE (allowed, used, quota, reason)` declares PL/pgSQL variables
--    with those names. `update ... set used = used + 1` was therefore ambiguous
--    between the OUT variable `used` and the column `org_ai_usage.used`, and
--    Postgres refuses to guess.
-- 2. `return query select false, 0, 0, 'no_subscription'` returns the literal as
--    type `unknown`, which does not match the declared `text` column. Only the
--    last branch had an explicit ::text cast.
--
-- The OUT parameters are renamed with an out_ prefix so no column in the body
-- can collide with them, and every literal is cast.

drop function if exists public.consume_ai_quota(uuid);

create function public.consume_ai_quota(target_org uuid)
returns table (out_allowed boolean, out_used integer, out_quota integer, out_reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  period      date := date_trunc('month', now())::date;
  plan_code_v text;
  status_v    text;
  period_end  timestamptz;
  cap         integer;
  ai_enabled  boolean;
  current_use integer;
begin
  select s.plan_code, s.status, s.current_period_end
    into plan_code_v, status_v, period_end
  from public.subscriptions s
  where s.org_id = target_org;

  if plan_code_v is null then
    return query select false, 0, 0, 'no_subscription'::text;
    return;
  end if;

  if status_v not in ('trialing', 'active')
     or (period_end is not null and period_end <= now()) then
    return query select false, 0, 0, 'subscription_inactive'::text;
    return;
  end if;

  select f.enabled, f.limit_value
    into ai_enabled, cap
  from public.plan_features f
  where f.plan_code = plan_code_v and f.feature_key = 'aiQueries';

  if ai_enabled is not true then
    return query select false, 0, 0, 'feature_not_included'::text;
    return;
  end if;

  -- Create the period row if absent, then lock it. Everything after the
  -- `for update` is serialised per organization, so concurrent callers queue
  -- rather than both reading the same count.
  insert into public.org_ai_usage (org_id, period_start, used)
  values (target_org, period, 0)
  on conflict (org_id, period_start) do nothing;

  select u.used into current_use
  from public.org_ai_usage u
  where u.org_id = target_org and u.period_start = period
  for update;

  -- null cap = unlimited tier.
  if cap is not null and current_use >= cap then
    return query select false, current_use, cap, 'quota_exhausted'::text;
    return;
  end if;

  update public.org_ai_usage u
  set used = u.used + 1, updated_at = now()
  where u.org_id = target_org and u.period_start = period
  returning u.used into current_use;

  return query select true, current_use, cap, 'ok'::text;
end;
$$;

revoke execute on function public.consume_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;

-- Prove it works before the Edge Function depends on it. Runs as the migration
-- role, burns one call against the first org, then puts the counter back.
do $$
declare
  org uuid;
  r   record;
begin
  select id into org from public.organizations order by created_at limit 1;
  if org is null then
    raise notice 'no organizations yet — skipping self-test';
    return;
  end if;

  select * into r from public.consume_ai_quota(org);
  raise notice 'consume_ai_quota -> allowed=% used=% quota=% reason=%',
    r.out_allowed, r.out_used, r.out_quota, r.out_reason;

  update public.org_ai_usage
  set used = greatest(0, used - 1)
  where org_id = org and period_start = date_trunc('month', now())::date;
end
$$;

select 'consume_ai_quota fixed' as status;
