/**
 * admin-users — account provisioning for platform staff.
 *
 * Creating a user requires `auth.admin.createUser`, which needs the service
 * role key. That key can never reach the browser: it bypasses RLS entirely, so
 * a copy of it in the bundle would hand every visitor the whole database. The
 * key stays here, and the browser gets one narrow verb instead.
 *
 * The gate is `app_metadata.role`, read off the token AFTER `getUser()` has
 * verified it against the auth server. That claim is signed into the JWT and
 * writable only with the service role — the same reason the app reads roles
 * from there and never from `user_metadata` (self-writable by any signed-in
 * browser) or from the email string. This endpoint deliberately offers no way
 * to set that claim: minting another platform admin stays a SQL Editor action,
 * so a stolen staff session cannot escalate itself into a permanent one.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Supabase's own floor is 6; 8 matches what AuthPages tells the user. */
const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const clean = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'unauthorized' }, 401);
  if (userData.user.app_metadata?.role !== 'admin') return json({ error: 'forbidden' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  if (clean(body.action) !== 'create') return json({ error: 'unknown_action' }, 400);

  const email = clean(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = clean(body.fullName);
  const agencyName = clean(body.agencyName);
  const phone = clean(body.phone, 40);
  const planCode = clean(body.planCode, 40);

  if (!EMAIL_RE.test(email)) return json({ error: 'invalid_email' }, 400);
  if (password.length < MIN_PASSWORD) return json({ error: 'weak_password' }, 400);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Reject an unknown plan BEFORE creating anyone. Letting the subscription
  // insert fail afterwards would leave a live account behind on a request the
  // caller was told had failed.
  if (planCode) {
    const { data: plan } = await admin
      .from('plans')
      .select('code')
      .eq('code', planCode)
      .maybeSingle();
    if (!plan) return json({ error: 'unknown_plan' }, 400);
  }

  // `handle_new_user` fires on this insert and creates the profile, a personal
  // organization and an owner membership. `name` / `agency_name` are read from
  // user_metadata by that trigger, which is why they go here rather than into a
  // follow-up update.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    // Staff-created accounts skip the confirmation mail: the operator is
    // vouching for the address, and the recipient gets credentials directly.
    email_confirm: true,
    user_metadata: { name: fullName, agency_name: agencyName },
  });

  if (createError || !created?.user) {
    const message = createError?.message ?? '';
    if (/already|registered|exists/i.test(message)) return json({ error: 'email_taken' }, 409);
    return json({ error: 'create_failed', detail: message }, 400);
  }

  const newUser = created.user;

  // Columns the trigger does not know about.
  if (agencyName || phone) {
    await admin
      .from('profiles')
      .update({ agency_name: agencyName || null, phone: phone || null })
      .eq('id', newUser.id);
  }

  let grantedPlan: string | null = null;
  if (planCode) {
    const { data: membership } = await admin
      .from('org_members')
      .select('org_id')
      .eq('user_id', newUser.id)
      .eq('role', 'owner')
      .maybeSingle();

    if (membership?.org_id) {
      // current_period_end stays null — org_has_feature reads null as "does not
      // expire". A staff-provisioned account is not on a billing cycle; when a
      // real provider webhook takes over it will set the date.
      const { error: subError } = await admin
        .from('subscriptions')
        .upsert(
          { org_id: membership.org_id, plan_code: planCode, status: 'active', current_period_end: null },
          { onConflict: 'org_id' },
        );
      if (subError) {
        // The account exists and is usable; only the plan failed. Say so
        // instead of reporting a clean success the operator would not check.
        return json({ error: 'plan_assign_failed', id: newUser.id, email: newUser.email }, 207);
      }
      grantedPlan = planCode;
    }
  }

  return json({ ok: true, id: newUser.id, email: newUser.email, plan: grantedPlan });
});
