import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Adding a follow-up, lifted out of the TasksPage sidebar into its own route.
 *
 * The board and the form were competing for the same screen: on a narrow
 * viewport the form squeezed the three columns into an unusable scroll, and on
 * a wide one it sat idle taking a third of the width. Splitting them also gives
 * the form a URL, so /tasks/new can be linked to and survives a refresh.
 */

const toLocalDateTimeValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function AddTaskPage() {
  const { addTask, addFollowUpSequence, leads } = useCRM();
  const { isRTL } = useLanguage();
  const { setPage } = useNavigation();

  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [type, setType] = useState('whatsapp');
  // Lazy initialiser: reading the clock straight into useState() runs on every
  // render and only the first result is ever kept.
  const [dueAt, setDueAt] = useState(() => toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [notes, setNotes] = useState('');
  const [createSequence, setCreateSequence] = useState(false);

  const selectedLead = leads.find(lead => lead.id === leadId);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      titleAr: title.trim(),
      leadId: leadId || null,
      priority,
      type,
      notes: notes.trim(),
      dueAt: new Date(dueAt).toISOString(),
      dueDate: dueAt.slice(0, 10)
    };
    if (createSequence) addFollowUpSequence({ ...payload, startAt: new Date().toISOString() });
    else addTask(payload);
    // Back to the board: the point of submitting is to see the card land in it.
    setPage('tasks');
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setPage('tasks')}
          style={{ padding: '0.45rem 0.7rem' }}
        >
          <BackIcon size={16} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
            {isRTL ? 'إضافة متابعة' : 'Add follow-up'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            {isRTL
              ? 'حدّد المهمة والعميل والموعد، أو أنشئ سلسلة متابعة كاملة دفعة واحدة.'
              : 'Set the task, the lead and the due time — or create a whole follow-up sequence at once.'}
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
              {isRTL ? 'عنوان المهمة *' : 'Task title *'}
            </label>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder={isRTL ? 'مثال: إرسال عرض السعر' : 'e.g. Send quotation'}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
              {isRTL ? 'العميل' : 'Lead'}
            </label>
            <select value={leadId} onChange={event => setLeadId(event.target.value)} style={{ width: '100%' }}>
              <option value="">{isRTL ? 'اختر العميل' : 'Select lead'}</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {isRTL ? lead.nameAr : lead.name} — {lead.phone}
                </option>
              ))}
            </select>
          </div>

          {selectedLead && (
            <div style={{ padding: '0.7rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'start' }}>
              <strong style={{ color: 'var(--text-main)' }}>{isRTL ? selectedLead.nameAr : selectedLead.name}</strong>
              <div>{selectedLead.phone} {selectedLead.email ? `• ${selectedLead.email}` : ''}</div>
              <div style={{ marginTop: '0.25rem' }}>{isRTL ? selectedLead.notesAr : selectedLead.notes}</div>
            </div>
          )}

          <div className="grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                {isRTL ? 'نوع المتابعة' : 'Type'}
              </label>
              <select value={type} onChange={event => setType(event.target.value)} style={{ width: '100%' }}>
                <option value="whatsapp">{isRTL ? 'رسالة واتساب' : 'WhatsApp'}</option>
                <option value="call">{isRTL ? 'مكالمة' : 'Call'}</option>
                <option value="email">{isRTL ? 'بريد إلكتروني' : 'Email'}</option>
                <option value="reminder">{isRTL ? 'تذكير داخلي' : 'Reminder'}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                {isRTL ? 'الأولوية' : 'Priority'}
              </label>
              <select value={priority} onChange={event => setPriority(event.target.value)} style={{ width: '100%' }}>
                <option value="High">{isRTL ? 'أولوية عالية' : 'High priority'}</option>
                <option value="Medium">{isRTL ? 'أولوية متوسطة' : 'Medium priority'}</option>
                <option value="Low">{isRTL ? 'أولوية منخفضة' : 'Low priority'}</option>
              </select>
            </div>
          </div>

          {/* A sequence computes its own due dates from startAt, so a manual one
              would be silently discarded — hide it rather than lie about it. */}
          {!createSequence && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
                {isRTL ? 'موعد الاستحقاق *' : 'Due at *'}
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={event => setDueAt(event.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textAlign: 'start' }}>
              {isRTL ? 'ملاحظات' : 'Notes'}
            </label>
            <textarea
              rows="4"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder={isRTL ? 'نبذة المحادثة أو المطلوب في المتابعة...' : 'Conversation summary or follow-up notes...'}
              style={{ width: '100%' }}
            />
          </div>

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'start' }}>
            <input
              type="checkbox"
              checked={createSequence}
              onChange={event => setCreateSequence(event.target.checked)}
              style={{ width: 'auto', marginTop: 2 }}
            />
            <span>
              <strong style={{ color: 'var(--text-main)' }}>{isRTL ? 'سلسلة متابعة ذكية' : 'Smart follow-up sequence'}</strong>
              <br />{isRTL ? 'إنشاء مهام تلقائيًا بعد 48 ساعة، 4 أيام، وأسبوع.' : 'Create tasks after 48 hours, 4 days and one week.'}
            </span>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" type="submit">
              <Plus size={15} /> {isRTL ? 'إضافة للوحة' : 'Add to board'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setPage('tasks')}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
