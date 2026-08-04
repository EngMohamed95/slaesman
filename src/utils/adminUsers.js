import { supabase } from '../lib/supabase';

/**
 * The only way the browser can create an account for someone else.
 *
 * Mirrors src/utils/ai.js: the client names an action, the server owns the
 * privileged work. Nothing here can be made to grant a role — the function
 * offers no verb for it.
 */

export class AdminError extends Error {
  constructor(code, { status = 0, detail = null } = {}) {
    super(code);
    this.name = 'AdminError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

/** Bilingual, actionable text for every failure the function can return. */
export const describeAdminError = (error, isRTL) => {
  const messages = {
    forbidden: {
      ar: 'هذا الإجراء متاح لمشرفي المنصة فقط.',
      en: 'This action is restricted to platform administrators.',
    },
    unauthorized: {
      ar: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
      en: 'Your session expired. Please sign in again.',
    },
    invalid_email: {
      ar: 'صيغة البريد الإلكتروني غير صحيحة.',
      en: 'That email address is not valid.',
    },
    weak_password: {
      ar: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
      en: 'The password must be at least 8 characters.',
    },
    email_taken: {
      ar: 'يوجد حساب مسجّل بهذا البريد بالفعل.',
      en: 'An account with this email already exists.',
    },
    unknown_plan: {
      ar: 'الباقة المختارة غير موجودة.',
      en: 'That plan does not exist.',
    },
    plan_assign_failed: {
      ar: 'أُنشئ الحساب لكن تعذّر تفعيل الباقة. عيّنها من صفحة الاشتراكات.',
      en: 'The account was created but the plan could not be applied. Set it from the subscriptions page.',
    },
    create_failed: {
      ar: 'تعذّر إنشاء الحساب.',
      en: 'The account could not be created.',
    },
    not_configured: {
      ar: 'خدمة الحسابات غير مهيأة على الخادم.',
      en: 'The accounts service is not configured on the server.',
    },
  };
  const known = messages[error?.code];
  const base = known ? (isRTL ? known.ar : known.en) : (isRTL
    ? 'تعذّر إتمام الطلب. حاول مرة أخرى.'
    : 'The request could not be completed. Please try again.');
  // `detail` carries the auth server's own wording (password policy, banned
  // domain). Losing it turned every rejection into the same useless sentence.
  return error?.detail ? `${base} (${error.detail})` : base;
};

/**
 * @param {object} payload email, password, fullName, agencyName, phone, planCode
 * @returns {Promise<{ id: string, email: string, plan: string|null }>}
 */
export const createAccount = async (payload) => {
  if (!supabase) throw new AdminError('not_configured');

  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'create', ...payload },
  });

  if (error) {
    // supabase-js wraps a non-2xx in FunctionsHttpError and keeps the Response
    // on `.context`; the function's error code is in that body.
    let body;
    try {
      body = await error.context?.json?.();
    } catch {
      body = null;
    }
    throw new AdminError(body?.error || 'create_failed', {
      status: error.context?.status || 0,
      detail: body?.detail || null,
    });
  }

  return data;
};
