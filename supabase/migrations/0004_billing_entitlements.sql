-- AdToDeal AI — Phase 7: plans, prices and server-owned entitlements.
--
-- Two defects this closes:
--
-- 1. `localStorage.setItem('salesmate_plan', 'Growth')` unlocked every paid
--    feature. The plan now lives in `subscriptions`, and NO policy grants
--    insert/update/delete on that table to `authenticated` — only the service
--    role (a billing webhook) can move an org onto a paid plan.
-- 2. Prices were hardcoded twice in the client (SubscriptionPage and
--    UpgradePaywall), so the two could disagree about what a plan costs.
--    `plans` + `plan_prices` are now the single source.
--
-- Run after 0003. Idempotent.

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  code       text primary key,
  name_en    text not null,
  name_ar    text not null,
  rank       integer not null,          -- upgrade ordering; higher wins
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_prices (
  plan_code text not null references public.plans (code) on delete cascade,
  currency  text not null,
  amount    numeric(12, 2) not null check (amount >= 0),
  interval  text not null default 'month',
  primary key (plan_code, currency, interval)
);

create table if not exists public.plan_features (
  plan_code   text not null references public.plans (code) on delete cascade,
  feature_key text not null,
  enabled     boolean not null default true,
  -- null = unlimited. Used for the AI query cap.
  limit_value integer,
  primary key (plan_code, feature_key)
);

-- ---------------------------------------------------------------------------
-- Subscriptions — one per organization
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  org_id             uuid primary key references public.organizations (id) on delete cascade,
  plan_code          text not null references public.plans (code),
  status             text not null default 'trialing',
  current_period_end timestamptz,
  -- Filled by the payment provider's webhook once billing is wired up.
  provider           text,
  provider_ref       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists touch_subscriptions on public.subscriptions;
create trigger touch_subscriptions before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Seed the catalog from the values that were hardcoded in the client.
-- ---------------------------------------------------------------------------
insert into public.plans (code, name_en, name_ar, rank, is_public) values
  ('Trial',  'Free Trial', 'تجربة مجانية', 0, false),
  ('Basic',  'Basic',      'الأساسية',      1, true),
  ('Pro',    'Pro',        'الاحترافية',    2, true),
  ('Growth', 'Growth',     'النمو',         3, true)
on conflict (code) do update
  set name_en = excluded.name_en, name_ar = excluded.name_ar, rank = excluded.rank;

insert into public.plan_prices (plan_code, currency, amount) values
  ('Basic',  'SAR', 100),   ('Pro', 'SAR', 399),   ('Growth', 'SAR', 999),
  ('Basic',  'AED', 100),   ('Pro', 'AED', 399),   ('Growth', 'AED', 999),
  ('Basic',  'USD', 27),    ('Pro', 'USD', 109),   ('Growth', 'USD', 272),
  ('Basic',  'EGP', 1300),  ('Pro', 'EGP', 5200),  ('Growth', 'EGP', 13000),
  ('Basic',  'JOD', 19),    ('Pro', 'JOD', 76),    ('Growth', 'JOD', 190),
  ('Trial',  'SAR', 0),     ('Trial', 'AED', 0),   ('Trial', 'USD', 0),
  ('Trial',  'EGP', 0),     ('Trial', 'JOD', 0)
on conflict (plan_code, currency, interval) do update set amount = excluded.amount;

