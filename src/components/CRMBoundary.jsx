import { useCRM } from '../context/CRMContext';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const Centered = ({ children }) => (
  <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: '2rem 1rem' }}>
    <div style={{ textAlign: 'center', maxWidth: '32rem' }}>{children}</div>
  </div>
);

/**
 * Holds the authenticated pages back until the first load resolves.
 *
 * Rows arrive over the network now. Rendering a page against an empty array
 * first makes `/lead/:id` flash its not-found screen and the dashboard flash
 * zeroes — and it is why LeadDetailsPage had to hoist its hooks.
 */
export default function CRMBoundary({ children }) {
  const { dataLoading, loadError, refresh } = useCRM();
  const { orgError } = useApp();
  const { isRTL } = useLanguage();

  if (dataLoading) {
    return <Centered><span style={{ color: 'var(--text-muted)' }}>…</span></Centered>;
  }

  if (orgError === 'no_membership') {
    return (
      <Centered>
        <AlertTriangle size={32} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
          {isRTL ? 'حسابك غير مرتبط بأي مؤسسة' : 'Your account has no organization'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {isRTL
            ? 'لا يمكن حفظ أي بيانات قبل ربط الحساب بمؤسسة. تواصل مع الدعم.'
            : 'Nothing can be saved until this account belongs to an organization. Please contact support.'}
        </p>
      </Centered>
    );
  }

  if (loadError) {
    return (
      <Centered>
        <AlertTriangle size={32} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
          {isRTL ? 'تعذّر تحميل بياناتك' : 'Could not load your data'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
          {loadError}
        </p>
        <button
          className="btn btn-primary"
          onClick={refresh}
          style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 1.2rem' }}
        >
          <RefreshCw size={16} />
          {isRTL ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </Centered>
    );
  }

  return children;
}

/**
 * Non-blocking banner for a write that failed after the UI already showed it as
 * done. The optimistic update has been rolled back by the time this renders.
 */
export function SyncErrorBanner() {
  const { syncError, dismissSyncError } = useCRM();
  const { isRTL } = useLanguage();
  if (!syncError) return null;

  const noOrg = syncError.message === 'no_organization';
  return (
    <div
      role="alert"
      style={{
        background: 'var(--danger-glow)',
        color: 'var(--danger)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '0.5rem',
        padding: '0.7rem 0.9rem',
        margin: '0 0 1rem',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}
    >
      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, textAlign: 'start' }}>
        {noOrg
          ? (isRTL ? 'لم يُحفظ التغيير: الحساب غير مرتبط بمؤسسة.' : 'Not saved: this account has no organization.')
          : (isRTL ? `لم يُحفظ التغيير وتم التراجع عنه. ${syncError.message}` : `Change was rolled back and not saved. ${syncError.message}`)}
      </span>
      <button
        onClick={dismissSyncError}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
      >
        ✕
      </button>
    </div>
  );
}
