import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * The price list, read from `plans` + `plan_prices`.
 *
 * Prices used to be hardcoded in two places — SubscriptionPage had a CURRENCIES
 * table and UpgradePaywall had its own if/else chain — so the paywall could
 * quote a number the checkout page disagreed with. Both now read this.
 *
 * The catalog tables are world-readable by design (the landing page prices
 * itself to signed-out visitors) and have no write policy at all, so nothing a
 * client sends can reprice a plan.
 */
export function usePlanCatalog() {
  const [plans, setPlans] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('not_configured');
      return undefined;
    }

    let active = true;

    Promise.all([
      supabase.from('plans').select('code, name_en, name_ar, rank, is_public').order('rank'),
      supabase.from('plan_prices').select('plan_code, currency, amount, interval'),
    ])
      .then(([planRes, priceRes]) => {
        if (!active) return;
        const failure = planRes.error || priceRes.error;
        if (failure) {
          console.warn('[billing] catalog load failed:', failure.message);
          setError(failure.message);
          return;
        }
        setPlans(planRes.data || []);
        // { SAR: { Basic: 100, Pro: 399, Growth: 999 }, … }
        const byCurrency = {};
        for (const row of priceRes.data || []) {
          if (row.interval !== 'month') continue;
          byCurrency[row.currency] = byCurrency[row.currency] || {};
          byCurrency[row.currency][row.plan_code] = Number(row.amount);
        }
        setPrices(byCurrency);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'catalog_failed');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  /** Monthly price for a plan in a currency, or null when unknown. */
  const priceFor = (planCode, currency) => {
    const value = prices[currency]?.[planCode];
    return value === undefined ? null : value;
  };

  return { plans, prices, priceFor, loading, error };
}

/** Display metadata that is genuinely presentational, so it stays client-side. */
export const CURRENCY_META = {
  SAR: { symbolAr: 'ريال', symbolEn: 'SAR', flag: '🇸🇦', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal' },
  USD: { symbolAr: '$', symbolEn: '$', flag: '🇺🇸', nameAr: 'دولار أمريكي', nameEn: 'US Dollar' },
  AED: { symbolAr: 'درهم', symbolEn: 'AED', flag: '🇦🇪', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham' },
  EGP: { symbolAr: 'جنيه', symbolEn: 'EGP', flag: '🇪🇬', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound' },
  JOD: { symbolAr: 'دينار', symbolEn: 'JOD', flag: '🇯🇴', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar' },
};
