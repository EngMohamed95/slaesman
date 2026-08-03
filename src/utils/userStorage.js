/**
 * localStorage is still the database (Phases 3–4 move it to Postgres), but from
 * Phase 1 every per-user bucket is keyed by the Supabase `user.id`, not by the
 * email string. Emails change; ids do not. Re-indexing now makes Phase 4 a
 * straight swap of the storage layer instead of a rewrite of every key.
 */

/** Buckets that were already namespaced, by email: `<prefix><email>`. */
const NAMESPACED_PREFIXES = [
  'salesmate_leads_',
  'salesmate_tasks_',
  'salesmate_campaign_requests_',
  'salesmate_plan_',
  'adtodeal_ai_conversations_',
];

/** Buckets from the single-user era that had no namespace at all. */
const GLOBAL_KEYS = {
  salesmate_plan: 'salesmate_plan_',
  salesmate_onboarded: 'salesmate_onboarded_',
  salesmate_ai_query_count: 'salesmate_ai_query_count_',
  salesmate_profile: 'salesmate_profile_',
};

export const userKey = (prefix, userId) => `${prefix}${userId || 'default'}`;

const copyIfAbsent = (fromKey, toKey) => {
  if (fromKey === toKey) return false;
  if (localStorage.getItem(toKey) !== null) return false;
  const value = localStorage.getItem(fromKey);
  if (value === null) return false;
  localStorage.setItem(toKey, value);
  return true;
};

/**
 * Copies this account's pre-Phase-1 data into its `user.id` namespace. Runs once
 * per account — the marker stops a later sign-in from resurrecting stale
 * email-keyed data over newer id-keyed data. Nothing is deleted: the old keys
 * stay as a manual fallback until Phase 4 takes its own backup.
 */
export const migrateUserStorage = (userId, email) => {
  if (!userId) return;
  const marker = `salesmate_uid_migrated_${userId}`;
  if (localStorage.getItem(marker) === '1') return;

  try {
    if (email) {
      for (const prefix of NAMESPACED_PREFIXES) {
        copyIfAbsent(`${prefix}${email}`, `${prefix}${userId}`);
      }
    }
    for (const [globalKey, prefix] of Object.entries(GLOBAL_KEYS)) {
      copyIfAbsent(globalKey, `${prefix}${userId}`);
    }
    localStorage.setItem(marker, '1');
  } catch (err) {
    // A full quota or a locked-down browser must not block sign-in.
    console.warn('[storage] user re-index skipped:', err);
  }
};
