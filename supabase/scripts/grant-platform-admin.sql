-- Grant (or revoke) platform-admin rights.
--
-- Run in the Supabase SQL Editor. This is the ONLY way to become an admin:
-- the client cannot do it, by design. The old rule was
-- `email.includes('admin')`, which handed the admin panel to anyone who could
-- register admin@anything.com.
--
-- `raw_app_meta_data` is signed into the JWT and writable only with the
-- service role. `raw_user_meta_data` is self-writable by any signed-in
-- browser — never put a role there.
--
-- The new claim reaches the app on the NEXT token issue, so sign out and sign
-- back in afterwards (or wait for the hourly refresh).

-- ── GRANT ────────────────────────────────────────────────────────────────────
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'CHANGE_ME@example.com';

-- ── REVOKE (uncomment to use) ────────────────────────────────────────────────
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data - 'role'
-- where email = 'CHANGE_ME@example.com';

-- Who holds the claim right now?
select email,
       raw_app_meta_data ->> 'role' as role,
       created_at
from auth.users
order by created_at;
