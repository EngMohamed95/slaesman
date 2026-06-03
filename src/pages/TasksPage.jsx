import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask, leads } = useCRM();
  const { t, isRTL } = useLanguage();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    addTask({
      title: newTaskTitle,
      titleAr: newTaskTitle,
      leadId: selectedLead || null,
      priority,
      dueDate: dueDate || new Date().toISOString().split('T')[0]
    });

    setNewTaskTitle('');
    setSelectedLead('');
    setDueDate('');
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('navTasks')}</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          {isRTL ? "قم بجدولة ومتابعة مهام تواصلك مع العملاء لضمان استجابة سريعة." : "Schedule and follow up on client tasks to maximize closing rates."}
        </p>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Column: Create Task Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 1.25rem' }}>{isRTL ? "إضافة مهمة جديدة" : "Add New Task"}</h3>
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                {isRTL ? "عنوان المهمة / الإجراء" : "Task Action"}
              </label>
              <input 
                type="text" 
                placeholder={isRTL ? "مثال: إرسال عرض الأسعار المعدل" : "e.g., Send new quotation"} 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                {isRTL ? "ربط مع عميل (اختياري)" : "Associate with Lead (Optional)"}
              </label>
              <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)}>
                <option value="">{isRTL ? "غير مرتبط بعميل" : "No Lead Associated"}</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{isRTL ? lead.nameAr : lead.name}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "الأولوية" : "Priority"}
                </label>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="High">{isRTL ? "عالية" : "High"}</option>
                  <option value="Medium">{isRTL ? "متوسطة" : "Medium"}</option>
                  <option value="Low">{isRTL ? "منخفضة" : "Low"}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  {isRTL ? "تاريخ الاستحقاق" : "Due Date"}
                </label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={16} /> {isRTL ? "إضافة المهمة" : "Add Task"}
            </button>
          </form>
        </div>

        {/* Right Column: Tasks Checklist */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{isRTL ? "قائمة المهام والمتابعات" : "Follow-ups Checklist"}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'pending', 'completed'].map(f => (
                <button 
                  key={f}
                  className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', boxShadow: 'none' }}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? (isRTL ? "الكل" : "All") : f === 'pending' ? (isRTL ? "المعلقة" : "Pending") : (isRTL ? "المكتملة" : "Completed")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                {isRTL ? "لا توجد مهام مطابقة للفلتر المحدد." : "No tasks found matching current filter."}
              </div>
            ) : (
              filteredTasks.map(task => {
                const associatedLead = leads.find(l => l.id === task.leadId);
                return (
                  <div 
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: task.completed ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${task.completed ? 'transparent' : 'var(--card-border)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <button 
                        onClick={() => toggleTask(task.id)}
                        style={{ background: 'none', border: 'none', color: task.completed ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>
                      <div>
                        <div style={{ 
                          fontWeight: 600, 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                          fontSize: '0.95rem'
                        }}>
                          {isRTL ? task.titleAr : task.title}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {associatedLead && (
                            <span>
                              {isRTL ? "العميل: " : "Lead: "} 
                              <strong style={{ color: 'var(--text-main)' }}>
                                {isRTL ? associatedLead.nameAr : associatedLead.name}
                              </strong>
                            </span>
                          )}
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={12} style={{ color: task.priority === 'High' ? 'var(--danger)' : 'var(--accent)' }} />
                            {task.priority}
                          </span>
                          <span>•</span>
                          <span>{task.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem', color: 'var(--danger)' }}
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
