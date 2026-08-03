-- AdToDeal AI — Phase 3: core schema + RLS
-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Tenancy model: every row belongs to an organization. An account gets its own
-- organization on sign-up and is its owner. Teams and invites arrive in Phase 8,
-- but org_id exists from day one — retrofitting tenancy onto live customer data
-- is the expensive path.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'org_role') then
    create type public.org_role as enum ('owner', 'manager', 'rep');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references auth.users (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.org_role not null default 'rep',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_members_user_idx on public.org_members (user_id);

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  agency_name text,
  phone       text,
  locale      text not null default 'ar',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations (id) on delete cascade,
  -- The rep who owns the relationship. Reps see only their own rows; managers
  -- and owners see the whole organization.
  owner_id          uuid not null references auth.users (id) on delete restrict,
  name              text not null,
  name_ar           text,
  phone             text,
  email             text,
  source            text,
  source_ar         text,
  service           text,
  service_ar        text,
  budget            numeric(14, 2),
  expected_value    numeric(14, 2),
  status            text not null default 'New',
  status_ar         text,
  interest_level    text,
  interest_level_ar text,
  last_contact      date,
  next_follow_up    date,
  notes             text,
  notes_ar          text,
  -- Collected today and ignored; the WhatsApp function enforces it in Phase 6.
  consent           jsonb not null default '{"whatsapp": true, "calls": true, "marketing": true}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists leads_org_idx        on public.leads (org_id);
create index if not exists leads_owner_idx      on public.leads (org_id, owner_id);
create index if not exists leads_status_idx     on public.leads (org_id, status);
create index if not exists leads_next_follow_idx on public.leads (org_id, next_follow_up);

create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  owner_id       uuid not null references auth.users (id) on delete restrict,
  lead_id        uuid references public.leads (id) on delete cascade,
  title          text not null,
  title_ar       text,
  notes          text,
  type           text,
  priority       text not null default 'Medium',
  status         text not null default 'todo',
  completed      boolean not null default false,
  due_at         timestamptz,
  due_date       date,
  completed_at   timestamptz,
  -- Follow-up sequences (48h / 4d / 7d) group their tasks by this id.
  sequence_id    uuid,
  sequence_step  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tasks_org_idx   on public.tasks (org_id);
create index if not exists tasks_owner_idx on public.tasks (org_id, owner_id);
create index if not exists tasks_lead_idx  on public.tasks (lead_id);
create index if not exists tasks_due_idx   on public.tasks (org_id, due_date);

create table if not exists public.campaign_requests (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  owner_id      uuid not null references auth.users (id) on delete restrict,
  platform      text,
  goal          text,
  budget        numeric(14, 2),
  city          text,
  age           text,
  interests     text,
  duration      integer,
  language      text default 'ar',
  offer_details text,
  notes         text,
  -- Only platform staff may move this; see the update policy below.
  status        text not null default 'Pending Review',
  status_ar     text not null default 'قيد المراجعة والتدقيق',
  request_date  date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists campaign_requests_org_idx on public.campaign_requests (org_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['organizations', 'profiles', 'leads', 'tasks', 'campaign_requests']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
         for each row execute function public.touch_updated_at()', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Membership helpers
--
-- SECURITY DEFINER on purpose: a policy on `leads` that queries `org_members`
-- would re-enter that table's own RLS and recurse. Definer functions read past
-- RLS, which is why search_path is pinned — an attacker-controlled search_path
-- against a definer function is a privilege-escalation classic.
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(target_org uuid, min_role public.org_role default 'rep')
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and case m.role
            when 'owner'   then 3
            when 'manager' then 2
            else 1
          end
          >=
          case min_role
            when 'owner'   then 3
            when 'manager' then 2
            else 1
          end
  );
$$;

-- True when the caller may see every row in the org rather than only their own.
create or replace function public.can_see_all_in_org(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_org_member(target_org, 'manager');
$$;

-- Platform staff. Mirrors the JWT claim, which only the service role can write.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- ---------------------------------------------------------------------------
-- New-user bootstrap: profile + personal organization + owner membership
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_org uuid;
  display text;
begin
  display := coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name)
  values (new.id, display)
  on conflict (id) do nothing;

  insert into public.organizations (name, created_by)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'agency_name', ''), display), new.id)
  returning id into new_org;

  insert into public.org_members (org_id, user_id, role)
  values (new_org, new.id, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations     enable row level security;
alter table public.org_members       enable row level security;
alter table public.profiles          enable row level security;
alter table public.leads             enable row level security;
alter table public.tasks             enable row level security;
alter table public.campaign_requests enable row level security;

-- organizations
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select using (public.is_org_member(id) or public.is_platform_admin());

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update using (public.is_org_member(id, 'owner'))
  with check (public.is_org_member(id, 'owner'));

-- org_members. Reading your own row must not call is_org_member, or the policy
-- recurses through the very table it protects.
drop policy if exists org_members_select_self on public.org_members;
create policy org_members_select_self on public.org_members
  for select using (user_id = auth.uid() or public.can_see_all_in_org(org_id));

drop policy if exists org_members_manage on public.org_members;
create policy org_members_manage on public.org_members
  for all using (public.is_org_member(org_id, 'owner'))
  with check (public.is_org_member(org_id, 'owner'));

-- profiles
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());

drop policy if exists profiles_upsert_self on public.profiles;
create policy profiles_upsert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- leads
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads
  for select using (
    public.is_org_member(org_id)
    and (owner_id = auth.uid() or public.can_see_all_in_org(org_id))
  );

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads
  for insert with check (public.is_org_member(org_id) and owner_id = auth.uid());

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads
  for update using (
    public.is_org_member(org_id)
    and (owner_id = auth.uid() or public.can_see_all_in_org(org_id))
  )
  with check (public.is_org_member(org_id));

drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads
  for delete using (
    public.is_org_member(org_id)
    and (owner_id = auth.uid() or public.can_see_all_in_org(org_id))
  );

-- tasks
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    public.is_org_member(org_id)
    and (owner_id = auth.uid() or public.can_see_all_in_org(org_id))
  );

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (public.is_org_member(org_id) and owner_id = auth.uid());

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (
    public.is_org_member(org_id)
    and (owner_id = auth.uid() or public.can_see_all_in_org(org_id))
  )
  with check (public.is_org_member(org_id));

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
  for delete using (
    public.is_org_member(org_id)
    and (owner_id = auth.uid() or public.can_see_all_in_org(org_id))
  );

-- campaign_requests. Customers create and read their own; only platform staff
-- may change `status` — approving your own campaign was the old admin panel bug.
drop policy if exists campaign_requests_select on public.campaign_requests;
create policy campaign_requests_select on public.campaign_requests
  for select using (public.is_org_member(org_id) or public.is_platform_admin());

drop policy if exists campaign_requests_insert on public.campaign_requests;
create policy campaign_requests_insert on public.campaign_requests
  for insert with check (public.is_org_member(org_id) and owner_id = auth.uid());

drop policy if exists campaign_requests_update_admin on public.campaign_requests;
create policy campaign_requests_update_admin on public.campaign_requests
  for update using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists campaign_requests_delete on public.campaign_requests;
create policy campaign_requests_delete on public.campaign_requests
  for delete using (public.is_org_member(org_id, 'owner') or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Grants. RLS decides the rows; these decide the tables are reachable at all.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.leads, public.tasks, public.campaign_requests, public.profiles to authenticated;
grant select on public.organizations, public.org_members to authenticated;
grant update on public.organizations to authenticated;
