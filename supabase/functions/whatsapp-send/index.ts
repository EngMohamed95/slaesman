/**
 * whatsapp-send — the only path from this app to a customer's WhatsApp.
 *
 * The browser sends a lead id and a message. It does not send a phone number
 * (which would let a rep message anyone, consented or not), it does not send an
 * org id (forgeable), and it never holds the Meta token.
 *
 * Three gates, in this order, before a single byte reaches Graph:
 *
 * 1. Entitlement — `org_has_feature(org, 'whatsapp')`.
 * 2. Consent — `leads.consent->>'whatsapp'`. Collected since Phase 3 and
 *    ignored by every code path until now.
 * 3. The 24-hour customer service window. Free-form text outside it is rejected
 *    by Meta anyway; rejecting it here turns a confusing 400 from Graph into an
 *    actionable "use a template" the UI can act on, and keeps the failed
 *    attempt out of the account's quality rating.
 *
 * Deploy:
 *   supabase functions deploy whatsapp-send
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

/** Meta's own cap is 4096 characters for a text body. */
const MAX_TEXT = 4096;

type TemplateRequest = {
  name?: string;
  language?: string;
  components?: unknown[];
};

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

  let body: { leadId?: string; text?: string; template?: TemplateRequest };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const leadId = (body.leadId ?? '').trim();
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : '';
  const template = body.template?.name ? body.template : null;

  if (!leadId) return json({ error: 'lead_required' }, 400);
  if (!text && !template) return json({ error: 'empty_message' }, 400);

  // Read the lead with the CALLER'S token: RLS decides whether this rep may
  // see it at all, so a guessed uuid from another org returns nothing rather
  // than a message to a stranger's customer.
  const { data: lead } = await asUser
    .from('leads')
    .select('id, org_id, owner_id, phone, consent')
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) return json({ error: 'lead_not_found' }, 404);
  if (!lead.phone) return json({ error: 'lead_has_no_phone' }, 400);

  const consent = (lead.consent ?? {}) as Record<string, unknown>;
  if (consent.whatsapp === false) return json({ error: 'consent_withheld' }, 403);

  const orgId = lead.org_id as string;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: entitled, error: entitlementError } = await admin
    .rpc('org_has_feature', { target_org: orgId, feature: 'whatsapp' });
  if (entitlementError) return json({ error: 'entitlement_check_failed' }, 500);
  if (!entitled) return json({ error: 'feature_not_included', feature: 'whatsapp' }, 402);

  const { data: normalized } = await admin
    .rpc('normalize_wa_phone', { raw: lead.phone });
  const toPhone = (normalized as string | null) ?? '';
  if (!toPhone) return json({ error: 'lead_phone_invalid' }, 400);

  // Free-form text is only legal inside the 24-hour window. A template is legal
  // either way, which is why the check only guards the text branch.
  if (!template) {
    const { data: windowOpen, error: windowError } = await admin
      .rpc('whatsapp_window_open', { target_org: orgId, target_phone: toPhone });
    if (windowError) return json({ error: 'window_check_failed' }, 500);
    if (!windowOpen) return json({ error: 'window_closed' }, 403);
  }

  const { data: creds, error: credsError } = await admin
    .rpc('whatsapp_credentials', { target_org: orgId });
  if (credsError) {
    console.error('credential lookup failed', credsError.message);
    return json({ error: 'credential_lookup_failed' }, 500);
  }
  const account = Array.isArray(creds) ? creds[0] : creds;
  if (!account?.access_token || !account?.phone_number_id) {
    return json({ error: 'whatsapp_not_connected' }, 503);
  }

  const payload: Record<string, unknown> = template
    ? {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language ?? 'ar' },
          ...(template.components ? { components: template.components } : {}),
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { preview_url: false, body: text },
      };

  let wamid: string | null = null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(account.phone_number_id)}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Log the code, not the request: the Authorization header and the token
      // are in scope here and Meta echoes parts of the request in some errors.
      console.error('graph send error', res.status, result?.error?.code, result?.error?.message);
      return json({
        error: 'send_failed',
        status: res.status,
        code: result?.error?.code ?? null,
        detail: result?.error?.message ?? null,
      }, 502);
    }

    wamid = result?.messages?.[0]?.id ?? null;
  } catch (e) {
    console.error('graph unreachable', e);
    return json({ error: 'graph_unreachable' }, 502);
  }

  if (!wamid) return json({ error: 'no_message_id' }, 502);

  // Logged with the service role: `whatsapp_messages` has no insert policy, so
  // the transcript cannot be forged from a browser. `on conflict` on the wamid
  // is not defensive here — it is the same unique index the webhook relies on,
  // and a status callback can arrive before this insert commits.
  const { error: logError } = await admin
    .from('whatsapp_messages')
    .upsert({
      org_id: orgId,
      owner_id: lead.owner_id,
      lead_id: lead.id,
      direction: 'out',
      wa_message_id: wamid,
      contact_phone: toPhone,
      body: template ? null : text,
      message_type: template ? 'template' : 'text',
      template_name: template?.name ?? null,
      status: 'sent',
      sent_by: userData.user.id,
    }, { onConflict: 'wa_message_id', ignoreDuplicates: true });

  if (logError) {
    // The message IS delivered at this point. Report success with a flag rather
    // than an error the UI would show as "not sent" next to a message the
    // customer is already reading.
    console.error('message log failed', logError.message);
    return json({ ok: true, wamid, logged: false });
  }

  return json({ ok: true, wamid, logged: true });
});
