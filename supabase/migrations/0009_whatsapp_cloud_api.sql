-- AdToDeal AI — Phase 6: WhatsApp Cloud API.
-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- What this replaces:
--
-- The Meta permanent access token was typed into SettingsPage and kept in
-- localStorage (`salesmate_wa_access_token`). Any script on the page could read
-- it, and it is a credential that sends messages as the customer's verified
-- business — the worst thing in the app to leak. It moves into Vault here, and
-- the browser never sees it again. The Settings card that read those keys and
-- announced "Real Meta WhatsApp API Connected & Active" was also lying: nothing
-- ever sent through the Cloud API, because `sendRealWhatsAppMessage()` was
-- deleted in Phase 0 for putting that same token in a Bearer header.
--
-- Two constraints Meta enforces and we therefore enforce here, server-side:
--
-- 1. The 24-hour customer service window. Free-form text may only be sent
--    within 24 hours of the contact's last inbound message; outside it, only an
--    approved template. `whatsapp_window_open()` is the check, and it reads the
--    message log rather than trusting anything the client claims.
-- 2. Consent. `leads.consent->>'whatsapp'` has been collected since Phase 3 and
--    ignored by every code path. The send function honours it now.

create extension if not exists pgcrypto;

-- Vault ships enabled on Supabase; the guard is for local/self-hosted Postgres
-- where it may not, so the rest of the migration still applies.
do $$
begin
  create extension if not exists supabase_vault with schema vault;
exception when others then
  raise notice 'supabase_vault not available (%): credentials must be supplied another way.', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Phone normalisation.
