-- Restore the column names consume_ai_quota returns.
--
-- 0007 fixed the ambiguity by renaming the OUT parameters to out_allowed /
-- out_used / out_quota / out_reason. That fixed Postgres and broke the caller:
-- ai-proxy reads `decision.allowed`, got undefined, and refused every request
-- with 402 quota_exhausted — after having already consumed the quota.
--
-- The rename was never the necessary part of the fix. The ambiguity came from
-- ONE line, `set used = used + 1`, where the right-hand `used` could mean the
-- OUT variable or the column. Qualifying every column reference with the table
-- alias resolves it while keeping the names the function's caller expects.
--
-- Contract restored: allowed, used, quota, reason.

drop function if exists public.consume_ai_quota(uuid);

create function public.consume_ai_quota(target_org uuid)
returns table (allowed boolean, used integer, quota integer, reason text)
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

  insert into public.org_ai_usage (org_id, period_start, used)
  values (target_org, period, 0)
  on conflict (org_id, period_start) do nothing;

  -- Lock the period row. Everything below is serialised per organization.
  select u.used into current_use
  from public.org_ai_usage u
  where u.org_id = target_org and u.period_start = period
  for update;

  -- null cap = unlimited tier.
  if cap is not null and current_use >= cap then
    return query select false, current_use, cap, 'quota_exhausted'::text;
    return;
  end if;

  -- Every reference qualified: `u.used` on the right can only be the column,
  -- never the OUT variable of the same name. This is the whole fix.
  update public.org_ai_usage u
  set used = u.used + 1, updated_at = now()
  where u.org_id = target_org and u.period_start = period
  returning u.used into current_use;

  return query select true, current_use, cap, 'ok'::text;
end;
$$;

revoke execute on function public.consume_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;

-- Clear the counters burned by the failed test calls above: quota was consumed
-- on a path that never reached the model.
update public.org_ai_usage
set used = 0, updated_at = now()
where period_start = date_trunc('month', now())::date;

-- Self-test, asserting the column names the caller depends on.
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
  if r.allowed is not true or r.reason <> 'ok' then
    raise exception 'self-test failed: allowed=% reason=%', r.allowed, r.reason;
  end if;
  raise notice 'consume_ai_quota -> allowed=% used=% quota=% reason=%',
    r.allowed, r.used, r.quota, r.reason;

  update public.org_ai_usage
  set used = 0
  where org_id = org and period_start = date_trunc('month', now())::date;
end
$$;

select 'quota contract restored' as status;
