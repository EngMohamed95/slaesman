import { supabase } from '../lib/supabase';

/**
 * The only way to reach the model.
 *
 * What this replaces (src/utils/gemini.js, deleted):
 *
 * - The API key came from localStorage and was put in a query string on a
 *   request made by the browser. Anyone could read it out of devtools, and any
 *   user could paste in someone else's.
 * - `systemInstruction` was a free-form string built in the page, so whatever a
 *   customer typed could rewrite the model's instructions.
 * - Every failure fell back to `getSimulatedResponse()`, a hand-written canned
 *   answer. A revoked key, a network outage and a real answer were
 *   indistinguishable in the UI. Failures are now surfaced.
 *
 * The client now names a `task`; the server owns the instruction for it.
 */

export class AIError extends Error {
  constructor(code, { status = 0, used = null, quota = null } = {}) {
    super(code);
    this.name = 'AIError';
    this.code = code;
    this.status = status;
    this.used = used;
    this.quota = quota;
  }
}

/** Bilingual, actionable text for every failure the proxy can return. */
export const describeAIError = (error, isRTL) => {
  const code = error?.code || 'unknown';
  const messages = {
    ai_not_configured: {
      ar: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم. تواصل مع الدعم.',
      en: 'The AI service is not configured on the server. Please contact support.',
    },
    quota_exhausted: {
      ar: `استنفدت حصتك من طلبات الذكاء الاصطناعي هذا الشهر${error?.quota ? ` (${error.used}/${error.quota})` : ''}. رقّ باقتك للمتابعة.`,
      en: `You have used all your AI requests this month${error?.quota ? ` (${error.used}/${error.quota})` : ''}. Upgrade your plan to continue.`,
    },
    feature_not_included: {
      ar: 'هذه الميزة غير متاحة في باقتك الحالية.',
      en: 'This feature is not included in your current plan.',
    },
    subscription_inactive: {
      ar: 'اشتراكك غير نشط. جدّد الاشتراك لاستخدام الذكاء الاصطناعي.',
      en: 'Your subscription is not active. Renew it to use AI features.',
    },
    no_organization: {
      ar: 'حسابك غير مرتبط بمؤسسة.',
      en: 'Your account is not linked to an organization.',
    },
    unauthorized: {
      ar: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
      en: 'Your session expired. Please sign in again.',
    },
    model_error: {
      ar: 'تعذّر على خدمة الذكاء الاصطناعي إكمال الطلب. حاول مرة أخرى.',
      en: 'The AI service could not complete the request. Please try again.',
    },
    upstream_unreachable: {
      ar: 'تعذّر الوصول إلى خدمة الذكاء الاصطناعي. تحقّق من اتصالك.',
      en: 'Could not reach the AI service. Check your connection.',
    },
    // A 404 means the ai-proxy function was never deployed to this project.
    // It used to fall into upstream_unreachable, which told the operator to
    // check their connection — so a missing deployment looked like a network
    // fault and stayed unfixed.
    function_not_deployed: {
      ar: 'دالة ai-proxy غير منشورة على الخادم. انشرها عبر: supabase functions deploy ai-proxy',
      en: 'The ai-proxy function is not deployed. Deploy it with: supabase functions deploy ai-proxy',
    },
    empty_response: {
      ar: 'أعاد النموذج رداً فارغاً. حاول بصياغة مختلفة.',
      en: 'The model returned an empty response. Try rephrasing.',
    },
  };
  const known = messages[code];
  if (known) return isRTL ? known.ar : known.en;
  return isRTL
    ? 'تعذّر إتمام طلب الذكاء الاصطناعي. حاول مرة أخرى.'
    : 'The AI request could not be completed. Please try again.';
};

/**
 * @param {string} task    One of the task names the proxy knows.
 * @param {string} input   The user's own text. Never an instruction to the model.
 * @param {object} context Small scalars only — `lang`, ids, filters. Do NOT put
 *                         rows in here; the server reads them from the database
 *                         under the caller's own RLS.
 */
export const callAI = async (task, input, context = {}) => {
  if (!supabase) throw new AIError('ai_not_configured');

  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: { task, input, context },
  });

  if (error) {
    // supabase-js wraps a non-2xx in FunctionsHttpError and keeps the Response
    // on `.context`; the proxy's error code is in that body.
    let payload;
    try {
      payload = await error.context?.json?.();
    } catch {
      payload = null;
    }
    const status = error.context?.status || 0;
    // The gateway's own 404 body carries `code`/`message`, not our `error`,
    // so without this the fallback swallowed it as a connectivity problem.
    const fallback = status === 404 ? 'function_not_deployed' : 'upstream_unreachable';

    throw new AIError(payload?.error || fallback, {
      status,
      used: payload?.used ?? null,
      quota: payload?.quota ?? null,
    });
  }

  if (!data?.text) throw new AIError('empty_response');
  return data;
};

/** Convenience for the JSON-returning tasks. */
export const callAIJson = async (task, input, context = {}) => {
  const { text, used, quota } = await callAI(task, input, context);
  try {
    // Models still occasionally wrap JSON in a fence despite the mime type.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
    return { data: JSON.parse(cleaned), used, quota };
  } catch {
    throw new AIError('empty_response');
  }
};
