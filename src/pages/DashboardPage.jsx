import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { 
  Users, UserCheck, Clock, ShieldAlert, Sparkles, 
  DollarSign, TrendingUp, Compass, Plus, ArrowRight, MessageCircle 
} from 'lucide-react';

export default function DashboardPage({ setPage, setSelectedLeadId }) {
  const { leads, tasks, toggleTask } = useCRM();
  const { t, isRTL } = useLanguage();
  const { plan } = useApp();
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Compute metrics
  const totalLeadsCount = leads.length;
  const newLeadsToday = leads.filter(l => l.status === 'New').length;
  const dueFollowupsToday = tasks.filter(t => !t.completed).length;
  const noResponseLeads = leads.filter(l => l.status === 'No Response').length;
  const hotLeadsCount = leads.filter(l => l.interestLevel === 'High' && l.status !== 'Won' && l.status !== 'Lost').length;

  const expectedSalesValue = leads
    .filter(l => l.status !== 'Lost' && l.status !== 'Not Interested')
    .reduce((sum, current) => sum + (current.expectedValue || 0), 0);

  const wonCount = leads.filter(l => l.status === 'Won').length;
  const lostCount = leads.filter(l => l.status === 'Lost').length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;

  // Best source determination
  const sourceCounts = leads.reduce((acc, lead) => {
    const src = isRTL ? (lead.sourceAr || lead.source) : lead.source;
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  let bestSource = Object.keys(sourceCounts).reduce((a, b) => sourceCounts[a] > sourceCounts[b] ? a : b, 'None');

  const todayTasks = tasks.filter(task => !task.completed).slice(0, 3);
  const recentLeads = leads.slice(0, 4);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('navDashboard')}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {isRTL ? "مرحباً بك! إليك تقرير نشاطك البيعي اليوم." : "Welcome back! Here is your sales activity overview."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setPage('crm')}>
            <Plus size={16} /> {t('addLead')}
          </button>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('totalLeads')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalLeadsCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--secondary-glow)', color: 'var(--secondary)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('newLeads')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{newLeadsToday}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--accent-glow)', color: 'var(--accent)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('dueFollowups')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dueFollowupsToday}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--danger-glow)', color: 'var(--danger)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('noResponse')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{noResponseLeads}</div>
          </div>
        </div>
      </div>

      {/* Metrics Row 2 */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('hotLeads')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '0.25rem' }}>{hotLeadsCount}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('expectedValue')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.25rem' }}>
            {isRTL ? `${expectedSalesValue.toLocaleString()} ريال` : `$${expectedSalesValue.toLocaleString()}`}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('conversionRate')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '0.25rem' }}>{conversionRate}%</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('bestSource')}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a5b4fc', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bestSource}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Column: Recent Leads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('recentLeads')}</h3>
              <button 
                onClick={() => setPage('crm')} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}
              >
                {isRTL ? "عرض الكل" : "View All"} <ArrowRight size={14} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('status')}</th>
                    <th>{t('budget')}</th>
                    <th>{t('interestLevel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setPage('leadDetails');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{isRTL ? lead.nameAr : lead.name}</td>
                      <td>
                        <span className={`badge badge-${lead.status.toLowerCase().replace(' ', '')}`}>
                          {isRTL ? lead.statusAr : lead.status}
                        </span>
                      </td>
                      <td>
                        {isRTL ? `${lead.budget.toLocaleString()} ريال` : `$${lead.budget.toLocaleString()}`}
                      </td>
                      <td>
                        <span style={{ 
                          color: lead.interestLevel === 'High' ? 'var(--danger)' : lead.interestLevel === 'Medium' ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: 'bold'
                        }}>
                          {isRTL ? lead.interestLevelAr : lead.interestLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick AI Assist Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Sparkles style={{ color: 'var(--secondary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{isRTL ? "اقتراحات المساعد الذكي اليومية" : "AI Suggested Next Action"}</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              {isRTL 
                ? "أكملت سارة كونر معاينة الفيلا الفاخرة بالأمس. نقترح توليد رسالة واتساب لإرسال تفاصيل الدفعة الأولى وجدول الاستلام اليوم."
                : "Sarah Connor completed the villa viewing yesterday. We recommend generating a WhatsApp message detailing the initial payment and delivery terms today."}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => {
                setSelectedLeadId('2');
                setPage('whatsapp');
              }}>
                <MessageCircle size={16} /> {t('whatsappQuickMsg')}
              </button>
              <button className="btn btn-secondary" onClick={() => setPage('aiAssistant')}>
                {t('navAIAssistant')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up Tasks */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{isRTL ? "متابعات مستحقة اليوم" : "Follow-ups Due Today"}</h3>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setPage('tasks')}>
              {isRTL ? "كل المهام" : "All Tasks"}
            </button>
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              {isRTL ? "رائع! لا توجد مهام معلقة لليوم." : "Great! No pending follow-ups for today."}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {todayTasks.map((task) => (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={() => toggleTask(task.id)}
                    style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.1rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 500, 
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-main)'
                    }}>
                      {isRTL ? task.titleAr : task.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-followup" style={{ fontSize: '0.7rem' }}>
                        {isRTL ? "مستحق اليوم" : "Due Today"}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: task.priority === 'High' ? 'var(--danger)' : task.priority === 'Medium' ? 'var(--accent)' : 'var(--text-muted)' 
                      }}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