-- Feature matrix. This mirrors validateFeatureAccess() exactly as it behaves
-- today: Trial and Basic get the core pages, Pro adds socialCreator, and only
-- Growth gets campaigns. Change entitlements HERE, not in the client.
insert into public.plan_features (plan_code, feature_key, enabled, limit_value) values
  -- Trial
  ('Trial', 'dashboard', true, null),  ('Trial', 'crm', true, null),
  ('Trial', 'tasks', true, null),      ('Trial', 'aiAssistant', true, null),
  ('Trial', 'whatsapp', true, null),   ('Trial', 'reports', true, null),
  ('Trial', 'settings', true, null),   ('Trial', 'socialCreator', false, null),
  ('Trial', 'campaigns', false, null), ('Trial', 'aiQueries', true, null),
  -- Basic (the only tier with an AI cap today)
  ('Basic', 'dashboard', true, null),  ('Basic', 'crm', true, null),
  ('Basic', 'tasks', true, null),      ('Basic', 'aiAssistant', true, null),
  ('Basic', 'whatsapp', true, null),   ('Basic', 'reports', true, null),
  ('Basic', 'settings', true, null),   ('Basic', 'socialCreator', false, null),
  ('Basic', 'campaigns', false, null), ('Basic', 'aiQueries', true, 3),
  -- Pro
  ('Pro', 'dashboard', true, null),    ('Pro', 'crm', true, null),
  ('Pro', 'tasks', true, null),        ('Pro', 'aiAssistant', true, null),
  ('Pro', 'whatsapp', true, null),     ('Pro', 'reports', true, null),
  ('Pro', 'settings', true, null),     ('Pro', 'socialCreator', true, null),
  ('Pro', 'campaigns', false, null),   ('Pro', 'aiQueries', true, null),
  -- Growth
  ('Growth', 'dashboard', true, null), ('Growth', 'crm', true, null),
  ('Growth', 'tasks', true, null),     ('Growth', 'aiAssistant', true, null),
  ('Growth', 'whatsapp', true, null),  ('Growth', 'reports', true, null),
  ('Growth', 'settings', true, null),  ('Growth', 'socialCreator', true, null),
  ('Growth', 'campaigns', true, null), ('Growth', 'aiQueries', true, null)
on conflict (plan_code, feature_key) do update
  set enabled = excluded.enabled, limit_value = excluded.limit_value;

-- ---------------------------------------------------------------------------
-- Every organization gets a trial on creation, and existing ones are backfilled.
-- ---------------------------------------------------------------------------
create or replace function public.start_org_trial()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.subscriptions (org_id, plan_code, status, current_period_end)
  values (new.id, 'Trial', 'trialing', now() + interval '30 days')
  on conflict (org_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_created_start_trial on public.organizations;
create trigger on_org_created_start_trial
  after insert on public.organizations
  for each row execute function public.start_org_trial();

insert into public.subscriptions (org_id, plan_code, status, current_period_end)
select o.id, 'Trial', 'trialing', now() + interval '30 days'
from public.organizations o
where not exists (select 1 from public.subscriptions s where s.org_id = o.id);

-- ---------------------------------------------------------------------------
-- Entitlement check, usable from RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.org_has_feature(target_org uuid, feature text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select f.enabled
    from public.subscriptions s
    join public.plan_features f
      on f.plan_code = s.plan_code
     and f.feature_key = feature
    where s.org_id = target_org
      -- An expired or unpaid subscription entitles nothing.
      and s.status in ('trialing', 'active')
      and (s.current_period_end is null or s.current_period_end > now())
  ), false);
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.plans         enable row level security;
alter table public.plan_prices   enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;

-- The catalog is public: the landing page prices itself to signed-out visitors.
-- Read-only — there is deliberately no write policy, so no client can reprice.
drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select using (true);

drop policy if exists plan_prices_read on public.plan_prices;
create policy plan_prices_read on public.plan_prices for select using (true);

drop policy if exists plan_features_read on public.plan_features;
create policy plan_features_read on public.plan_features for select using (true);

-- An org may READ its subscription. Nothing more.
-- No insert/update/delete policy exists on purpose: `authenticated` therefore
-- cannot grant itself a plan by any request it can construct. The billing
-- webhook writes with the service role, which bypasses RLS.
drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions
  for select using (public.is_org_member(org_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Entitlements with teeth: campaigns are Growth-only, enforced in Postgres.
-- A Trial org hitting REST directly with a valid token gets nothing back.
-- ---------------------------------------------------------------------------
drop policy if exists campaign_requests_select on public.campaign_requests;
create policy campaign_requests_select on public.campaign_requests
  for select using (
    (public.is_org_member(org_id) and public.org_has_feature(org_id, 'campaigns'))
    or public.is_platform_admin()
  );

drop policy if exists campaign_requests_insert on public.campaign_requests;
create policy campaign_requests_insert on public.campaign_requests
  for insert with check (
    public.is_org_member(org_id)
    and owner_id = auth.uid()
    and public.org_has_feature(org_id, 'campaigns')
  );

-- ---------------------------------------------------------------------------
-- Grants. Read-only for the catalog and the subscription.
-- ---------------------------------------------------------------------------
grant select on public.plans, public.plan_prices, public.plan_features to anon, authenticated;
grant select on public.subscriptions to authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;

select o.name as org, s.plan_code, s.status, s.current_period_end
from public.subscriptions s
join public.organizations o on o.id = s.org_id
order by s.created_at;