--
-- Meta returns `wa_id` as digits with no plus; the CRM stores whatever the rep
-- typed ("+20 100 123 4567", "0020…"). Matching an inbound message to a lead
-- fails silently if the two are compared raw, so both sides are normalised to
-- the same shape before they are ever stored or compared.
-- ---------------------------------------------------------------------------
create or replace function public.normalize_wa_phone(raw text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(regexp_replace(coalesce(raw, ''), '\D', '', 'g'), '^00', ''), '');
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One connected WhatsApp Business number per organization.
--
-- The access token is NOT here. `token_secret_id` points at a Vault secret; the
-- column is not granted to `authenticated` at all, so even a client that can
-- read this row cannot read the pointer, let alone the secret.
create table if not exists public.whatsapp_accounts (
  org_id               uuid primary key references public.organizations (id) on delete cascade,
  phone_number_id      text not null,
  waba_id              text,
  display_phone_number text,
  verified_name        text,
  token_secret_id      uuid,
  connected_by         uuid references auth.users (id) on delete set null,
  connected_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- A phone number id belongs to exactly one organization. The webhook routes
-- inbound messages by this value, so a duplicate would deliver another org's
-- conversations into this one.
create unique index if not exists whatsapp_accounts_phone_number_idx
  on public.whatsapp_accounts (phone_number_id);

create table if not exists public.whatsapp_messages (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  -- Mirrors leads.owner_id so the visibility rule below can be the same one
  -- reps already have on leads. Null on an inbound message we could not match
  -- to a lead — those are visible to managers and owners only, deliberately:
  -- an unmatched number is not yet anybody's customer.
  owner_id       uuid references auth.users (id) on delete set null,
  lead_id        uuid references public.leads (id) on delete set null,
  direction      text not null check (direction in ('in', 'out')),
  -- Meta's `wamid`. Unique, and that is what makes webhook delivery idempotent:
  -- Meta retries any callback it does not get a 200 for, so the same inbound
  -- message arrives more than once as a matter of course, not as an error.
  wa_message_id  text not null,
  contact_phone  text not null,
  body           text,
  message_type   text not null default 'text',
  template_name  text,
  status         text not null default 'sent'
                 check (status in ('sent', 'delivered', 'read', 'failed')),
  error_code     integer,
  error_detail   text,
  sent_by        uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists whatsapp_messages_wamid_idx
  on public.whatsapp_messages (wa_message_id);
create index if not exists whatsapp_messages_org_idx
  on public.whatsapp_messages (org_id, created_at desc);
create index if not exists whatsapp_messages_lead_idx
  on public.whatsapp_messages (lead_id, created_at desc);
-- Serves whatsapp_window_open(): the 24-hour lookup is by org + phone +
-- direction, and it runs on every single outbound send.
create index if not exists whatsapp_messages_window_idx
  on public.whatsapp_messages (org_id, contact_phone, direction, created_at desc);

drop trigger if exists touch_whatsapp_accounts on public.whatsapp_accounts;
create trigger touch_whatsapp_accounts
  before update on public.whatsapp_accounts
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_whatsapp_messages on public.whatsapp_messages;
create trigger touch_whatsapp_messages
  before update on public.whatsapp_messages
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- The 24-hour customer service window.
--
-- True when the contact has sent us something in the last 24 hours. Outside it
-- Meta rejects free-form text, so `whatsapp-send` requires an approved template
-- instead — and checking here rather than in the Edge Function means the rule
-- survives someone calling the Graph API from elsewhere in our own backend.
-- ---------------------------------------------------------------------------
create or replace function public.whatsapp_window_open(target_org uuid, target_phone text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.whatsapp_messages m
    where m.org_id = target_org
      and m.direction = 'in'
      and m.contact_phone = public.normalize_wa_phone(target_phone)
      and m.created_at > now() - interval '24 hours'
  );
$$;

-- ---------------------------------------------------------------------------
-- Credentials in and out of Vault.
--
-- Both are SECURITY DEFINER and both have EXECUTE revoked from anon and
-- authenticated below, so only the service role — that is, only an Edge
-- Function — can call them. A signed-in browser cannot read the token by any
-- request it is able to construct.
-- ---------------------------------------------------------------------------
create or replace function public.set_whatsapp_credentials(
  target_org        uuid,
  p_phone_number_id text,
  p_waba_id         text,
  p_display_phone   text,
  p_verified_name   text,
  p_access_token    text,
  p_connected_by    uuid
)
returns void
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_id uuid;
  v_name      text := 'whatsapp_token_' || replace(target_org::text, '-', '');
begin
  select token_secret_id into v_secret_id
  from public.whatsapp_accounts
  where org_id = target_org;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_access_token, v_name, 'WhatsApp Cloud API token');
  else
    -- Reconnecting rotates the token in place. Creating a second secret would
    -- leave the old one decryptable forever with nothing pointing at it.
    perform vault.update_secret(v_secret_id, p_access_token);
  end if;

  insert into public.whatsapp_accounts as a (
    org_id, phone_number_id, waba_id, display_phone_number, verified_name,
    token_secret_id, connected_by, connected_at
  )
  values (
    target_org, p_phone_number_id, p_waba_id, p_display_phone, p_verified_name,
    v_secret_id, p_connected_by, now()
  )
  on conflict (org_id) do update set
    phone_number_id      = excluded.phone_number_id,
    waba_id              = excluded.waba_id,
    display_phone_number = excluded.display_phone_number,
    verified_name        = excluded.verified_name,
    token_secret_id      = excluded.token_secret_id,
    connected_by         = excluded.connected_by,
    connected_at         = excluded.connected_at;
end;
$$;

create or replace function public.whatsapp_credentials(target_org uuid)
returns table (phone_number_id text, waba_id text, access_token text)
language sql
stable
security definer
set search_path = public, vault, pg_temp
as $$
  select a.phone_number_id, a.waba_id, s.decrypted_secret
  from public.whatsapp_accounts a
  join vault.decrypted_secrets s on s.id = a.token_secret_id
  where a.org_id = target_org;
$$;

-- ---------------------------------------------------------------------------
-- Matching an inbound message to a lead.
--
-- The functional index is the point: without it this runs a sequential scan
-- over every lead in the org on every inbound message, and the webhook has to
-- answer Meta within seconds or be retried. `normalize_wa_phone` is IMMUTABLE
-- precisely so it can be indexed.
-- ---------------------------------------------------------------------------
create index if not exists leads_wa_phone_idx
  on public.leads (org_id, public.normalize_wa_phone(phone));

create or replace function public.lead_for_wa_phone(target_org uuid, target_phone text)
returns table (id uuid, owner_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select l.id, l.owner_id
  from public.leads l
  where l.org_id = target_org
    and public.normalize_wa_phone(l.phone) = public.normalize_wa_phone(target_phone)
  order by l.updated_at desc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Delivery receipts.
--
-- Meta sends sent → delivered → read as separate callbacks with no ordering
-- guarantee, and retries each one. Applying them blindly lets a late
-- `delivered` overwrite a `read` that already arrived, so a message the
-- customer has opened shows as merely delivered. Rank the states and only ever
-- move forward — except `failed`, which is terminal whenever it turns up.
-- ---------------------------------------------------------------------------
create or replace function public.whatsapp_apply_status(
  p_wamid       text,
  p_status      text,
  p_error_code  integer default null,
  p_error_detail text default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.whatsapp_messages m
  set status       = p_status,
      error_code   = coalesce(p_error_code, m.error_code),
      error_detail = coalesce(p_error_detail, m.error_detail)
  where m.wa_message_id = p_wamid
    and (
      p_status = 'failed'
      or array_position(array['sent', 'delivered', 'read'], p_status)
         > array_position(array['sent', 'delivered', 'read'], m.status)
    );
$$;

-- Routing for the webhook: Meta identifies the recipient business by
-- phone_number_id, never by our org id.
create or replace function public.whatsapp_org_for_phone_number(p_phone_number_id text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select org_id from public.whatsapp_accounts where phone_number_id = p_phone_number_id;
$$;

create or replace function public.disconnect_whatsapp(target_org uuid)
returns void
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_id uuid;
begin
  select token_secret_id into v_secret_id
  from public.whatsapp_accounts
  where org_id = target_org;

  delete from public.whatsapp_accounts where org_id = target_org;

  -- The message history stays. Deleting the connection is not deleting the
  -- record of what was sent to customers.
  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.whatsapp_accounts enable row level security;
alter table public.whatsapp_messages enable row level security;

-- An org may see THAT it is connected and to which number. Writes come from
-- the Edge Functions only: there is no insert/update/delete policy, and the
-- grants below match.
drop policy if exists whatsapp_accounts_read on public.whatsapp_accounts;
create policy whatsapp_accounts_read on public.whatsapp_accounts
  for select using (public.is_org_member(org_id) or public.is_platform_admin());

-- Same visibility rule as leads: a rep sees their own conversations, managers
-- and owners see the org's. Entitlement is checked too, so a downgraded org
-- stops reading the transcript from REST even with a valid token.
drop policy if exists whatsapp_messages_read on public.whatsapp_messages;
create policy whatsapp_messages_read on public.whatsapp_messages
  for select using (
    (
      public.is_org_member(org_id)
      and public.org_has_feature(org_id, 'whatsapp')
      and (public.can_see_all_in_org(org_id) or owner_id = auth.uid())
    )
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Grants
--
-- Supabase grants ALL on every new table in `public` to anon and authenticated
-- by default, so RLS would otherwise be defending alone. Revoke first, then
-- grant back exactly the reads that are wanted — including at column level, so
-- `token_secret_id` is not merely policy-protected but ungranted.
-- ---------------------------------------------------------------------------
revoke all on public.whatsapp_accounts from anon, authenticated;
revoke all on public.whatsapp_messages from anon, authenticated;

grant select (
  org_id, phone_number_id, waba_id, display_phone_number, verified_name,
  connected_by, connected_at, created_at, updated_at
) on public.whatsapp_accounts to authenticated;

grant select on public.whatsapp_messages to authenticated;

-- Only the service role may touch credentials.
revoke all on function public.set_whatsapp_credentials(uuid, text, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.whatsapp_credentials(uuid) from public, anon, authenticated;
revoke all on function public.whatsapp_org_for_phone_number(text) from public, anon, authenticated;
revoke all on function public.disconnect_whatsapp(uuid) from public, anon, authenticated;
revoke all on function public.lead_for_wa_phone(uuid, text) from public, anon, authenticated;
revoke all on function public.whatsapp_apply_status(text, text, integer, text) from public, anon, authenticated;

-- Granted back explicitly rather than relying on Supabase's default privileges
-- for service_role: revoking from PUBLIC above removes the grant every role
-- inherited, and a silent loss of EXECUTE here shows up as the send function
-- reporting "not connected" for an org that plainly is.
grant execute on function public.set_whatsapp_credentials(uuid, text, text, text, text, text, uuid) to service_role;
grant execute on function public.whatsapp_credentials(uuid) to service_role;
grant execute on function public.whatsapp_org_for_phone_number(text) to service_role;
grant execute on function public.disconnect_whatsapp(uuid) to service_role;
grant execute on function public.lead_for_wa_phone(uuid, text) to service_role;
grant execute on function public.whatsapp_apply_status(text, text, integer, text) to service_role;

-- The window check is safe to expose: it answers yes/no about a number the
-- caller already has, and the UI needs it to decide whether to offer a free-form
-- box or a template picker.
grant execute on function public.whatsapp_window_open(uuid, text) to authenticated;
grant execute on function public.normalize_wa_phone(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
--
-- This is what retires the three polling loops in CRMPage (every 2s, 3s and 8s
-- against the local bridge). An inbound reply arrives as a Postgres change the
-- moment the webhook writes it.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.whatsapp_messages;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'supabase_realtime publication not found; skipping.';
end
$$;
