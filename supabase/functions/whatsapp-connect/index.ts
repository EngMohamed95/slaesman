/**
 * whatsapp-connect — attaches an organization's WhatsApp Business number.
 *
 * Replaces the three fields in SettingsPage that wrote the Meta permanent
 * access token into localStorage. The token is posted here once, verified
 * against Graph so a typo fails at connect time rather than on the first
 * customer message, and stored in Vault. It is never sent back to a client:
 * `whatsapp_accounts` does not even grant the secret pointer column to
 * `authenticated`.
 *
 * Deploy:
 *   supabase functions deploy whatsapp-connect
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

const GRAPH_VERSION = Deno.env.get('WHATSAPP_GRAPH_VERSION') ?? 'v21.0';

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

  let body: {
    action?: 'connect' | 'disconnect' | 'templates';
    phoneNumberId?: string;
    wabaId?: string;
    accessToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  // Membership and role come from the caller's own token, never from the body.
  const { data: membership } = await asUser
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userData.user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) return json({ error: 'no_organization' }, 403);
  const orgId = membership.org_id as string;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: entitled, error: entitlementError } = await admin
    .rpc('org_has_feature', { target_org: orgId, feature: 'whatsapp' });
  if (entitlementError) return json({ error: 'entitlement_check_failed' }, 500);
  if (!entitled) return json({ error: 'feature_not_included', feature: 'whatsapp' }, 402);

  // ---- Approved templates ---------------------------------------------
  // Any rep may read these: outside the 24-hour window a template is the only
  // thing they are allowed to send, so gating the list behind a manager role
  // would leave reps with a send button and nothing to put in it. The token
  // still never leaves the server — only the resulting names come back.
  if (body.action === 'templates') {
    const { data: creds, error: credsError } = await admin
      .rpc('whatsapp_credentials', { target_org: orgId });
    if (credsError) return json({ error: 'credential_lookup_failed' }, 500);
    const account = Array.isArray(creds) ? creds[0] : creds;
    if (!account?.access_token) return json({ error: 'whatsapp_not_connected' }, 503);
    if (!account.waba_id) return json({ error: 'waba_id_missing' }, 400);

    try {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(account.waba_id)}/message_templates?fields=name,language,status,category&limit=100`,
        { headers: { Authorization: `Bearer ${account.access_token}` } },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('template list failed', res.status, payload?.error?.message);
        return json({ error: 'template_list_failed', status: res.status }, 502);
      }
      // Only APPROVED templates can actually be sent; showing the rest would be
      // offering a rep a button that always fails.
      const templates = (payload.data ?? [])
        .filter((tpl: { status?: string }) => tpl.status === 'APPROVED')
        .map((tpl: { name: string; language: string; category?: string }) => ({
          name: tpl.name,
          language: tpl.language,
          category: tpl.category ?? null,
        }));
      return json({ ok: true, templates });
    } catch (e) {
      console.error('graph unreachable', e);
      return json({ error: 'graph_unreachable' }, 502);
    }
  }

  // Connecting or disconnecting the company's WhatsApp number is not a rep's
  // decision: the number sends as the business, and every rep in the org
  // inherits it.
  if (membership.role !== 'owner' && membership.role !== 'manager') {
    return json({ error: 'insufficient_role' }, 403);
  }

  if (body.action === 'disconnect') {
    const { error } = await admin.rpc('disconnect_whatsapp', { target_org: orgId });
    if (error) {
      console.error('disconnect failed', error.message);
      return json({ error: 'disconnect_failed' }, 500);
    }
    return json({ ok: true, connected: false });
  }

  const phoneNumberId = (body.phoneNumberId ?? '').trim();
  const accessToken = (body.accessToken ?? '').trim();
  const wabaId = (body.wabaId ?? '').trim() || null;

  if (!phoneNumberId || !accessToken) return json({ error: 'missing_credentials' }, 400);

  // Verify before storing. A token that cannot read its own phone number will
  // not be able to send with it either, and finding that out now beats finding
  // it out when a rep presses Send in front of a customer.
  let profile: { display_phone_number?: string; verified_name?: string };
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Meta's own message is safe to pass through here — it names the actual
      // problem ("Unsupported get request", "Invalid OAuth access token") and
      // the person reading it is the admin who just typed the credentials.
      return json({
        error: 'credentials_rejected',
        status: res.status,
        detail: payload?.error?.message ?? null,
      }, 400);
    }
    profile = payload;
  } catch (e) {
    console.error('graph verify failed', e);
    return json({ error: 'graph_unreachable' }, 502);
  }

  const { error } = await admin.rpc('set_whatsapp_credentials', {
    target_org: orgId,
    p_phone_number_id: phoneNumberId,
    p_waba_id: wabaId,
    p_display_phone: profile.display_phone_number ?? null,
    p_verified_name: profile.verified_name ?? null,
    p_access_token: accessToken,
    p_connected_by: userData.user.id,
  });

  if (error) {
    console.error('set_whatsapp_credentials failed', error.message);
    // A duplicate phone_number_id means the number is attached to another org.
    if (error.code === '23505') return json({ error: 'number_already_connected' }, 409);
    return json({ error: 'store_failed' }, 500);
  }

  return json({
    ok: true,
    connected: true,
    displayPhoneNumber: profile.display_phone_number ?? null,
    verifiedName: profile.verified_name ?? null,
  });
});
