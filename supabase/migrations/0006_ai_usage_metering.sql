-- AdToDeal AI — Phase 5: AI usage metering.
--
-- The cap used to be a localStorage counter (`salesmate_ai_query_count`), which
-- any user could reset from the console, and it only applied to the Basic tier.
-- Metering now happens in a Postgres transaction taken BEFORE the model call,
-- so a burst of concurrent requests cannot race past the limit.

create table if not exists public.org_ai_usage (
  org_id       uuid not null references public.organizations (id) on delete cascade,
  period_start date not null,
  used         integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (org_id, period_start)
);

alter table public.org_ai_usage enable row level security;

-- An org may see its own consumption. Only the Edge Function (service role)
-- ever writes it — there is no write policy and no write grant.
drop policy if exists org_ai_usage_read on public.org_ai_usage;
create policy org_ai_usage_read on public.org_ai_usage
  for select using (public.is_org_member(org_id) or public.is_platform_admin());

grant select on public.org_ai_usage to authenticated;
revoke insert, update, delete, truncate on public.org_ai_usage from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reserve one AI call, atomically.
--
-- `for update` on the usage row serialises concurrent callers: two requests
-- arriving together queue instead of both reading `used = 2` against a limit of
-- 3 and both proceeding. The row is created on first use in the same
-- transaction, so there is no check-then-insert gap either.
--
-- Returns the decision plus the counters, so the caller can report "3 of 3
-- used" without a second round trip.
-- ---------------------------------------------------------------------------
create or replace function public.consume_ai_quota(target_org uuid)
returns table (allowed boolean, used integer, quota integer, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  period      date := date_trunc('month', now())::date;
  plan        text;
  sub_status  text;
  period_end  timestamptz;
  cap         integer;
  ai_enabled  boolean;
  current_use integer;
begin
  select s.plan_code, s.status, s.current_period_end
    into plan, sub_status, period_end
  from public.subscriptions s
  where s.org_id = target_org;

  if plan is null then
    return query select false, 0, 0, 'no_subscription';
    return;
  end if;

  if sub_status not in ('trialing', 'active')
     or (period_end is not null and period_end <= now()) then
    return query select false, 0, 0, 'subscription_inactive';
    return;
  end if;

  select f.enabled, f.limit_value
    into ai_enabled, cap
  from public.plan_features f
  where f.plan_code = plan and f.feature_key = 'aiQueries';

  if ai_enabled is not true then
    return query select false, 0, 0, 'feature_not_included';
    return;
  end if;

  -- Take the row lock before reading the count. Everything below this line is
  -- serialised per organization.
  insert into public.org_ai_usage (org_id, period_start, used)
  values (target_org, period, 0)
  on conflict (org_id, period_start) do nothing;

  select u.used into current_use
  from public.org_ai_usage u
  where u.org_id = target_org and u.period_start = period
  for update;

  -- null cap = unlimited tier.
  if cap is not null and current_use >= cap then
    return query select false, current_use, cap, 'quota_exhausted';
    return;
  end if;

  update public.org_ai_usage
  set used = used + 1, updated_at = now()
  where org_id = target_org and period_start = period
  returning used into current_use;

  return query select true, current_use, cap, 'ok'::text;
end;
$$;

-- Only the service role calls this; the browser must not be able to burn or
-- refund quota directly.
revoke execute on function public.consume_ai_quota(uuid) from anon, authenticated;

-- Convenience read for the client's "x of y used" badge.
create or replace function public.current_ai_usage(target_org uuid)
returns table (used integer, quota integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((
      select u.used from public.org_ai_usage u
      where u.org_id = target_org
        and u.period_start = date_trunc('month', now())::date
    ), 0),
    (
      select f.limit_value
      from public.subscriptions s
      join public.plan_features f
        on f.plan_code = s.plan_code and f.feature_key = 'aiQueries'
      where s.org_id = target_org
    )
  where public.is_org_member(target_org);
$$;

select 'org_ai_usage ready' as status;
