/**
 * whatsapp-webhook — inbound messages and delivery receipts from Meta.
 *
 * This is the only public endpoint in the project. Meta calls it with no JWT,
 * so it MUST be deployed with verification off:
 *
 *   supabase functions deploy whatsapp-webhook --no-verify-jwt
 *
 * Secrets it needs:
 *   WHATSAPP_VERIFY_TOKEN  — any string; paste the same one into the Meta
 *                            dashboard's "Verify token" field.
 *   WHATSAPP_APP_SECRET    — App Settings → Basic → App Secret. Without it the
 *                            endpoint refuses every POST rather than accepting
 *                            unsigned ones: an unauthenticated public writer
 *                            into the message log is not a degraded mode worth
 *                            having.
 *
 * Then in Meta: WhatsApp → Configuration → Callback URL
 *   https://<project>.supabase.co/functions/v1/whatsapp-webhook
 * and subscribe to the `messages` field.
 *
 * Idempotency is not optional. Meta retries any callback it does not get a 200
 * for, and delivers the same `wamid` more than once as normal operation — the
 * unique index on `whatsapp_messages.wa_message_id` is what absorbs that.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const encoder = new TextEncoder();

/** Constant-time compare. A `===` here leaks the signature a byte at a time. */
const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const hmacSha256Hex = async (secret: string, payload: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** Everything Meta can put in `messages[].type`, flattened to something to show. */
const extractBody = (message: Record<string, any>): { body: string | null; type: string } => {
  const type = String(message.type ?? 'unknown');
  switch (type) {
    case 'text':
      return { body: message.text?.body ?? null, type };
    case 'button':
      return { body: message.button?.text ?? null, type };
    case 'interactive':
      return {
        body: message.interactive?.button_reply?.title
          ?? message.interactive?.list_reply?.title
          ?? null,
        type,
      };
    case 'image':
    case 'video':
    case 'document':
    case 'audio':
    case 'sticker':
      return { body: message[type]?.caption ?? null, type };
    case 'location':
      return { body: message.location?.name ?? null, type };
    default:
      return { body: null, type };
  }
};

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ---- Verification handshake -------------------------------------------
  // Meta calls this once when you save the Callback URL, and again whenever
  // you edit it.
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge') ?? '';
    const expected = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';

    if (mode === 'subscribe' && expected && token && safeEqual(token, expected)) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response('forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');
  if (!appSecret) {
    console.error('WHATSAPP_APP_SECRET is not set; refusing the callback');
    return new Response('not configured', { status: 503 });
  }

  // The signature covers the exact bytes, so the body must be read as text and
  // parsed afterwards — re-serialising the parsed JSON changes it and the
  // comparison fails for reasons that look like nothing at all.
  const raw = await req.text();
  const header = req.headers.get('x-hub-signature-256') ?? '';
  const provided = header.startsWith('sha256=') ? header.slice(7) : '';
  const expectedSignature = await hmacSha256Hex(appSecret, raw);

  if (!provided || !safeEqual(provided, expectedSignature)) {
    console.error('rejected callback: bad signature');
    return new Response('forbidden', { status: 403 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Signed but unparseable. 200 anyway: retrying will not fix it and Meta
    // throttles endpoints that keep failing.
    return new Response('ok', { status: 200 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        const { data: orgId } = await admin
          .rpc('whatsapp_org_for_phone_number', { p_phone_number_id: phoneNumberId });

        if (!orgId) {
          // A callback for a number no organization has connected. Meta sends
          // these after a disconnect; dropping them is correct.
          console.warn('callback for unknown phone_number_id', phoneNumberId);
          continue;
        }

        // ---- Delivery receipts -------------------------------------------
        for (const status of value.statuses ?? []) {
          const known = ['sent', 'delivered', 'read', 'failed'];
          if (!status.id || !known.includes(status.status)) continue;
          const failure = status.errors?.[0];
          await admin.rpc('whatsapp_apply_status', {
            p_wamid: status.id,
            p_status: status.status,
            p_error_code: failure?.code ?? null,
            p_error_detail: failure?.title ?? failure?.message ?? null,
          });
        }

        // ---- Inbound messages --------------------------------------------
        for (const message of value.messages ?? []) {
          if (!message.id || !message.from) continue;

          const { data: normalized } = await admin
            .rpc('normalize_wa_phone', { raw: message.from });
          const contactPhone = (normalized as string | null) ?? String(message.from);

          // Match to a lead so the rep who owns the relationship can see it.
          // No match means no owner, and the RLS policy then shows the message
          // to managers and owners only — an unknown number is not yet
          // anybody's customer to claim.
          const { data: match } = await admin
            .rpc('lead_for_wa_phone', { target_org: orgId, target_phone: contactPhone });
          const lead = Array.isArray(match) ? match[0] : match;

          const { body, type } = extractBody(message);

          const { error } = await admin
            .from('whatsapp_messages')
            .upsert({
              org_id: orgId,
              owner_id: lead?.owner_id ?? null,
              lead_id: lead?.id ?? null,
              direction: 'in',
              wa_message_id: message.id,
              contact_phone: contactPhone,
              body,
              message_type: type,
              // Inbound has no delivery lifecycle of ours to track; it is here
              // the moment we see it.
              status: 'delivered',
            }, { onConflict: 'wa_message_id', ignoreDuplicates: true });

          if (error) console.error('inbound insert failed', error.message);
        }
      }
    }
  } catch (e) {
    // Swallow and 200. A 500 makes Meta retry the whole batch, which replays
    // every message in it — the unique index makes that harmless but pointless,
    // and repeated failures get the callback URL disabled.
    console.error('webhook processing error', e);
  }

  return new Response('ok', { status: 200 });
});
