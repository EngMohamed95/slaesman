import { useEffect, useMemo, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus, Trash2, Clock3, Phone, MessageCircle, Mail, Bell,
  CalendarClock, UserRound, Sparkles, GripVertical
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', ar: 'مطلوب تنفيذها', en: 'To do', color: '#f59e0b' },
  { id: 'doing', ar: 'جاري المتابعة', en: 'In progress', color: '#6366f1' },
  { id: 'done', ar: 'تمت', en: 'Done', color: '#10b981' }
];

const toLocalDateTimeValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const getDueAt = (task) => task.dueAt || (task.dueDate ? `${task.dueDate}T09:00:00` : null);

export default function TasksPage() {
  const { tasks, addTask, addFollowUpSequence, updateTask, deleteTask, leads } = useCRM();
  const { isRTL } = useLanguage();
  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [type, setType] = useState('whatsapp');
  const [dueAt, setDueAt] = useState(toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [notes, setNotes] = useState('');
  const [createSequence, setCreateSequence] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const normalizedTasks = useMemo(() => tasks.map(task => ({
    ...task,
    status: task.status || (task.completed ? 'done' : 'todo')
  })), [tasks]);

  const selectedLead = leads.find(lead => lead.id === leadId);

  const stats = useMemo(() => {
    const now = Date.now();
    const completed = normalizedTasks.filter(task => task.status === 'done');
    const overdue = normalizedTasks.filter(task => {
      const date = getDueAt(task);
      return task.status !== 'done' && date && new Date(date).getTime() < now;
    });
    const onTime = completed.filter(task => {
      const date = getDueAt(task);
      return !date || !task.completedAt || new Date(task.completedAt) <= new Date(date);
    });
    return {
      total: normalizedTasks.length,
      completed: completed.length,
      overdue: overdue.length,
      onTimeRate: completed.length ? Math.round((onTime.length / completed.length) * 100) : 0
    };
  }, [normalizedTasks]);

  useEffect(() => {
    if (notificationPermission !== 'granted') return undefined;
    const notified = new Set(JSON.parse(localStorage.getItem('salesmate_notified_tasks') || '[]'));
    const checkDueTasks = () => {
      const now = Date.now();
      normalizedTasks.forEach(task => {
        const date = getDueAt(task);
        if (!date || task.status === 'done' || notified.has(task.id)) return;
        const dueTime = new Date(date).getTime();
        if (dueTime <= now && dueTime > now - 24 * 60 * 60 * 1000) {
          const lead = leads.find(item => item.id === task.leadId);
          new Notification(isRTL ? 'موعد متابعة عميل' : 'Client follow-up due', {
            body: `${isRTL ? task.titleAr : task.title}${lead ? ` — ${isRTL ? lead.nameAr : lead.name}` : ''}`
          });
          notified.add(task.id);
        }
      });
      localStorage.setItem('salesmate_notified_tasks', JSON.stringify([...notified]));
    };
    checkDueTasks();
    const interval = setInterval(checkDueTasks, 60000);
    return () => clearInterval(interval);
  }, [normalizedTasks, leads, isRTL, notificationPermission]);

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

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
    setTitle('');
    setNotes('');
  };

  const moveTask = (taskId, status) => {
    updateTask(taskId, { status });
    setDraggedTaskId(null);
  };

  const typeIcon = {
    whatsapp: <MessageCircle size={13} />,
    call: <Phone size={13} />,
    email: <Mail size={13} />,
    reminder: <Bell size={13} />
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{isRTL ? 'مهام المتابعة' : 'Follow-up Tasks'}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {isRTL ? 'لوحة متابعة للعملاء بالمواعيد والتنبيهات وسلاسل المتابعة الذكية.' : 'A client follow-up board with schedules, reminders and smart sequences.'}
          </p>
        </div>
        {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <button className="btn btn-secondary" onClick={handleEnableNotifications}>
            <Bell size={15} /> {isRTL ? 'تفعيل تنبيهات المواعيد' : 'Enable reminders'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          [isRTL ? 'كل المهام' : 'Total tasks', stats.total, '#818cf8'],
          [isRTL ? 'تم تنفيذها' : 'Completed', stats.completed, '#10b981'],
          [isRTL ? 'متأخرة' : 'Overdue', stats.overdue, '#ef4444'],
          [isRTL ? 'الالتزام بالموعد' : 'On-time rate', `${stats.onTimeRate}%`, '#06b6d4']
        ].map(([label, value, color]) => (
          <div className="card" key={label} style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(0, 2.2fr)', gap: '1rem', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{isRTL ? 'إضافة متابعة' : 'Add follow-up'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder={isRTL ? 'مثال: إرسال عرض السعر' : 'e.g. Send quotation'} required />
            <select value={leadId} onChange={event => setLeadId(event.target.value)}>
              <option value="">{isRTL ? 'اختر العميل' : 'Select lead'}</option>
              {leads.map(lead => <option key={lead.id} value={lead.id}>{isRTL ? lead.nameAr : lead.name} — {lead.phone}</option>)}
            </select>
            {selectedLead && (
              <div style={{ padding: '0.7rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-main)' }}>{isRTL ? selectedLead.nameAr : selectedLead.name}</strong>
                <div>{selectedLead.phone} {selectedLead.email ? `• ${selectedLead.email}` : ''}</div>
                <div style={{ marginTop: '0.25rem' }}>{isRTL ? selectedLead.notesAr : selectedLead.notes}</div>
              </div>
            )}
            <div className="grid-2">
              <select value={type} onChange={event => setType(event.target.value)}>
                <option value="whatsapp">{isRTL ? 'رسالة واتساب' : 'WhatsApp'}</option>
                <option value="call">{isRTL ? 'مكالمة' : 'Call'}</option>
                <option value="email">{isRTL ? 'بريد إلكتروني' : 'Email'}</option>
                <option value="reminder">{isRTL ? 'تذكير داخلي' : 'Reminder'}</option>
              </select>
              <select value={priority} onChange={event => setPriority(event.target.value)}>
                <option value="High">{isRTL ? 'أولوية عالية' : 'High priority'}</option>
                <option value="Medium">{isRTL ? 'أولوية متوسطة' : 'Medium priority'}</option>
                <option value="Low">{isRTL ? 'أولوية منخفضة' : 'Low priority'}</option>
              </select>
            </div>
            {!createSequence && <input type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} required />}
            <textarea rows="3" value={notes} onChange={event => setNotes(event.target.value)} placeholder={isRTL ? 'نبذة المحادثة أو المطلوب في المتابعة...' : 'Conversation summary or follow-up notes...'} />
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={createSequence} onChange={event => setCreateSequence(event.target.checked)} style={{ width: 'auto', marginTop: 2 }} />
              <span>
                <strong style={{ color: 'var(--text-main)' }}>{isRTL ? 'سلسلة متابعة ذكية' : 'Smart follow-up sequence'}</strong>
                <br />{isRTL ? 'إنشاء مهام تلقائيًا بعد 48 ساعة، 4 أيام، وأسبوع.' : 'Create tasks after 48 hours, 4 days and one week.'}
              </span>
            </label>
            <button className="btn btn-primary" type="submit"><Plus size={15} /> {isRTL ? 'إضافة للوحة' : 'Add to board'}</button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(230px, 1fr))', gap: '0.75rem', overflowX: 'auto' }}>
          {COLUMNS.map(column => {
            const columnTasks = normalizedTasks.filter(task => task.status === column.id);
            return (
              <section
                key={column.id}
                onDragOver={event => event.preventDefault()}
                onDrop={() => draggedTaskId && moveTask(draggedTaskId, column.id)}
                style={{ minHeight: 470, padding: '0.7rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.018)', border: '1px solid var(--card-border)' }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', padding: '0.25rem' }}>
                  <strong style={{ color: column.color }}>{isRTL ? column.ar : column.en}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{columnTasks.length}</span>
                </header>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {columnTasks.map(task => {
                    const lead = leads.find(item => item.id === task.leadId);
                    const date = getDueAt(task);
                    const overdue = column.id !== 'done' && date && new Date(date) < new Date();
                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        style={{ padding: '0.75rem', borderRadius: '0.65rem', background: 'var(--bg-card)', border: `1px solid ${overdue ? 'rgba(239,68,68,.5)' : 'var(--card-border)'}`, cursor: 'grab' }}
                      >
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <GripVertical size={14} color="var(--text-muted)" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{isRTL ? task.titleAr : task.title}</div>
                            {lead && <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginTop: '0.4rem', color: '#a5b4fc', fontSize: '0.72rem' }}><UserRound size={12} /> {isRTL ? lead.nameAr : lead.name}</div>}
                          </div>
                          <button onClick={() => deleteTask(task.id)} style={{ border: 0, background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                        </div>
                        {task.notes && <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, maxHeight: 42, overflow: 'hidden' }}>{task.notes}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.68rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: overdue ? '#ef4444' : 'var(--text-muted)' }}>
                            <Clock3 size={11} /> {date ? new Date(date).toLocaleString(isRTL ? 'ar-EG' : undefined, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: task.priority === 'High' ? '#ef4444' : '#f59e0b' }}>{typeIcon[task.type] || <CalendarClock size={13} />} {task.sequenceStep || task.priority}</span>
                        </div>
                        {lead && (
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.6rem' }}>
                            <a className="btn btn-secondary" href={`https://web.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '').replace(/^00/, '')}`} target="_blank" rel="noreferrer" style={{ padding: '0.28rem 0.45rem', fontSize: '0.68rem', textDecoration: 'none' }}><MessageCircle size={11} /></a>
                            <a className="btn btn-secondary" href={`tel:${lead.phone}`} style={{ padding: '0.28rem 0.45rem', fontSize: '0.68rem', textDecoration: 'none' }}><Phone size={11} /></a>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {columnTasks.length === 0 && <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}><Sparkles size={18} style={{ marginBottom: 5 }} /><br />{isRTL ? 'اسحب المهام إلى هنا' : 'Drop tasks here'}</div>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
